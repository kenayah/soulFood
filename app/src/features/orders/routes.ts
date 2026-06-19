import { Hono } from "hono"
import { getDb, queryOne } from "../../lib/d1"
import { orderSchema, statusUpdateSchema } from "../../lib/validators"
import {
  createOrder,
  upsertCustomer,
  getOrders,
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  cancelOrder,
  getOrderStatusLog,
} from "./service"
import { createTransaction, getProvider } from "../payments/service"
import type { AppBindings } from "../../env"

const app = new Hono<{ Bindings: AppBindings }>()

app.post("/", async (c) => {
  const body = await c.req.json()
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const { items, ...orderData } = parsed.data

  // Check existing customer for cash eligibility
  const existing = await queryOne<{ id: number; total_orders: number }>(
    db,
    "SELECT id, total_orders FROM customers WHERE phone = ?",
    orderData.phone,
  )

  if (orderData.paymentMethod === "cash") {
    const prevOrders = existing?.total_orders ?? 0
    if (prevOrders <= 3) {
      return c.json({
        error: {
          message: "Cash on delivery is available for customers with more than 3 orders. Please pay with card for this order.",
          code: "CASH_NOT_ELIGIBLE",
        },
      }, 403)
    }
  }

  // Upsert customer by phone (increments total_orders)
  const customerId = await upsertCustomer(db, {
    name: orderData.customerName,
    phone: orderData.phone,
    deliveryAddress: orderData.deliveryAddress,
    notes: orderData.notes,
  })

  // Resolve item names and prices from DB
  const itemDetails = await Promise.all(
    items.map(async (item) => {
      if (item.itemName) {
        const price = await c.env.DB.prepare(
          "SELECT price FROM menu_items WHERE id = ?",
        ).bind(item.menuItemId).first<{ price: number }>()
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          itemName: item.itemName,
          unitPrice: price?.price ?? 0,
        }
      }
      const menuItem = await c.env.DB.prepare(
        "SELECT id, name, price FROM menu_items WHERE id = ?",
      ).bind(item.menuItemId).first<{ id: number; name: string; price: number }>()
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        itemName: menuItem?.name ?? "Unknown",
        unitPrice: menuItem?.price ?? 0,
      }
    }),
  )

  const order = await createOrder(db, { ...orderData, items: itemDetails, customerId })

  // For card payments, create Yoco checkout
  if (orderData.paymentMethod === "card") {
    const prov = getProvider("card")
    if (!prov) {
      return c.json({ error: "Card payment is not available right now" }, 503)
    }
    const { redirectUrl } = await createTransaction(db, order.id, "card", order.total)
    return c.json({ ...order, redirectUrl }, 201)
  }

  return c.json(order, 201)
})

app.get("/", async (c) => {
  const db = getDb(c.env)
  const status = c.req.query("status")
  const page = parseInt(c.req.query("page") ?? "1")
  const limit = parseInt(c.req.query("limit") ?? "20")

  const result = await getOrders(db, { status, page, limit })
  return c.json(result)
})

app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const db = getDb(c.env)
  const order = await getOrderById(db, id)
  if (!order) return c.json({ error: "Order not found" }, 404)

  const items = await getOrderItems(db, id)
  const statusLog = await getOrderStatusLog(db, id)
  return c.json({ ...order, items, statusLog })
})

app.patch("/:id/status", async (c) => {
  const id = parseInt(c.req.param("id"))
  const body = await c.req.json()
  const parsed = statusUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const order = await updateOrderStatus(db, id, parsed.data.status)
  if (!order) return c.json({ error: "Order not found" }, 404)

  return c.json(order)
})

app.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const db = getDb(c.env)
  const order = await cancelOrder(db, id)
  if (!order) return c.json({ error: "Order not found" }, 404)

  return c.json({ message: "Order cancelled", order })
})

export default app

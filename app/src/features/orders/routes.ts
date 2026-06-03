import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../../lib/d1"
import { orderSchema, statusUpdateSchema } from "../../lib/validators"
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  cancelOrder,
  getOrderStatusLog,
} from "./service"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.post("/", async (c) => {
  const body = await c.req.json()
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const { items, ...orderData } = parsed.data

  // Resolve item names and prices from DB
  const itemDetails = await Promise.all(
    items.map(async (item) => {
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

  const order = await createOrder(db, { ...orderData, items: itemDetails })
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

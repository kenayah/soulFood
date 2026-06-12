import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../../lib/d1"
import { ingredientSchema, stockAdjustSchema, supplierSchema, purchaseOrderSchema } from "../../lib/validators"
import {
  getIngredients,
  createIngredient,
  adjustStock,
  getStockMovements,
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
} from "./service"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.get("/ingredients", async (c) => {
  const db = getDb(c.env)
  const belowMin = c.req.query("belowMin") === "true"
  const ingredients = await getIngredients(db, belowMin)
  return c.json(ingredients)
})

app.post("/ingredients", async (c) => {
  const body = await c.req.json()
  const parsed = ingredientSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const ingredient = await createIngredient(db, {
    name: parsed.data.name,
    unit: parsed.data.unit,
    currentStock: parsed.data.currentStock,
    minStockLevel: parsed.data.minStockLevel,
    maxStockLevel: parsed.data.maxStockLevel,
    supplierId: parsed.data.supplierId,
  })
  return c.json(ingredient, 201)
})

app.patch("/ingredients/:id/stock", async (c) => {
  const id = parseInt(c.req.param("id"))
  const body = await c.req.json()
  const parsed = stockAdjustSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  try {
    const ingredient = await adjustStock(db, id, parsed.data.adjustment)
    if (!ingredient) return c.json({ error: "Ingredient not found" }, 404)
    return c.json(ingredient)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

app.get("/ingredients/:id/history", async (c) => {
  const id = parseInt(c.req.param("id"))
  const db = getDb(c.env)
  const limit = parseInt(c.req.query("limit") ?? "20")
  const movements = await getStockMovements(db, id, limit)
  return c.json(movements)
})

app.get("/suppliers", async (c) => {
  const db = getDb(c.env)
  const suppliers = await getSuppliers(db)
  return c.json(suppliers)
})

app.post("/suppliers", async (c) => {
  const body = await c.req.json()
  const parsed = supplierSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const supplier = await createSupplier(db, parsed.data)
  return c.json(supplier, 201)
})

app.get("/purchase-orders", async (c) => {
  const db = getDb(c.env)
  const orders = await getPurchaseOrders(db)
  return c.json(orders)
})

app.post("/purchase-orders", async (c) => {
  const body = await c.req.json()
  const parsed = purchaseOrderSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const po = await createPurchaseOrder(db, parsed.data)
  return c.json(po, 201)
})

export default app

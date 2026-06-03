import type { D1Database } from "@cloudflare/workers-types"
import { getDb, queryAll, queryOne, execute } from "../../lib/d1"

export interface IngredientRow {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock_level: number
  max_stock_level: number | null
  reorder_quantity: number | null
  unit_cost: number | null
  supplier_id: number | null
  created_at: string
}

export async function getIngredients(db: D1Database, belowMin?: boolean): Promise<IngredientRow[]> {
  if (belowMin) {
    return queryAll<IngredientRow>(
      db,
      "SELECT * FROM ingredients WHERE current_stock <= min_stock_level ORDER BY name",
    )
  }
  return queryAll<IngredientRow>(db, "SELECT * FROM ingredients ORDER BY name")
}

export async function createIngredient(
  db: D1Database,
  data: {
    name: string
    unit: string
    currentStock: number
    minStockLevel: number
    maxStockLevel?: number
    supplierId?: number
  },
): Promise<IngredientRow | null> {
  return queryOne<IngredientRow>(
    db,
    `INSERT INTO ingredients (name, unit, current_stock, min_stock_level, max_stock_level, supplier_id)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    data.name,
    data.unit,
    data.currentStock,
    data.minStockLevel,
    data.maxStockLevel ?? null,
    data.supplierId ?? null,
  )
}

export async function adjustStock(
  db: D1Database,
  ingredientId: number,
  adjustment: number,
): Promise<IngredientRow | null> {
  const ingredient = await queryOne<IngredientRow>(
    db,
    "SELECT * FROM ingredients WHERE id = ?",
    ingredientId,
  )
  if (!ingredient) return null

  const newStock = ingredient.current_stock + adjustment
  if (newStock < 0) throw new Error("Stock cannot be negative")

  await execute(
    db,
    "UPDATE ingredients SET current_stock = ?, updated_at = datetime('now') WHERE id = ?",
    newStock,
    ingredientId,
  )

  return queryOne<IngredientRow>(db, "SELECT * FROM ingredients WHERE id = ?", ingredientId)
}

export async function getSuppliers(db: D1Database): Promise<{
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  lead_time_days: number
  active: boolean
}[]> {
  return queryAll(db, "SELECT * FROM suppliers WHERE active = 1 ORDER BY name")
}

export async function createSupplier(
  db: D1Database,
  data: {
    name: string
    contactPerson?: string
    phone?: string
    email?: string
    leadTimeDays?: number
  },
): Promise<unknown> {
  return queryOne(
    db,
    `INSERT INTO suppliers (name, contact_person, phone, email, lead_time_days)
     VALUES (?, ?, ?, ?, ?) RETURNING *`,
    data.name,
    data.contactPerson ?? null,
    data.phone ?? null,
    data.email ?? null,
    data.leadTimeDays ?? 1,
  )
}

export async function getPurchaseOrders(db: D1Database): Promise<unknown[]> {
  return queryAll(
    db,
    `SELECT po.*, s.name as supplier_name
     FROM purchase_orders po
     JOIN suppliers s ON po.supplier_id = s.id
     ORDER BY po.created_at DESC`,
  )
}

export async function createPurchaseOrder(
  db: D1Database,
  data: {
    supplierId: number
    items: { ingredientId: number; quantityOrdered: number; unitPrice: number }[]
  },
): Promise<unknown> {
  const po = await queryOne<{ id: number }>(
    db,
    "INSERT INTO purchase_orders (supplier_id) VALUES (?) RETURNING id",
    data.supplierId,
  )

  if (!po) throw new Error("Failed to create purchase order")

  for (const item of data.items) {
    await execute(
      db,
      `INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity_ordered, unit_price)
       VALUES (?, ?, ?, ?)`,
      po.id,
      item.ingredientId,
      item.quantityOrdered,
      item.unitPrice,
    )
  }

  return queryOne(db, "SELECT * FROM purchase_orders WHERE id = ?", po.id)
}

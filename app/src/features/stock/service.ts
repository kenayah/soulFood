import type { D1Database } from "@cloudflare/workers-types"
import { getDb, queryAll, queryOne, execute } from "../../lib/d1"

export interface StockCategoryRow {
  id: number
  name: string
  description: string | null
  sort_order: number
}

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
  category_id: number | null
  category_name: string | null
  created_at: string
}

export async function getStockCategories(db: D1Database): Promise<StockCategoryRow[]> {
  return queryAll<StockCategoryRow>(db, "SELECT * FROM stock_categories ORDER BY sort_order")
}

export async function getIngredients(db: D1Database, belowMin?: boolean): Promise<IngredientRow[]> {
  const sql = belowMin
    ? `SELECT i.*, sc.name as category_name FROM ingredients i
       LEFT JOIN stock_categories sc ON i.category_id = sc.id
       WHERE i.current_stock <= i.min_stock_level ORDER BY sc.sort_order, i.name`
    : `SELECT i.*, sc.name as category_name FROM ingredients i
       LEFT JOIN stock_categories sc ON i.category_id = sc.id
       ORDER BY sc.sort_order, i.name`
  return queryAll<IngredientRow>(db, sql)
}

export async function getIngredientsPaginated(
  db: D1Database,
  page: number = 1,
  limit: number = 20,
  categoryId?: number | null,
): Promise<{ items: IngredientRow[]; total: number }> {
  const offset = (page - 1) * limit
  let whereClause = ""
  const params: unknown[] = []

  if (categoryId) {
    whereClause = "WHERE i.category_id = ?"
    params.push(categoryId)
  }

  const totalResult = await queryOne<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM ingredients i ${whereClause}`,
    ...params,
  )
  const total = totalResult?.count ?? 0

  const items = await queryAll<IngredientRow>(
    db,
    `SELECT i.*, sc.name as category_name FROM ingredients i
     LEFT JOIN stock_categories sc ON i.category_id = sc.id
     ${whereClause} ORDER BY sc.sort_order, i.name LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  )

  return { items, total }
}

export async function createIngredient(
  db: D1Database,
  data: {
    name: string
    unit: string
    currentStock: number
    minStockLevel: number
    maxStockLevel?: number
    reorderQuantity?: number
    unitCost?: number
    supplierId?: number
    categoryId?: number
  },
): Promise<IngredientRow | null> {
  return queryOne<IngredientRow>(
    db,
    `INSERT INTO ingredients (name, unit, current_stock, min_stock_level, max_stock_level, reorder_quantity, unit_cost, supplier_id, category_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    data.name,
    data.unit,
    data.currentStock,
    data.minStockLevel,
    data.maxStockLevel ?? null,
    data.reorderQuantity ?? null,
    data.unitCost ?? null,
    data.supplierId ?? null,
    data.categoryId ?? null,
  )
}

export async function adjustStock(
  db: D1Database,
  ingredientId: number,
  adjustment: number,
  reason?: string,
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

  await execute(
    db,
    `INSERT INTO stock_movement_log (ingredient_id, adjustment, stock_before, stock_after, reason)
     VALUES (?, ?, ?, ?, ?)`,
    ingredientId,
    adjustment,
    ingredient.current_stock,
    newStock,
    reason ?? null,
  )

  return queryOne<IngredientRow>(db, "SELECT * FROM ingredients WHERE id = ?", ingredientId)
}

export async function getStockMovements(
  db: D1Database,
  ingredientId: number,
  limit: number = 10,
): Promise<{
  id: number
  adjustment: number
  stock_before: number
  stock_after: number
  reason: string | null
  created_at: string
}[]> {
  return queryAll(
    db,
    `SELECT * FROM stock_movement_log WHERE ingredient_id = ? ORDER BY created_at DESC LIMIT ?`,
    ingredientId,
    limit,
  )
}

export async function updateIngredient(
  db: D1Database,
  id: number,
  data: Partial<{
    name: string
    unit: string
    currentStock: number
    minStockLevel: number
    maxStockLevel: number
    reorderQuantity: number
    unitCost: number
    supplierId: number
    categoryId: number
  }>,
): Promise<IngredientRow | null> {
  const sets: string[] = []
  const params: unknown[] = []

  if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name) }
  if (data.unit !== undefined) { sets.push("unit = ?"); params.push(data.unit) }
  if (data.currentStock !== undefined) { sets.push("current_stock = ?"); params.push(data.currentStock) }
  if (data.minStockLevel !== undefined) { sets.push("min_stock_level = ?"); params.push(data.minStockLevel) }
  if (data.maxStockLevel !== undefined) { sets.push("max_stock_level = ?"); params.push(data.maxStockLevel) }
  if (data.reorderQuantity !== undefined) { sets.push("reorder_quantity = ?"); params.push(data.reorderQuantity) }
  if (data.unitCost !== undefined) { sets.push("unit_cost = ?"); params.push(data.unitCost) }
  if (data.supplierId !== undefined) { sets.push("supplier_id = ?"); params.push(data.supplierId) }
  if (data.categoryId !== undefined) { sets.push("category_id = ?"); params.push(data.categoryId) }

  if (sets.length === 0) return queryOne<IngredientRow>(db, "SELECT * FROM ingredients WHERE id = ?", id)

  sets.push("updated_at = datetime('now')")
  params.push(id)
  await execute(db, `UPDATE ingredients SET ${sets.join(", ")} WHERE id = ?`, ...params)
  return queryOne<IngredientRow>(db, "SELECT * FROM ingredients WHERE id = ?", id)
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

export async function getPurchaseOrderById(
  db: D1Database,
  id: number,
): Promise<unknown | null> {
  return queryOne(
    db,
    `SELECT po.*, s.name as supplier_name
     FROM purchase_orders po
     JOIN suppliers s ON po.supplier_id = s.id
     WHERE po.id = ?`,
    id,
  )
}

export async function getPurchaseOrderItems(
  db: D1Database,
  purchaseOrderId: number,
): Promise<{
  id: number
  ingredient_id: number
  ingredient_name: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
}[]> {
  return queryAll(
    db,
    `SELECT poi.*, i.name as ingredient_name
     FROM purchase_order_items poi
     JOIN ingredients i ON poi.ingredient_id = i.id
     WHERE poi.purchase_order_id = ?`,
    purchaseOrderId,
  )
}

export async function receivePurchaseOrder(
  db: D1Database,
  id: number,
): Promise<unknown | null> {
  const po = await queryOne<{ id: number; status: string }>(
    db, "SELECT id, status FROM purchase_orders WHERE id = ?", id,
  )
  if (!po) return null
  if (po.status === "received") throw new Error("Purchase order already received")

  const items = await queryAll<{
    ingredient_id: number
    quantity_ordered: number
    quantity_received: number
    unit_price: number
  }>(
    db,
    "SELECT ingredient_id, quantity_ordered, quantity_received, unit_price FROM purchase_order_items WHERE purchase_order_id = ?",
    id,
  )

  for (const item of items) {
    const qtyToReceive = item.quantity_ordered - item.quantity_received
    if (qtyToReceive > 0) {
      await adjustStock(db, item.ingredient_id, qtyToReceive, `Purchase order #${id} received`)
    }
  }

  await execute(
    db,
    `UPDATE purchase_order_items SET quantity_received = quantity_ordered
     WHERE purchase_order_id = ?`,
    id,
  )

  await execute(
    db,
    "UPDATE purchase_orders SET status = 'received', received_at = datetime('now') WHERE id = ?",
    id,
  )

  return getPurchaseOrderById(db, id)
}

export async function updateSupplier(
  db: D1Database,
  id: number,
  data: Partial<{
    name: string
    contactPerson: string
    phone: string
    email: string
    leadTimeDays: number
    active: boolean
  }>,
): Promise<unknown | null> {
  const sets: string[] = []
  const params: unknown[] = []

  if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name) }
  if (data.contactPerson !== undefined) { sets.push("contact_person = ?"); params.push(data.contactPerson) }
  if (data.phone !== undefined) { sets.push("phone = ?"); params.push(data.phone) }
  if (data.email !== undefined) { sets.push("email = ?"); params.push(data.email) }
  if (data.leadTimeDays !== undefined) { sets.push("lead_time_days = ?"); params.push(data.leadTimeDays) }
  if (data.active !== undefined) { sets.push("active = ?"); params.push(data.active ? 1 : 0) }

  if (sets.length === 0) return queryOne(db, "SELECT * FROM suppliers WHERE id = ?", id)

  params.push(id)
  await execute(db, `UPDATE suppliers SET ${sets.join(", ")} WHERE id = ?`, ...params)
  return queryOne(db, "SELECT * FROM suppliers WHERE id = ?", id)
}

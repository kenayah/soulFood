import type { D1Database } from "@cloudflare/workers-types"
import { getDb, queryAll, queryOne, execute } from "../../lib/d1"

export interface MenuCategoryRow {
  id: number
  name: string
  sort_order: number
  available: boolean
  created_at: string
}

export interface MenuItemRow {
  id: number
  name: string
  description: string | null
  price: number
  category_id: number | null
  image: string | null
  prep_time_minutes: number | null
  available: boolean
  created_at: string
}

export async function getCategories(db: D1Database): Promise<MenuCategoryRow[]> {
  return queryAll<MenuCategoryRow>(
    db,
    "SELECT * FROM menu_categories WHERE available = 1 ORDER BY sort_order",
  )
}

export async function createCategory(db: D1Database, name: string, sortOrder: number = 0): Promise<MenuCategoryRow | null> {
  return queryOne<MenuCategoryRow>(
    db,
    "INSERT INTO menu_categories (name, sort_order) VALUES (?, ?) RETURNING *",
    name,
    sortOrder,
  )
}

export async function updateCategory(
  db: D1Database,
  id: number,
  data: { name?: string; sortOrder?: number; available?: boolean },
): Promise<MenuCategoryRow | null> {
  const sets: string[] = []
  const params: unknown[] = []

  if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name) }
  if (data.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(data.sortOrder) }
  if (data.available !== undefined) { sets.push("available = ?"); params.push(data.available) }

  if (sets.length === 0) return getCategoryById(db, id)

  params.push(id)
  await execute(db, `UPDATE menu_categories SET ${sets.join(", ")} WHERE id = ?`, ...params)
  return getCategoryById(db, id)
}

export async function getCategoryById(db: D1Database, id: number): Promise<MenuCategoryRow | null> {
  return queryOne<MenuCategoryRow>(db, "SELECT * FROM menu_categories WHERE id = ?", id)
}

export async function deleteCategory(db: D1Database, id: number): Promise<boolean> {
  const result = await execute(db, "DELETE FROM menu_categories WHERE id = ?", id)
  return result.success
}

export async function getMenuItems(
  db: D1Database,
  categoryId?: number,
): Promise<MenuItemRow[]> {
  if (categoryId) {
    return queryAll<MenuItemRow>(
      db,
      "SELECT * FROM menu_items WHERE available = 1 AND category_id = ? ORDER BY id",
      categoryId,
    )
  }
  return queryAll<MenuItemRow>(
    db,
    "SELECT * FROM menu_items WHERE available = 1 ORDER BY category_id, id",
  )
}

export async function createMenuItem(
  db: D1Database,
  data: {
    name: string
    description?: string
    price: number
    categoryId?: number
    prepTimeMinutes?: number
    available?: boolean
  },
): Promise<MenuItemRow | null> {
  return queryOne<MenuItemRow>(
    db,
    `INSERT INTO menu_items (name, description, price, category_id, prep_time_minutes, available)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    data.name,
    data.description ?? null,
    data.price,
    data.categoryId ?? null,
    data.prepTimeMinutes ?? null,
    data.available ?? true,
  )
}

export async function updateMenuItem(
  db: D1Database,
  id: number,
  data: Partial<{
    name: string
    description: string
    price: number
    categoryId: number
    prepTimeMinutes: number
    available: boolean
  }>,
): Promise<MenuItemRow | null> {
  const sets: string[] = []
  const params: unknown[] = []

  if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name) }
  if (data.description !== undefined) { sets.push("description = ?"); params.push(data.description) }
  if (data.price !== undefined) { sets.push("price = ?"); params.push(data.price) }
  if (data.categoryId !== undefined) { sets.push("category_id = ?"); params.push(data.categoryId) }
  if (data.prepTimeMinutes !== undefined) { sets.push("prep_time_minutes = ?"); params.push(data.prepTimeMinutes) }
  if (data.available !== undefined) { sets.push("available = ?"); params.push(data.available) }

  if (sets.length === 0) return getMenuItemById(db, id)

  sets.push("updated_at = datetime('now')")
  params.push(id)
  await execute(db, `UPDATE menu_items SET ${sets.join(", ")} WHERE id = ?`, ...params)
  return getMenuItemById(db, id)
}

export async function getMenuItemById(db: D1Database, id: number): Promise<MenuItemRow | null> {
  return queryOne<MenuItemRow>(db, "SELECT * FROM menu_items WHERE id = ?", id)
}

export async function deleteMenuItem(db: D1Database, id: number): Promise<boolean> {
  const result = await execute(db, "UPDATE menu_items SET available = 0 WHERE id = ?", id)
  return result.success
}

export async function getSpecials(db: D1Database): Promise<{
  id: number
  menu_item_id: number
  day_of_week: string
  special_price: number
  active: boolean
  item_name?: string
}[]> {
  return queryAll(
    db,
    `SELECT ms.*, mi.name as item_name
     FROM menu_specials ms
     JOIN menu_items mi ON ms.menu_item_id = mi.id
     WHERE ms.active = 1`,
  )
}

export async function setSpecial(
  db: D1Database,
  menuItemId: number,
  dayOfWeek: string,
  specialPrice: number,
): Promise<unknown> {
  return queryOne(
    db,
    `INSERT INTO menu_specials (menu_item_id, day_of_week, special_price)
     VALUES (?, ?, ?) RETURNING *`,
    menuItemId,
    dayOfWeek,
    specialPrice,
  )
}

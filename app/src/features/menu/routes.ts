import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../../lib/d1"
import { menuItemSchema, categorySchema } from "../../lib/validators"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getSpecials,
  setSpecial,
} from "./service"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

// Categories
app.get("/categories", async (c) => {
  const db = getDb(c.env)
  const categories = await getCategories(db)
  return c.json(categories)
})

app.post("/categories", async (c) => {
  const body = await c.req.json()
  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const category = await createCategory(db, parsed.data.name, parsed.data.sortOrder)
  return c.json(category, 201)
})

app.patch("/categories/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const body = await c.req.json()
  const db = getDb(c.env)
  const category = await updateCategory(db, id, body)
  if (!category) return c.json({ error: "Category not found" }, 404)
  return c.json(category)
})

app.delete("/categories/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const db = getDb(c.env)
  await deleteCategory(db, id)
  return c.json({ message: "Category deleted" })
})

// Menu Items
app.get("/items", async (c) => {
  const db = getDb(c.env)
  const categoryId = c.req.query("categoryId")
  const items = await getMenuItems(db, categoryId ? parseInt(categoryId) : undefined)
  return c.json(items)
})

app.post("/items", async (c) => {
  const body = await c.req.json()
  const parsed = menuItemSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const db = getDb(c.env)
  const item = await createMenuItem(db, {
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    categoryId: parsed.data.categoryId,
    prepTimeMinutes: parsed.data.prepTimeMinutes,
    starch: parsed.data.starch,
    image: parsed.data.image,
    available: parsed.data.available,
  })
  return c.json(item, 201)
})

app.patch("/items/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const body = await c.req.json()
  const db = getDb(c.env)
  const item = await updateMenuItem(db, id, body)
  if (!item) return c.json({ error: "Menu item not found" }, 404)
  return c.json(item)
})

app.delete("/items/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const db = getDb(c.env)
  await deleteMenuItem(db, id)
  return c.json({ message: "Menu item archived" })
})

// Specials
app.get("/specials", async (c) => {
  const db = getDb(c.env)
  const specials = await getSpecials(db)
  return c.json(specials)
})

app.post("/specials", async (c) => {
  const body = await c.req.json()
  const db = getDb(c.env)
  const special = await setSpecial(db, body.menuItemId, body.dayOfWeek, body.specialPrice)
  return c.json(special, 201)
})

export default app

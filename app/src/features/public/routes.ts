import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.get("/menu", async (c) => {
  const db = c.env.DB

  const categories = await db.prepare(
    "SELECT id, name, sort_order FROM menu_categories WHERE available = 1 ORDER BY sort_order",
  ).all<{ id: number; name: string; sort_order: number }>()

  const result = await Promise.all(
    (categories.results ?? []).map(async (cat) => {
      const items = await db.prepare(
        `SELECT id, name, description, price, starch, prep_time_minutes
         FROM menu_items WHERE category_id = ? AND available = 1 AND price > 0
         ORDER BY id`,
      ).bind(cat.id).all<{
        id: number; name: string; description: string | null
        price: number; starch: string | null; prep_time_minutes: number | null
      }>()

      return {
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sort_order,
        items: (items.results ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          starch: item.starch,
          prepTimeMinutes: item.prep_time_minutes,
        })),
      }
    }),
  )

  return c.json({ categories: result })
})

export default app

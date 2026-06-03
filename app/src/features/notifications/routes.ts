import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../../lib/d1"
import { getNotifications, acknowledgeNotifications } from "./service"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.get("/", async (c) => {
  const db = getDb(c.env)
  const since = c.req.query("since") ? parseInt(c.req.query("since")!) : undefined
  const notifications = await getNotifications(db, since)
  return c.json(notifications)
})

app.post("/ack", async (c) => {
  const body = await c.req.json()
  const db = getDb(c.env)
  await acknowledgeNotifications(db, body.ids ?? [])
  return c.json({ message: "Notifications acknowledged" })
})

export default app

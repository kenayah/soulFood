import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../../lib/d1"
import { createTransaction, getTransactions } from "./service"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.post("/transactions", async (c) => {
  const body = await c.req.json()
  const db = getDb(c.env)
  try {
    const tx = await createTransaction(db, body.orderId, body.provider, body.amount)
    return c.json(tx, 201)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

app.get("/transactions", async (c) => {
  const db = getDb(c.env)
  const orderId = c.req.query("orderId")
  const txs = await getTransactions(db, orderId ? parseInt(orderId) : undefined)
  return c.json(txs)
})

export default app

import { Hono } from "hono"
import { getDb } from "../../lib/d1"
import { getTransactionByProviderTxId, updateTransaction } from "./service"
import { updateOrderStatus } from "../orders/service"
import type { AppBindings } from "../../env"
import type { YocoWebhookPayload } from "./yoco"

const app = new Hono<{ Bindings: AppBindings }>()

app.post("/yoco", async (c) => {
  const body: YocoWebhookPayload = await c.req.json()
  const db = getDb(c.env)

  const checkoutId = body.id
  const tx = await getTransactionByProviderTxId(db, checkoutId)

  if (!tx) {
    return c.json({ error: "Transaction not found" }, 404)
  }

  if (body.status === "completed") {
    await updateTransaction(db, checkoutId, "completed")
    await updateOrderStatus(db, tx.order_id, "confirmed", "system")

    // Update payment_status on the order directly
    await db.prepare(
      "UPDATE orders SET payment_status = 'verified', updated_at = datetime('now') WHERE id = ?",
    ).bind(tx.order_id).run()
  } else {
    await updateTransaction(db, checkoutId, "failed")
    await db.prepare(
      "UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?",
    ).bind(tx.order_id).run()
  }

  return c.json({ ok: true })
})

export default app

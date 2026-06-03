import type { D1Database } from "@cloudflare/workers-types"
import { queryAll, queryOne, execute } from "../../lib/d1"

export interface PaymentProvider {
  name: string
  createTransaction(orderId: number, amount: number): Promise<TransactionResult>
  verifyTransaction(txId: string): Promise<"completed" | "failed" | "pending">
  refund(txId: string): Promise<boolean>
}

export interface TransactionResult {
  status: "pending" | "completed" | "failed"
  providerTxId: string | null
}

export interface TransactionRow {
  id: number
  order_id: number
  provider: string
  provider_tx_id: string | null
  amount: number
  status: string
  currency: string
  created_at: string
}

class CashProvider implements PaymentProvider {
  name = "cash"

  async createTransaction(_orderId: number, _amount: number): Promise<TransactionResult> {
    return { status: "pending", providerTxId: null }
  }

  async verifyTransaction(_txId: string): Promise<"completed" | "failed" | "pending"> {
    return "completed"
  }

  async refund(_txId: string): Promise<boolean> {
    return true
  }
}

const providers = new Map<string, PaymentProvider>()
providers.set("cash", new CashProvider())

export function registerProvider(provider: PaymentProvider): void {
  providers.set(provider.name, provider)
}

export function getProvider(name: string): PaymentProvider | undefined {
  return providers.get(name)
}

export async function createTransaction(
  db: D1Database,
  orderId: number,
  provider: string,
  amount: number,
): Promise<TransactionRow | null> {
  const prov = getProvider(provider)
  if (!prov) throw new Error(`Unknown payment provider: ${provider}`)

  const result = await prov.createTransaction(orderId, amount)

  return queryOne<TransactionRow>(
    db,
    `INSERT INTO transactions (order_id, provider, provider_tx_id, amount, status)
     VALUES (?, ?, ?, ?, ?) RETURNING *`,
    orderId,
    provider,
    result.providerTxId,
    amount,
    result.status,
  )
}

export async function getTransactions(
  db: D1Database,
  orderId?: number,
): Promise<TransactionRow[]> {
  if (orderId) {
    return queryAll<TransactionRow>(
      db,
      "SELECT * FROM transactions WHERE order_id = ? ORDER BY created_at DESC",
      orderId,
    )
  }
  return queryAll<TransactionRow>(
    db,
    "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50",
  )
}

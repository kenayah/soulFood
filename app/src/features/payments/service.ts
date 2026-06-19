import type { D1Database } from "@cloudflare/workers-types"
import { queryAll, queryOne } from "../../lib/d1"

export interface PaymentProvider {
  name: string
  createTransaction(orderId: number, amount: number): Promise<TransactionResult>
  verifyTransaction(txId: string): Promise<"completed" | "failed" | "pending">
  refund(txId: string): Promise<boolean>
}

export interface TransactionResult {
  status: "pending" | "completed" | "failed"
  providerTxId: string | null
  redirectUrl?: string
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

export class YocoProvider implements PaymentProvider {
  name = "card"
  private secretKey: string
  private siteBaseUrl: string

  constructor(secretKey: string, siteBaseUrl: string) {
    this.secretKey = secretKey
    this.siteBaseUrl = siteBaseUrl
  }

  async createTransaction(orderId: number, amount: number): Promise<TransactionResult> {
    const { createYocoCheckout } = await import("./yoco")
    const checkout = await createYocoCheckout(this.secretKey, {
      amount: Math.round(amount * 100),
      currency: "ZAR",
      successUrl: `${this.siteBaseUrl}/?payment=success&order=${orderId}`,
      cancelUrl: `${this.siteBaseUrl}/?payment=cancelled&order=${orderId}`,
      metadata: { orderId: String(orderId) },
    })
    return { status: "pending", providerTxId: checkout.id, redirectUrl: checkout.redirectUrl }
  }

  async verifyTransaction(txId: string): Promise<"completed" | "failed" | "pending"> {
    return "pending"
  }

  async refund(_txId: string): Promise<boolean> {
    return false
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
): Promise<{ transaction: TransactionRow; redirectUrl?: string }> {
  const prov = getProvider(provider)
  if (!prov) throw new Error(`Unknown payment provider: ${provider}`)

  const result = await prov.createTransaction(orderId, amount)

  const transaction = await queryOne<TransactionRow>(
    db,
    `INSERT INTO transactions (order_id, provider, provider_tx_id, amount, status)
     VALUES (?, ?, ?, ?, ?) RETURNING *`,
    orderId,
    provider,
    result.providerTxId,
    amount,
    result.status,
  )
  if (!transaction) throw new Error("Failed to create transaction")

  return { transaction, redirectUrl: result.redirectUrl }
}

export async function updateTransaction(
  db: D1Database,
  providerTxId: string,
  status: string,
): Promise<TransactionRow | null> {
  return queryOne<TransactionRow>(
    db,
    `UPDATE transactions SET status = ?, updated_at = datetime('now')
     WHERE provider_tx_id = ? RETURNING *`,
    status,
    providerTxId,
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

export async function getTransactionByProviderTxId(
  db: D1Database,
  providerTxId: string,
): Promise<TransactionRow | null> {
  return queryOne<TransactionRow>(
    db,
    "SELECT * FROM transactions WHERE provider_tx_id = ?",
    providerTxId,
  )
}

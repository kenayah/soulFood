export interface YocoCheckoutRequest {
  amount: number
  currency: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface YocoCheckoutResponse {
  id: string
  redirectUrl: string
}

export interface YocoWebhookPayload {
  id: string
  status: "completed" | "failed"
  metadata?: Record<string, string>
}

const YOCO_API = "https://payments.yoco.com/api/checkouts"

export async function createYocoCheckout(
  secretKey: string,
  data: YocoCheckoutRequest,
): Promise<YocoCheckoutResponse> {
  const res = await fetch(YOCO_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Yoco checkout failed (${res.status}): ${err}`)
  }

  return res.json<YocoCheckoutResponse>()
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const crypto = (globalThis as any).crypto
  if (!crypto?.subtle) return false

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(rawBody)

  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  ).then((key: CryptoKey) =>
    crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signature),
      messageData,
    )
  ).catch(() => false)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

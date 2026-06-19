import type { D1Database } from "@cloudflare/workers-types"

export interface AppBindings {
  DB: D1Database
  YOCO_SECRET_KEY?: string
  YOCO_WEBHOOK_SECRET?: string
  SITE_BASE_URL?: string
}

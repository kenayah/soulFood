import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"

import ordersRoutes from "./features/orders/routes"
import menuRoutes from "./features/menu/routes"
import stockRoutes from "./features/stock/routes"
import reportingRoutes from "./features/reporting/routes"
import paymentsRoutes from "./features/payments/routes"
import notificationsRoutes from "./features/notifications/routes"
import publicRoutes from "./features/public/routes"
import webhookRoutes from "./features/payments/webhook"
import adminRoutes from "./admin/routes"
import { requireAuth } from "./auth/middleware"
import { initDb } from "./lib/init-db"
import { registerProvider, YocoProvider } from "./features/payments/service"
import type { AppBindings } from "./env"

const app = new Hono<{ Bindings: AppBindings }>()

// Run database migration on first request (dev-friendly)
let dbInitRan = false
let providersRegistered = false
app.use("*", async (c, next) => {
  if (!dbInitRan) {
    dbInitRan = true
    const ok = await initDb(c.env.DB)
    if (!ok) {
      return c.html(
        <html lang="en">
          <head><title>SoulFood — DB Error</title></head>
          <body style="font-family:sans-serif;margin:2em">
            <h1>Database not initialized</h1>
            <p>Run migrations first: <code>wrangler d1 execute DB --local --file=migrations/001_create_tables.sql</code></p>
          </body>
        </html>,
        500,
      )
    }
  }
  if (!providersRegistered) {
    providersRegistered = true
    const yocoKey = c.env.YOCO_SECRET_KEY
    const siteUrl = c.env.SITE_BASE_URL ?? "https://kenayah.github.io/soulFood"
    if (yocoKey) {
      registerProvider(new YocoProvider(yocoKey, siteUrl))
    }
  }
  await next()
})

app.use("*", logger())
app.use("*", secureHeaders())
app.use("/api/*", cors())

app.get("/api/health", (c) => c.json({ status: "ok", service: "soulfood-api" }))

// Public routes
app.route("/api/orders", ordersRoutes)
app.route("/api/public", publicRoutes)
app.route("/api/webhook", webhookRoutes)

// Authenticated API routes
app.use("/api/menu/*", requireAuth)
app.use("/api/stock/*", requireAuth)
app.use("/api/reports/*", requireAuth)
app.use("/api/payments/*", requireAuth)
app.use("/api/notifications/*", requireAuth)

app.route("/api/menu", menuRoutes)
app.route("/api/stock", stockRoutes)
app.route("/api/reports", reportingRoutes)
app.route("/api/payments", paymentsRoutes)
app.route("/api/notifications", notificationsRoutes)

// Admin SSR dashboard
app.route("/admin", adminRoutes)

// Root redirect
app.get("/", (c) => c.redirect("/admin/dashboard"))

app.notFound((c) => c.json({ error: "Not found" }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "Internal server error" }, 500)
})

export default app

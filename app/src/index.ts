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
import adminRoutes from "./admin/routes"
import { requireAuth } from "./auth/middleware"

const app = new Hono()

app.use("*", logger())
app.use("*", secureHeaders())
app.use("/api/*", cors())

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", service: "soulfood-api" }))

// Public routes — no auth needed
app.route("/api/orders", ordersRoutes)

// Authenticated API routes
app.route("/api/menu", requireAuth, menuRoutes)
app.route("/api/stock", requireAuth, stockRoutes)
app.route("/api/reports", requireAuth, reportingRoutes)
app.route("/api/payments", requireAuth, paymentsRoutes)
app.route("/api/notifications", requireAuth, notificationsRoutes)

// Admin SSR dashboard
app.route("/", adminRoutes)

// 404
app.notFound((c) => c.json({ error: "Not found" }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "Internal server error" }, 500)
})

export default app

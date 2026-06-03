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

app.get("/api/health", (c) => c.json({ status: "ok", service: "soulfood-api" }))

// Public routes
app.route("/api/orders", ordersRoutes)

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
app.route("/", adminRoutes)

app.notFound((c) => c.json({ error: "Not found" }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "Internal server error" }, 500)
})

export default app

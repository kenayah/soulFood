import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { requireAdmin } from "../auth/middleware"

import { loginForm, login } from "./pages/login"
import { dashboard } from "./pages/dashboard"
import { listOrders, orderDetail, updateStatus } from "./pages/orders"
import { menu, createCategoryHandler, toggleCategory, createItemHandler, updateItemHandler, deleteItemHandler } from "./pages/menu"
import { stock, createIngredientHandler, adjustStockHandler } from "./pages/stock"
import { reports } from "./pages/reports"

type Bindings = { DB: D1Database; ADMIN_TOKEN?: string }

const app = new Hono<{ Bindings: Bindings }>()

// Login routes — no auth needed
app.get("/login", loginForm)
app.post("/login", login)

// Protected routes
app.use("/*", requireAdmin)

app.get("/dashboard", dashboard)
app.get("/orders", listOrders)
app.get("/orders/:id", orderDetail)
app.post("/orders/:id/status", updateStatus)
app.get("/menu", menu)
app.post("/menu/category", createCategoryHandler)
app.post("/menu/category/:id/toggle", toggleCategory)
app.post("/menu/item", createItemHandler)
app.post("/menu/item/:id", updateItemHandler)
app.post("/menu/item/:id/delete", deleteItemHandler)
app.get("/stock", stock)
app.post("/stock/ingredient", createIngredientHandler)
app.post("/stock/ingredient/:id/adjust", adjustStockHandler)
app.get("/reports", reports)

app.get("/", (c) => c.redirect("/dashboard"))

export default app

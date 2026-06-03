import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../../lib/d1"
import { getDailyReport, getWeeklyReport, getMonthlyReport } from "./service"
import { getDashboardStats } from "../orders/service"

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.get("/dashboard", async (c) => {
  const db = getDb(c.env)
  const stats = await getDashboardStats(db)
  return c.json(stats)
})

app.get("/daily", async (c) => {
  const db = getDb(c.env)
  const date = c.req.query("date") ?? new Date().toISOString().split("T")[0]
  const report = await getDailyReport(db, date)
  return c.json(report)
})

app.get("/weekly", async (c) => {
  const db = getDb(c.env)
  const now = new Date()
  const week = c.req.query("week") ?? `${now.getFullYear()}-W${String(Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000)).padStart(2, "0")}`
  const report = await getWeeklyReport(db, week)
  return c.json(report)
})

app.get("/monthly", async (c) => {
  const db = getDb(c.env)
  const month = c.req.query("month") ?? new Date().toISOString().slice(0, 7)
  const report = await getMonthlyReport(db, month)
  return c.json(report)
})

export default app

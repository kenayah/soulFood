import type { D1Database } from "@cloudflare/workers-types"
import { getDb, queryOne, queryAll } from "../../lib/d1"

export interface DailyReport {
  date: string
  orderCount: number
  revenue: number
  avgOrderValue: number
  popularItems: { name: string; quantity: number }[]
}

export async function getDailyReport(db: D1Database, date: string): Promise<DailyReport> {
  const summary = await queryOne<{ orderCount: number; revenue: number; avgOrderValue: number }>(
    db,
    `SELECT COUNT(*) as orderCount,
            COALESCE(SUM(total), 0) as revenue,
            COALESCE(AVG(total), 0) as avgOrderValue
     FROM orders
     WHERE date(created_at) = ? AND status = 'delivered'`,
    date,
  )

  const popularItems = await queryAll<{ name: string; quantity: number }>(
    db,
    `SELECT mi.name, SUM(oi.quantity) as quantity
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE date(o.created_at) = ? AND o.status = 'delivered'
     GROUP BY mi.name
     ORDER BY quantity DESC
     LIMIT 10`,
    date,
  )

  return {
    date,
    orderCount: summary?.orderCount ?? 0,
    revenue: summary?.revenue ?? 0,
    avgOrderValue: summary?.avgOrderValue ?? 0,
    popularItems,
  }
}

export interface WeeklyReport {
  week: string
  orderCount: number
  revenue: number
  previousWeekRevenue: number
  topItems: { name: string; quantity: number }[]
}

export async function getWeeklyReport(db: D1Database, week: string): Promise<WeeklyReport> {
  const [year, weekNum] = week.split("-W")
  const weekStart = `%${year}-${weekNum}`

  const current = await queryOne<{ orderCount: number; revenue: number }>(
    db,
    `SELECT COUNT(*) as orderCount, COALESCE(SUM(total), 0) as revenue
     FROM orders
     WHERE strftime('%Y-W%W', created_at) = ? AND status = 'delivered'`,
    week,
  )

  // Previous week
  const prevWeekNum = parseInt(weekNum) - 1
  const prevWeek = `${year}-W${prevWeekNum.toString().padStart(2, "0")}`

  const previous = await queryOne<{ revenue: number }>(
    db,
    `SELECT COALESCE(SUM(total), 0) as revenue
     FROM orders
     WHERE strftime('%Y-W%W', created_at) = ? AND status = 'delivered'`,
    prevWeek,
  )

  const topItems = await queryAll<{ name: string; quantity: number }>(
    db,
    `SELECT mi.name, SUM(oi.quantity) as quantity
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE strftime('%Y-W%W', o.created_at) = ? AND o.status = 'delivered'
     GROUP BY mi.name
     ORDER BY quantity DESC
     LIMIT 5`,
    week,
  )

  return {
    week,
    orderCount: current?.orderCount ?? 0,
    revenue: current?.revenue ?? 0,
    previousWeekRevenue: previous?.revenue ?? 0,
    topItems,
  }
}

export interface MonthlyReport {
  month: string
  orderCount: number
  revenue: number
  byPaymentMethod: { method: string; total: number }[]
  avgOrderValue: number
}

export async function getMonthlyReport(db: D1Database, month: string): Promise<MonthlyReport> {
  const summary = await queryOne<{ orderCount: number; revenue: number; avgOrderValue: number }>(
    db,
    `SELECT COUNT(*) as orderCount,
            COALESCE(SUM(total), 0) as revenue,
            COALESCE(AVG(total), 0) as avgOrderValue
     FROM orders
     WHERE strftime('%Y-%m', created_at) = ? AND status = 'delivered'`,
    month,
  )

  const byPaymentMethod = await queryAll<{ method: string; total: number }>(
    db,
    `SELECT payment_method as method, COALESCE(SUM(total), 0) as total
     FROM orders
     WHERE strftime('%Y-%m', created_at) = ? AND status = 'delivered'
     GROUP BY payment_method`,
    month,
  )

  return {
    month,
    orderCount: summary?.orderCount ?? 0,
    revenue: summary?.revenue ?? 0,
    avgOrderValue: summary?.avgOrderValue ?? 0,
    byPaymentMethod,
  }
}

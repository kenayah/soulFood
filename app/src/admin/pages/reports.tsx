import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getDailyReport, getWeeklyReport, getMonthlyReport } from "../../features/reporting/service"

function getWeekNumber(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 1)
  const diff = d.getTime() - start.getTime()
  const weekNum = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function addWeeks(week: string, n: number): string {
  const [y, w] = week.split("-W")
  const weekNum = parseInt(w) + n
  return `${y}-W${String(weekNum).padStart(2, "0")}`
}

function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function reports(c: Context) {
  const db = c.env.DB
  const today = new Date().toISOString().split("T")[0]
  const currentWeek = getWeekNumber(new Date())
  const currentMonth = new Date().toISOString().slice(0, 7)

  const period = c.req.query("period") ?? "daily"
  const date = c.req.query("date") ?? today
  const week = c.req.query("week") ?? currentWeek
  const month = c.req.query("month") ?? currentMonth

  const dailyReport = period === "daily" ? await getDailyReport(db, date) : null
  const weeklyReport = period === "weekly" ? await getWeeklyReport(db, week) : null
  const monthlyReport = period === "monthly" ? await getMonthlyReport(db, month) : null

  return c.html(
    <AdminLayout title="Reports" currentPath="/admin/reports">
      <h1 class="text-2xl font-bold mb-4">Reports</h1>

      <div role="tablist" class="tabs tabs-bordered mb-6">
        <a role="tab" class={"tab" + (period === "daily" ? " tab-active" : "")} href="/admin/reports?period=daily">Daily</a>
        <a role="tab" class={"tab" + (period === "weekly" ? " tab-active" : "")} href="/admin/reports?period=weekly">Weekly</a>
        <a role="tab" class={"tab" + (period === "monthly" ? " tab-active" : "")} href="/admin/reports?period=monthly">Monthly</a>
      </div>

      {period === "daily" && dailyReport && (
        <>
          <div class="flex justify-between items-center mb-4">
            <a class="btn btn-outline btn-secondary btn-sm" href={"/admin/reports?period=daily&date=" + addDays(date, -1)}>← Previous Day</a>
            <h3 class="text-lg font-semibold">{date}</h3>
            <a class={"btn btn-outline btn-secondary btn-sm" + (date >= today ? " btn-disabled" : "")} href={"/admin/reports?period=daily&date=" + addDays(date, 1)}>Next Day →</a>
          </div>
          <div class="stats shadow mb-6 w-full">
            <div class="stat place-items-center">
              <div class="stat-title">Orders</div>
              <div class="stat-value text-primary">{dailyReport.orderCount}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">Revenue</div>
              <div class="stat-value text-success">R{dailyReport.revenue.toFixed(2)}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">Avg Order</div>
              <div class="stat-value text-info">R{dailyReport.avgOrderValue.toFixed(2)}</div>
            </div>
          </div>
          <h4 class="font-semibold mb-2">Popular Items</h4>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Sold</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.popularItems.map((item) => (
                  <tr>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {period === "weekly" && weeklyReport && (
        <>
          <div class="flex justify-between items-center mb-4">
            <a class="btn btn-outline btn-secondary btn-sm" href={"/admin/reports?period=weekly&week=" + addWeeks(week, -1)}>← Previous Week</a>
            <h3 class="text-lg font-semibold">{week}</h3>
            <a class={"btn btn-outline btn-secondary btn-sm" + (week >= currentWeek ? " btn-disabled" : "")} href={"/admin/reports?period=weekly&week=" + addWeeks(week, 1)}>Next Week →</a>
          </div>
          <div class="stats shadow mb-6 w-full">
            <div class="stat place-items-center">
              <div class="stat-title">Orders</div>
              <div class="stat-value text-primary">{weeklyReport.orderCount}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">Revenue</div>
              <div class="stat-value text-success">R{weeklyReport.revenue.toFixed(2)}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">vs Previous Week</div>
              <div class="stat-value text-accent">
                {weeklyReport.previousWeekRevenue > 0
                  ? ((weeklyReport.revenue - weeklyReport.previousWeekRevenue) / weeklyReport.previousWeekRevenue * 100).toFixed(1) + "%"
                  : "—"}
              </div>
            </div>
          </div>
          <h4 class="font-semibold mb-2">Top Items</h4>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Sold</th>
                </tr>
              </thead>
              <tbody>
                {weeklyReport.topItems.map((item) => (
                  <tr>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {period === "monthly" && monthlyReport && (
        <>
          <div class="flex justify-between items-center mb-4">
            <a class="btn btn-outline btn-secondary btn-sm" href={"/admin/reports?period=monthly&month=" + addMonths(month, -1)}>← Previous Month</a>
            <h3 class="text-lg font-semibold">{month}</h3>
            <a class={"btn btn-outline btn-secondary btn-sm" + (month >= currentMonth ? " btn-disabled" : "")} href={"/admin/reports?period=monthly&month=" + addMonths(month, 1)}>Next Month →</a>
          </div>
          <div class="stats shadow mb-6 w-full">
            <div class="stat place-items-center">
              <div class="stat-title">Orders</div>
              <div class="stat-value text-primary">{monthlyReport.orderCount}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">Revenue</div>
              <div class="stat-value text-success">R{monthlyReport.revenue.toFixed(2)}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">Avg Order</div>
              <div class="stat-value text-info">R{monthlyReport.avgOrderValue.toFixed(2)}</div>
            </div>
          </div>
          <h4 class="font-semibold mb-2">By Payment Method</h4>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.byPaymentMethod.map((pm) => (
                  <tr>
                    <td>{pm.method}</td>
                    <td>R{pm.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>,
  )
}

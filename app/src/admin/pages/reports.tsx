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
      <h1 class="mb-4">Reports</h1>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a class={"nav-link" + (period === "daily" ? " active" : "")} href="/admin/reports?period=daily">Daily</a>
        </li>
        <li class="nav-item">
          <a class={"nav-link" + (period === "weekly" ? " active" : "")} href="/admin/reports?period=weekly">Weekly</a>
        </li>
        <li class="nav-item">
          <a class={"nav-link" + (period === "monthly" ? " active" : "")} href="/admin/reports?period=monthly">Monthly</a>
        </li>
      </ul>

      {period === "daily" && dailyReport && (
        <>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <a class="btn btn-outline-secondary btn-sm" href={"/admin/reports?period=daily&date=" + addDays(date, -1)}>← Previous Day</a>
            <h3 class="mb-0">{date}</h3>
            <a class={"btn btn-outline-secondary btn-sm" + (date >= today ? " disabled" : "")} href={"/admin/reports?period=daily&date=" + addDays(date, 1)}>Next Day →</a>
          </div>
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card text-bg-primary">
                <div class="card-body">
                  <h5>Orders</h5>
                  <p class="display-6">{dailyReport.orderCount}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card text-bg-success">
                <div class="card-body">
                  <h5>Revenue</h5>
                  <p class="display-6">R{dailyReport.revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card text-bg-info">
                <div class="card-body">
                  <h5>Avg Order</h5>
                  <p class="display-6">R{dailyReport.avgOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          <h4>Popular Items</h4>
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
        </>
      )}

      {period === "weekly" && weeklyReport && (
        <>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <a class="btn btn-outline-secondary btn-sm" href={"/admin/reports?period=weekly&week=" + addWeeks(week, -1)}>← Previous Week</a>
            <h3 class="mb-0">{week}</h3>
            <a class={"btn btn-outline-secondary btn-sm" + (week >= currentWeek ? " disabled" : "")} href={"/admin/reports?period=weekly&week=" + addWeeks(week, 1)}>Next Week →</a>
          </div>
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card text-bg-primary">
                <div class="card-body">
                  <h5>Orders</h5>
                  <p class="display-6">{weeklyReport.orderCount}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card text-bg-success">
                <div class="card-body">
                  <h5>Revenue</h5>
                  <p class="display-6">R{weeklyReport.revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card" style="border:2px solid #6c757d">
                <div class="card-body">
                  <h5>vs Previous Week</h5>
                  <p class="display-6">
                    {weeklyReport.previousWeekRevenue > 0
                      ? ((weeklyReport.revenue - weeklyReport.previousWeekRevenue) / weeklyReport.previousWeekRevenue * 100).toFixed(1) + "%"
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <h4>Top Items</h4>
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
        </>
      )}

      {period === "monthly" && monthlyReport && (
        <>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <a class="btn btn-outline-secondary btn-sm" href={"/admin/reports?period=monthly&month=" + addMonths(month, -1)}>← Previous Month</a>
            <h3 class="mb-0">{month}</h3>
            <a class={"btn btn-outline-secondary btn-sm" + (month >= currentMonth ? " disabled" : "")} href={"/admin/reports?period=monthly&month=" + addMonths(month, 1)}>Next Month →</a>
          </div>
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card text-bg-primary">
                <div class="card-body">
                  <h5>Orders</h5>
                  <p class="display-6">{monthlyReport.orderCount}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card text-bg-success">
                <div class="card-body">
                  <h5>Revenue</h5>
                  <p class="display-6">R{monthlyReport.revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card text-bg-info">
                <div class="card-body">
                  <h5>Avg Order</h5>
                  <p class="display-6">R{monthlyReport.avgOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          <h4>By Payment Method</h4>
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
        </>
      )}
    </AdminLayout>,
  )
}

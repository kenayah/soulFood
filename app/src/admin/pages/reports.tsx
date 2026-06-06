import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getDailyReport } from "../../features/reporting/service"

export async function reports(c: Context) {
  const db = c.env.DB
  const today = new Date().toISOString().split("T")[0]
  const report = await getDailyReport(db, today)

  return c.html(
    <AdminLayout title="Reports">
      <h1 class="mb-4">Reports</h1>
      <h3>Daily Report — {today}</h3>
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card text-bg-primary">
            <div class="card-body">
              <h5>Orders</h5>
              <p class="display-6">{report.orderCount}</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-bg-success">
            <div class="card-body">
              <h5>Revenue</h5>
              <p class="display-6">R{report.revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-bg-info">
            <div class="card-body">
              <h5>Avg Order</h5>
              <p class="display-6">R{report.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <h4>Popular Items Today</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Sold</th>
          </tr>
        </thead>
        <tbody>
          {report.popularItems.map((item) => (
            <tr>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>,
  )
}

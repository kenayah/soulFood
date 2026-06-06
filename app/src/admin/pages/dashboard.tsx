import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getDashboardStats } from "../../features/orders/service"

export async function dashboard(c: Context) {
  const db = c.env.DB
  const stats = await getDashboardStats(db)

  return c.html(
    <AdminLayout title="Dashboard">
      <h1 class="mb-4">Dashboard</h1>
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card text-bg-primary mb-3">
            <div class="card-body">
              <h5 class="card-title">Today's Orders</h5>
              <p class="card-text display-6">{stats.todayOrders}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-bg-success mb-3">
            <div class="card-body">
              <h5 class="card-title">Revenue</h5>
              <p class="card-text display-6">R{stats.todayRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-bg-warning mb-3">
            <div class="card-body">
              <h5 class="card-title">Pending</h5>
              <p class="card-text display-6">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-bg-info mb-3">
            <div class="card-body">
              <h5 class="card-title">In Progress</h5>
              <p class="card-text display-6">{stats.preparingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      <h3>Recent Orders</h3>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {stats.recentOrders.map((order) => (
            <tr>
              <td><a href={"/admin/orders/" + order.id}>{order.id}</a></td>
              <td>{order.customer_name}</td>
              <td>
                <span class={"badge bg-" + (
                  order.status === "delivered" ? "success" :
                  order.status === "placed" ? "warning" :
                  order.status === "cancelled" ? "danger" : "primary"
                )}>{order.status}</span>
              </td>
              <td>R{order.total.toFixed(2)}</td>
              <td>{order.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>,
  )
}

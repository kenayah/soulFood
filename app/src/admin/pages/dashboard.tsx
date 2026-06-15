import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getDashboardStats } from "../../features/orders/service"
import { Pagination } from "../components/pagination"

export async function dashboard(c: Context) {
  const db = c.env.DB
  const page = parseInt(c.req.query("page") || "1")
  const limit = 10
  const stats = await getDashboardStats(db, page, limit)

  return c.html(
    <AdminLayout title="Dashboard" currentPath="/admin/dashboard">
      <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
      <div class="stats shadow mb-6 w-full">
        <div class="stat place-items-center">
          <div class="stat-title">Today's Orders</div>
          <div class="stat-value text-primary">{stats.todayOrders}</div>
        </div>
        <div class="stat place-items-center">
          <div class="stat-title">Revenue</div>
          <div class="stat-value text-success">R{stats.todayRevenue.toFixed(2)}</div>
        </div>
        <div class="stat place-items-center">
          <div class="stat-title">Pending</div>
          <div class="stat-value text-warning">{stats.pendingOrders}</div>
        </div>
        <div class="stat place-items-center">
          <div class="stat-title">In Progress</div>
          <div class="stat-value text-info">{stats.preparingOrders}</div>
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-2">Recent Orders</h3>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
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
                <td><a href={"/admin/orders/" + order.id} class="link link-primary">{order.id}</a></td>
                <td>{order.customer_name}</td>
                <td>
                  <span class={"badge text-white badge-" + (
                    order.status === "delivered" ? "success" :
                    order.status === "placed" ? "warning" :
                    order.status === "cancelled" ? "error" : "info"
                  )}>{order.status}</span>
                </td>
                <td>R{order.total.toFixed(2)}</td>
                <td>{order.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={stats.recentTotal} limit={limit} baseUrl="/admin/dashboard" />
    </AdminLayout>,
  )
}

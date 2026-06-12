import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getCustomers } from "../../features/orders/service"

export async function customers(c: Context) {
  const db = c.env.DB
  const list = await getCustomers(db)

  return c.html(
    <AdminLayout title="Customers" currentPath="/admin/customers">
      <h1 class="text-2xl font-bold mb-4">Customers</h1>

      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Orders</th>
              <th>Last Order</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.delivery_address ?? "—"}</td>
                <td>{c.total_orders}</td>
                <td>{c.last_order_at ?? "—"}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colspan={6} class="text-center text-base-content/60 py-4">No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>,
  )
}

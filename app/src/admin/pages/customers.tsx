import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getCustomers, getCustomerById, getOrdersByCustomer, updateCustomer } from "../../features/orders/service"
import { Pagination } from "../components/pagination"

export async function customers(c: Context) {
  const db = c.env.DB
  const page = parseInt(c.req.query("page") || "1")
  const limit = 20
  const { customers: list, total } = await getCustomers(db, page, limit)

  const editId = c.req.query("edit")
  const editCustomer = editId ? await getCustomerById(db, parseInt(editId)) : null
  const customerOrders = editId ? await getOrdersByCustomer(db, parseInt(editId)) : null

  return c.html(
    <AdminLayout title="Customers" currentPath="/admin/customers">
      <h1 class="text-2xl font-bold mb-4">Customers</h1>

      {c.req.query("updated") && <div class="alert alert-success mb-4">Customer updated.</div>}

      {editCustomer && (
        <div class="card bg-base-100 shadow mb-6">
          <div class="card-body">
            <div class="flex justify-between items-center mb-3">
              <h5 class="card-title">Customer #{editCustomer.id}: {editCustomer.name}</h5>
              <a href="/admin/customers" class="btn btn-sm btn-ghost">Back</a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 class="font-semibold mb-2">Details</h6>
                <form method="post" action={"/admin/customers/" + editCustomer.id + "/update"}>
                  <label class="form-control w-full mb-2">
                    <span class="label-text">Name</span>
                    <input name="name" class="input input-bordered input-sm w-full" value={editCustomer.name} required />
                  </label>
                  <label class="form-control w-full mb-2">
                    <span class="label-text">Phone</span>
                    <input name="phone" class="input input-bordered input-sm w-full" value={editCustomer.phone} required />
                  </label>
                  <label class="form-control w-full mb-2">
                    <span class="label-text">Delivery address</span>
                    <input name="deliveryAddress" class="input input-bordered input-sm w-full" value={editCustomer.delivery_address ?? ""} />
                  </label>
                  <label class="form-control w-full mb-2">
                    <span class="label-text">Notes</span>
                    <textarea name="notes" class="textarea textarea-bordered textarea-sm w-full" rows={2}>{editCustomer.notes ?? ""}</textarea>
                  </label>
                  <button type="submit" class="btn btn-primary btn-sm">Save</button>
                </form>
                <div class="mt-3 text-sm text-base-content/60">
                  <div>Total orders: {editCustomer.total_orders}</div>
                  <div>Last order: {editCustomer.last_order_at ?? "—"}</div>
                  <div>Created: {editCustomer.created_at}</div>
                </div>
              </div>
              <div>
                <h6 class="font-semibold mb-2">Order History</h6>
                {customerOrders && customerOrders.length > 0 ? (
                  <div class="overflow-x-auto">
                    <table class="table table-xs">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((o) => (
                          <tr>
                            <td class="font-mono">#{o.id}</td>
                            <td><span class={"badge badge-sm " + (
                              o.status === "delivered" ? "badge-success" :
                              o.status === "cancelled" ? "badge-error" :
                              o.status === "placed" ? "badge-info" :
                              "badge-ghost"
                            )}>{o.status}</span></td>
                            <td>R{o.total.toFixed(2)}</td>
                            <td>{o.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p class="text-sm text-base-content/60">No orders yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <th>Actions</th>
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
                <td>
                  <a href={"/admin/customers?edit=" + c.id} class="btn btn-sm btn-ghost">View</a>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colspan={7} class="text-center text-base-content/60 py-4">No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} baseUrl="/admin/customers" />
    </AdminLayout>,
  )
}

export async function updateCustomerHandler(c: Context) {
  const db = c.env.DB
  const id = parseInt(c.req.param("id")!)
  const body = await c.req.parseBody()
  await updateCustomer(db, id, {
    name: body.name as string,
    phone: body.phone as string,
    deliveryAddress: body.deliveryAddress as string || undefined,
    notes: body.notes as string || undefined,
  })
  return c.redirect("/admin/customers?edit=" + id + "&updated=1")
}

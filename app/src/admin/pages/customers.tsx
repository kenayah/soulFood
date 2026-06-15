import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getCustomers, getCustomerById, getOrdersByCustomer, updateCustomer } from "../../features/orders/service"
import { Pagination } from "../components/pagination"
import { fmtStatus } from "../helpers"

export async function customers(c: Context) {
  const db = c.env.DB
  const page = parseInt(c.req.query("page") || "1")
  const limit = 6
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
                            <td><span class={"badge badge-sm text-white " + (
                              o.status === "delivered" ? "badge-success" :
                              o.status === "cancelled" ? "badge-error" :
                              o.status === "placed" ? "badge-info" :
                              "badge-ghost"
                            )}>{fmtStatus(o.status)}</span></td>
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
                  <a href={"/admin/customers?edit=" + c.id} class="btn btn-sm btn-ghost" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></a>
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

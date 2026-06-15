import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getOrders, getOrderById, getOrderItems, getOrderStatusLog, updateOrderStatus } from "../../features/orders/service"
import { Pagination } from "../components/pagination"
import { fmtStatus } from "../helpers"

const STATUS_FLOW = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    delivered: "success",
    placed: "warning",
    cancelled: "error",
    confirmed: "info",
    preparing: "primary",
    ready: "primary",
    out_for_delivery: "info",
  }
  return <span class={"badge text-white badge-" + (colors[status] ?? "neutral")}>{fmtStatus(status)}</span>
}

export async function listOrders(c: Context) {
  const db = c.env.DB
  const page = parseInt(c.req.query("page") || "1")
  const limit = 7
  const status = c.req.query("status")
  const { orders, total } = await getOrders(db, { status, page, limit })

  return c.html(
    <AdminLayout title="Orders" currentPath="/admin/orders">
      <h1 class="text-2xl font-bold mb-4">Orders</h1>
      {c.req.query("updated") && (
        <div class="alert alert-success mb-4">Order updated successfully.</div>
      )}

      <div class="flex flex-wrap gap-2 mb-4">
        <a href="/admin/orders" class="btn btn-sm btn-outline btn-secondary">All</a>
        <a href="/admin/orders?status=placed" class="btn btn-sm btn-outline btn-warning">Placed</a>
        <a href="/admin/orders?status=confirmed" class="btn btn-sm btn-outline btn-info">Confirmed</a>
        <a href="/admin/orders?status=preparing" class="btn btn-sm btn-outline btn-primary">Preparing</a>
        <a href="/admin/orders?status=ready" class="btn btn-sm btn-outline btn-primary">Ready</a>
        <a href="/admin/orders?status=delivered" class="btn btn-sm btn-outline btn-success">Delivered</a>
        <a href="/admin/orders?status=cancelled" class="btn btn-sm btn-outline btn-error">Cancelled</a>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr>
                <td>{order.id}</td>
                <td>{order.customer_name}</td>
                <td>{order.phone}</td>
                <td>{statusBadge(order.status)}</td>
                <td>{order.payment_status}</td>
                <td>R{order.total.toFixed(2)}</td>
                <td>
                  <a href={"/admin/orders/" + order.id} class="btn btn-sm btn-primary">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} baseUrl="/admin/orders" additionalParams={status ? { status } : undefined} />
    </AdminLayout>,
  )
}

export async function orderDetail(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const order = await getOrderById(db, id)
  if (!order) return c.text("Order not found", 404)

  const items = await getOrderItems(db, id)
  const statusLog = await getOrderStatusLog(db, id)

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null

  return c.html(
    <AdminLayout title={"Order #" + order.id} currentPath="/admin/orders">
      <div class="flex items-center gap-3 mb-4">
        <a href="/admin/orders" class="btn btn-sm btn-ghost">&larr; Orders</a>
        <h1 class="text-2xl font-bold">Order #{order.id}</h1>
      </div>

      {c.req.query("updated") && (
        <div class="alert alert-success mb-4">Status updated successfully.</div>
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h5 class="card-title">Customer</h5>
            <p><strong>Name:</strong> {order.customer_name}</p>
            <p><strong>Phone:</strong> {order.phone}</p>
            <p><strong>Address:</strong> {order.delivery_address ?? "—"}</p>
            <p><strong>Notes:</strong> {order.notes ?? "—"}</p>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h5 class="card-title">Status</h5>
            <p>
              <strong>Current:</strong>{" "}
              {statusBadge(order.status)}
            </p>
            <p><strong>Payment:</strong> {order.payment_status} ({order.payment_method})</p>
            <p><strong>Total:</strong> R{order.total.toFixed(2)}</p>
            <p><strong>Created:</strong> {order.created_at}</p>
          </div>
        </div>
      </div>

      {order.status !== "delivered" && order.status !== "cancelled" && (
        <div class="card bg-base-100 shadow mb-6">
          <div class="card-body">
            <h5 class="card-title">Update Status</h5>
            <div class="flex items-center gap-2">
              <span>Current: {statusBadge(order.status)}</span>
              <form method="post" action={"/admin/orders/" + order.id + "/status"} class="flex items-center gap-2">
                <select name="status" class="select select-bordered select-sm w-auto">
                  {STATUS_FLOW.filter((s) => {
                    const idx = STATUS_FLOW.indexOf(s)
                    return idx > currentIdx
                  }).map((s) => (
                    <option value={s}>{s}</option>
                  ))}
                  <option value="cancelled" class="text-error">cancelled (irreversible)</option>
                </select>
                <button type="submit" class="btn btn-sm btn-primary">Update</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <h3 class="text-lg font-semibold mb-2">Items</h3>
      <div class="overflow-x-auto mb-6">
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>R{item.unit_price.toFixed(2)}</td>
                <td>R{(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 class="text-lg font-semibold mb-2">Status History</h3>
      <div class="overflow-x-auto">
        <table class="table table-xs">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>By</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {statusLog.map((log) => (
              <tr>
                <td>{log.from_status ?? "—"}</td>
                <td>{statusBadge(log.to_status)}</td>
                <td>{log.changed_by}</td>
                <td>{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>,
  )
}

export async function updateStatus(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const body = await c.req.parseBody()
  const newStatus = body.status as string

  const order = await updateOrderStatus(db, id, newStatus, "admin")
  if (!order) return c.text("Order not found", 404)

  if (newStatus === "delivered" || newStatus === "cancelled") {
    return c.redirect("/admin/orders?updated=1")
  }

  return c.redirect(`/admin/orders/${id}?updated=1`)
}

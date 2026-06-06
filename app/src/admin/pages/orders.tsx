import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getOrders, getOrderById, getOrderItems, getOrderStatusLog, updateOrderStatus } from "../../features/orders/service"

const STATUS_FLOW = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    delivered: "success",
    placed: "warning",
    cancelled: "danger",
    confirmed: "info",
    preparing: "primary",
    ready: "primary",
    out_for_delivery: "info",
  }
  return <span class={"badge bg-" + (colors[status] ?? "secondary")}>{status}</span>
}

export async function listOrders(c: Context) {
  const db = c.env.DB
  const status = c.req.query("status")
  const { orders } = await getOrders(db, { status, limit: 50 })

  return c.html(
    <AdminLayout title="Orders">
      <h1 class="mb-4">Orders</h1>
      <div class="mb-3">
        <a href="/admin/orders" class="btn btn-sm btn-outline-secondary me-1">All</a>
        <a href="/admin/orders?status=placed" class="btn btn-sm btn-outline-warning me-1">Placed</a>
        <a href="/admin/orders?status=confirmed" class="btn btn-sm btn-outline-info me-1">Confirmed</a>
        <a href="/admin/orders?status=preparing" class="btn btn-sm btn-outline-primary me-1">Preparing</a>
        <a href="/admin/orders?status=ready" class="btn btn-sm btn-outline-primary me-1">Ready</a>
        <a href="/admin/orders?status=delivered" class="btn btn-sm btn-outline-success me-1">Delivered</a>
        <a href="/admin/orders?status=cancelled" class="btn btn-sm btn-outline-danger">Cancelled</a>
      </div>
      <table class="table table-striped">
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
    <AdminLayout title={"Order #" + order.id}>
      <h1 class="mb-4">Order #{order.id}</h1>

      {c.req.query("updated") && (
        <div class="alert alert-success">Status updated successfully.</div>
      )}

      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Customer</h5>
              <p><strong>Name:</strong> {order.customer_name}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Address:</strong> {order.delivery_address ?? "—"}</p>
              <p><strong>Notes:</strong> {order.notes ?? "—"}</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
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
      </div>

      {order.status !== "delivered" && order.status !== "cancelled" && (
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">Update Status</h5>
            <div class="d-flex gap-2 align-items-center">
              <span class="me-2">Current: {statusBadge(order.status)}</span>
              <form method="post" action={"/admin/orders/" + order.id + "/status"} class="d-flex gap-2 align-items-center">
                <select name="status" class="form-select form-select-sm" style="width:auto">
                  {STATUS_FLOW.filter((s) => {
                    const idx = STATUS_FLOW.indexOf(s)
                    return idx > currentIdx
                  }).map((s) => (
                    <option value={s}>{s}</option>
                  ))}
                  <option value="cancelled" class="text-danger">cancelled (irreversible)</option>
                </select>
                <button type="submit" class="btn btn-sm btn-primary">Update</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <h3>Items</h3>
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

      <h3>Status History</h3>
      <table class="table table-sm">
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

  return c.redirect(`/admin/orders/${id}?updated=1`)
}

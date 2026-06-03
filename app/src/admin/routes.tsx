import { Hono } from "hono"
import type { D1Database } from "@cloudflare/workers-types"
import { jsxRenderer } from "hono/jsx-renderer"
import { getDb } from "../lib/d1"
import { getDashboardStats, getOrders, getOrderById, getOrderItems, getOrderStatusLog } from "../features/orders/service"
import { getCategories, getMenuItems } from "../features/menu/service"
import { getIngredients } from "../features/stock/service"
import { getDailyReport } from "../features/reporting/service"
import { requireAdmin } from "../auth/middleware"

type Bindings = { DB: D1Database; ADMIN_TOKEN?: string }

const app = new Hono<{ Bindings: Bindings }>()

// Login routes — no auth needed
app.get("/login", (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Login — SoulFood Admin</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body class="bg-light">
        <div class="container" style="max-width: 400px; margin-top: 100px">
          <h2 class="mb-4">SoulFood Admin</h2>
          <form method="post" action="/admin/login">
            <div class="mb-3">
              <label class="form-label">Token</label>
              <input type="password" name="token" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
          </form>
        </div>
      </body>
    </html>,
  )
})

app.post("/login", async (c) => {
  const body = await c.req.parseBody()
  const token = body.token as string
  const expected = c.env.ADMIN_TOKEN

  if (token === expected) {
    c.header("Set-Cookie", `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax`)
    return c.redirect("/admin/dashboard")
  }

  return c.html(
    <div class="alert alert-danger">Invalid token</div>,
    { status: 401 },
  )
})

// Protected routes
app.use("/*", requireAdmin)

app.use(
  "/*",
  jsxRenderer(({ children }) => (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoulFood Admin</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
          <div class="container">
            <a class="navbar-brand" href="/admin">SoulFood Admin</a>
            <div class="collapse navbar-collapse">
              <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a class="nav-link" href="/admin/dashboard">Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="/admin/orders">Orders</a></li>
                <li class="nav-item"><a class="nav-link" href="/admin/menu">Menu</a></li>
                <li class="nav-item"><a class="nav-link" href="/admin/stock">Stock</a></li>
                <li class="nav-item"><a class="nav-link" href="/admin/reports">Reports</a></li>
              </ul>
            </div>
          </div>
        </nav>
        <div class="container">
          {children}
        </div>
      </body>
    </html>
  )),
)

app.get("/dashboard", async (c) => {
  const db = getDb(c.env)
  const stats = await getDashboardStats(db)

  return c.render(
    <div>
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
    </div>,
  )
})

app.get("/", (c) => c.redirect("/dashboard"))

app.get("/orders", async (c) => {
  const db = getDb(c.env)
  const status = c.req.query("status")
  const { orders } = await getOrders(db, { status, limit: 50 })

  return c.render(
    <div>
      <h1 class="mb-4">Orders</h1>
      <div class="mb-3">
        <a href="/admin/orders" class="btn btn-sm btn-outline-secondary me-1">All</a>
        <a href="/admin/orders?status=placed" class="btn btn-sm btn-outline-warning me-1">Placed</a>
        <a href="/admin/orders?status=preparing" class="btn btn-sm btn-outline-primary me-1">Preparing</a>
        <a href="/admin/orders?status=delivered" class="btn btn-sm btn-outline-success">Delivered</a>
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
              <td>
                <span class={"badge bg-" + (
                  order.status === "delivered" ? "success" :
                  order.status === "placed" ? "warning" :
                  order.status === "cancelled" ? "danger" : "primary"
                )}>{order.status}</span>
              </td>
              <td>{order.payment_status}</td>
              <td>R{order.total.toFixed(2)}</td>
              <td>
                <a href={"/admin/orders/" + order.id} class="btn btn-sm btn-primary">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>,
  )
})

app.get("/orders/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const db = getDb(c.env)
  const order = await getOrderById(db, id)
  if (!order) return c.text("Order not found", 404)

  const items = await getOrderItems(db, id)
  const statusLog = await getOrderStatusLog(db, id)

  return c.render(
    <div>
      <h1 class="mb-4">Order #{order.id}</h1>
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
                <span class={"badge bg-" + (
                  order.status === "delivered" ? "success" :
                  order.status === "placed" ? "warning" :
                  order.status === "cancelled" ? "danger" : "primary"
                )}>{order.status}</span>
              </p>
              <p><strong>Payment:</strong> {order.payment_status} ({order.payment_method})</p>
              <p><strong>Total:</strong> R{order.total.toFixed(2)}</p>
              <p><strong>Created:</strong> {order.created_at}</p>
            </div>
          </div>
        </div>
      </div>

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
              <td>{log.to_status}</td>
              <td>{log.changed_by}</td>
              <td>{log.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>,
  )
})

app.get("/menu", async (c) => {
  const db = getDb(c.env)
  const categories = await getCategories(db)
  const items = await getMenuItems(db)

  return c.render(
    <div>
      <h1 class="mb-4">Menu Management</h1>

      <h3>Categories</h3>
      <table class="table table-sm mb-4">
        <thead>
          <tr>
            <th>Name</th>
            <th>Sort</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr>
              <td>{cat.name}</td>
              <td>{cat.sort_order}</td>
              <td>{cat.available ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Menu Items</h3>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Prep Time</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr>
              <td>{item.name}</td>
              <td>{categories.find((c) => c.id === item.category_id)?.name ?? "—"}</td>
              <td>R{item.price.toFixed(2)}</td>
              <td>{item.prep_time_minutes ?? "—"} min</td>
              <td>{item.available ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>,
  )
})

app.get("/stock", async (c) => {
  const db = getDb(c.env)
  const ingredients = await getIngredients(db)

  return c.render(
    <div>
      <h1 class="mb-4">Stock Management</h1>

      <h3>Ingredients</h3>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => {
            const isLow = ing.current_stock <= ing.min_stock_level
            return (
              <tr class={isLow ? "table-danger" : ""}>
                <td>{ing.name}</td>
                <td>{ing.unit}</td>
                <td>{ing.current_stock}</td>
                <td>{ing.min_stock_level}</td>
                <td>
                  {isLow ? (
                    <span class="badge bg-danger">Reorder</span>
                  ) : (
                    <span class="badge bg-success">OK</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>,
  )
})

app.get("/reports", async (c) => {
  const db = getDb(c.env)
  const today = new Date().toISOString().split("T")[0]
  const report = await getDailyReport(db, today)

  return c.render(
    <div>
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
    </div>,
  )
})

export default app

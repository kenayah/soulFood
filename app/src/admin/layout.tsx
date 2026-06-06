import type { Child } from "hono/jsx"

export function AdminLayout({ title, children }: { title?: string; children: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title ? `${title} — SoulFood Admin` : "SoulFood Admin"}</title>
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
  )
}

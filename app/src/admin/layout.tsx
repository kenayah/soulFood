import type { Child } from "hono/jsx"

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Menu", path: "/admin/menu" },
  { label: "Stock", path: "/admin/stock" },
  { label: "Reports", path: "/admin/reports" },
]

export function AdminLayout({ title, currentPath, children }: { title?: string; currentPath?: string; children: Child }) {
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
                {NAV_ITEMS.map((item) => (
                  <li class="nav-item">
                    <a
                      class={"nav-link" + (currentPath?.startsWith(item.path) ? " active" : "")}
                      href={item.path}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
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

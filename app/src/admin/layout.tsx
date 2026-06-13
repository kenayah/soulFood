import type { Child } from "hono/jsx"

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Menu", path: "/admin/menu" },
  { label: "Stock", path: "/admin/stock" },
  { label: "Customers", path: "/admin/customers" },
  { label: "Suppliers", path: "/admin/suppliers" },
  { label: "PO", path: "/admin/purchase-orders" },
  { label: "Reports", path: "/admin/reports" },
]

const TW_CONFIG = `
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "var(--p)",
        "primary-content": "var(--pc)",
        secondary: "var(--s)",
        "secondary-content": "var(--sc)",
        accent: "var(--a)",
        "accent-content": "var(--ac)",
        neutral: "var(--n)",
        "neutral-content": "var(--nc)",
        "base-100": "var(--b1)",
        "base-200": "var(--b2)",
        "base-300": "var(--b3)",
        "base-content": "var(--bc)",
        info: "var(--in)",
        "info-content": "var(--inc)",
        success: "var(--su)",
        "success-content": "var(--suc)",
        warning: "var(--wa)",
        "warning-content": "var(--wac)",
        error: "var(--er)",
        "error-content": "var(--erc)",
      }
    }
  }
}
`

export function AdminLayout({ title, currentPath, children }: { title?: string; currentPath?: string; children: Child }) {
  return (
    <html lang="en" data-theme="bumblebee">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title ? `${title} — SoulFood Admin` : "SoulFood Admin"}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>{TW_CONFIG}</script>
        <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css" />
        <style>
          {`[data-theme=bumblebee] {
  --p: 0.63 0.22 41;
  --pf: 0.53 0.22 41;
  --pc: 0.98 0 0;
}
.menu li a.active {
  background-color: transparent !important;
  color: inherit !important;
  opacity: 0.4;
  pointer-events: none;
  cursor: default;
}`}
        </style>
      </head>
      <body>
        <div class="navbar bg-base-100 shadow-sm mb-4">
          <div class="flex-1 flex items-center gap-2">
            <img src="/logo.webp" alt="SoulFood" class="h-8 w-auto" />
            <span class="badge badge-primary badge-sm">Admin</span>
          </div>
          <div class="flex-none flex items-center gap-1">
            <ul class="menu menu-horizontal px-1">
              {NAV_ITEMS.map((item) => (
                <li>
                  <a
                    class={currentPath?.startsWith(item.path) ? "active" : ""}
                    href={item.path}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <button class="btn btn-ghost btn-circle">
              <div class="indicator">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="badge badge-xs badge-primary indicator-item"></span>
              </div>
            </button>
          </div>
        </div>
        <div class="container mx-auto px-4">
          {children}
        </div>
      </body>
    </html>
  )
}

import type { Context } from "hono"
import { createMiddleware } from "hono/factory"

type Bindings = { ADMIN_TOKEN?: string }

export const requireAuth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
  const expected = c.env.ADMIN_TOKEN

  if (!expected || token !== expected) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  await next()
})

export const requireAdmin = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
  const expected = c.env.ADMIN_TOKEN

  // For admin page SSR, check cookie instead of header
  const cookieToken = c.req.header("Cookie")?.match(/admin_token=([^;]+)/)?.[1]

  if ((!expected || (token !== expected && cookieToken !== expected))) {
    if (c.req.path.startsWith("/admin") && !token) {
      // Redirect to login page for SSR routes
      if (c.req.header("Accept")?.includes("text/html")) {
        return c.redirect("/admin/login")
      }
    }
    return c.json({ error: "Unauthorized" }, 401)
  }

  await next()
})

import type { Context } from "hono"

export function loginForm(c: Context) {
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
}

export async function login(c: Context) {
  const body = await c.req.parseBody()
  const token = body.token as string
  const expected = c.env.ADMIN_TOKEN

  if (token === expected) {
    c.header("Set-Cookie", `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax`)
    return c.redirect("/admin/dashboard")
  }

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
          <div class="alert alert-danger">Invalid token</div>
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
    { status: 401 } as any,
  )
}

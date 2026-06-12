import type { Context } from "hono"

function loginPage(c: Context, error?: string) {
  return c.html(
    <html lang="en" data-theme="bumblebee">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Login — SoulFood Admin</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>{`tailwind.config={theme:{extend:{colors:{primary:"var(--p)","primary-content":"var(--pc)",secondary:"var(--s)","secondary-content":"var(--sc)",accent:"var(--a)","accent-content":"var(--ac)",neutral:"var(--n)","neutral-content":"var(--nc)","base-100":"var(--b1)","base-200":"var(--b2)","base-300":"var(--b3)","base-content":"var(--bc)",info:"var(--in)","info-content":"var(--inc)",success:"var(--su)","success-content":"var(--suc)",warning:"var(--wa)","warning-content":"var(--wac)",error:"var(--er)","error-content":"var(--erc)"}}}}`}</script>
        <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css" />
        <style>{`[data-theme=bumblebee]{--p:0.63 0.22 41;--pf:0.53 0.22 41;--pc:0.98 0 0}`}</style>
      </head>
      <body class="bg-base-200 min-h-screen flex items-center justify-center">
        <div class="card bg-base-100 shadow-xl w-full max-w-sm">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">SoulFood Admin</h2>
            {error && <div class="alert alert-error">{error}</div>}
            <form method="post" action="/admin/login">
              <label class="form-control w-full">
                <span class="label-text mb-1">Token</span>
                <input type="password" name="token" class="input input-bordered w-full" required />
              </label>
              <button type="submit" class="btn btn-primary w-full mt-4">Login</button>
            </form>
          </div>
        </div>
      </body>
    </html>,
    error ? { status: 401 } as any : undefined,
  )
}

export function loginForm(c: Context) {
  return loginPage(c)
}

export async function login(c: Context) {
  const body = await c.req.parseBody()
  const token = body.token as string
  const expected = c.env.ADMIN_TOKEN

  if (token === expected) {
    c.header("Set-Cookie", `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax`)
    return c.redirect("/admin/dashboard")
  }

  return loginPage(c, "Invalid token")
}

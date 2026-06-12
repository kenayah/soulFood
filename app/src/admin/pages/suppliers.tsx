import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getSuppliers, createSupplier, updateSupplier } from "../../features/stock/service"

export async function suppliers(c: Context) {
  const db = c.env.DB
  const list = await getSuppliers(db)

  const editId = c.req.query("edit")
  const editSupplier = editId ? list.find((s) => s.id === parseInt(editId)) : null

  return c.html(
    <AdminLayout title="Suppliers" currentPath="/admin/suppliers">
      <h1 class="text-2xl font-bold mb-4">Supplier Management</h1>

      {c.req.query("created") && <div class="alert alert-success mb-4">Supplier created.</div>}
      {c.req.query("updated") && <div class="alert alert-success mb-4">Supplier updated.</div>}

      <div class="card bg-base-100 shadow mb-6 max-w-lg">
        <div class="card-body">
          {editSupplier ? (
            <>
              <div class="flex justify-between items-center mb-3">
                <h5 class="card-title">Edit: {editSupplier.name}</h5>
                <a href="/admin/suppliers" class="btn btn-sm btn-ghost">Cancel</a>
              </div>
              <form method="post" action={"/admin/suppliers/" + editSupplier.id + "/update"}>
                <label class="form-control w-full mb-2">
                  <span class="label-text">Name</span>
                  <input name="name" class="input input-bordered w-full" value={editSupplier.name} required />
                </label>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <label class="form-control">
                    <span class="label-text">Contact person</span>
                    <input name="contactPerson" class="input input-bordered w-full" value={editSupplier.contact_person ?? ""} />
                  </label>
                  <label class="form-control">
                    <span class="label-text">Phone</span>
                    <input name="phone" class="input input-bordered w-full" value={editSupplier.phone ?? ""} />
                  </label>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <label class="form-control">
                    <span class="label-text">Email</span>
                    <input name="email" type="email" class="input input-bordered w-full" value={editSupplier.email ?? ""} />
                  </label>
                  <label class="form-control">
                    <span class="label-text">Lead time (days)</span>
                    <input name="leadTimeDays" type="number" class="input input-bordered w-full" value={editSupplier.lead_time_days} />
                  </label>
                </div>
                <label class="flex items-center gap-2 mb-3">
                  <input type="checkbox" name="active" value="1" class="checkbox" checked={editSupplier.active ? true : false} />
                  <span>Active</span>
                </label>
                <button type="submit" class="btn btn-primary btn-sm">Save</button>
              </form>
            </>
          ) : (
            <>
              <h5 class="card-title mb-3">New Supplier</h5>
              <form method="post" action="/admin/suppliers">
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <label class="form-control">
                    <span class="label-text">Name</span>
                    <input name="name" class="input input-bordered input-sm w-full" required />
                  </label>
                  <label class="form-control">
                    <span class="label-text">Contact person</span>
                    <input name="contactPerson" class="input input-bordered input-sm w-full" />
                  </label>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <label class="form-control">
                    <span class="label-text">Phone</span>
                    <input name="phone" class="input input-bordered input-sm w-full" />
                  </label>
                  <label class="form-control">
                    <span class="label-text">Email</span>
                    <input name="email" type="email" class="input input-bordered input-sm w-full" />
                  </label>
                </div>
                <label class="form-control w-full mb-2">
                  <span class="label-text">Lead time (days)</span>
                  <input name="leadTimeDays" type="number" class="input input-bordered input-sm w-full" defaultValue="1" />
                </label>
                <button type="submit" class="btn btn-primary btn-sm">Add Supplier</button>
              </form>
            </>
          )}
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-2">All Suppliers</h3>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Lead Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr>
                <td>{s.name}</td>
                <td>{s.contact_person ?? "—"}</td>
                <td>{s.phone ?? "—"}</td>
                <td>{s.email ?? "—"}</td>
                <td>{s.lead_time_days} days</td>
                <td>{s.active ? <span class="badge badge-success">Active</span> : <span class="badge badge-ghost">Inactive</span>}</td>
                <td>
                  <a href={"/admin/suppliers?edit=" + s.id} class="btn btn-sm btn-ghost">Edit</a>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colspan={7} class="text-center text-base-content/60 py-4">No suppliers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>,
  )
}

export async function createSupplierHandler(c: Context) {
  const db = c.env.DB
  const body = await c.req.parseBody()
  await createSupplier(db, {
    name: body.name as string,
    contactPerson: body.contactPerson as string || undefined,
    phone: body.phone as string || undefined,
    email: body.email as string || undefined,
    leadTimeDays: parseInt(body.leadTimeDays as string) || 1,
  })
  return c.redirect("/admin/suppliers?created=1")
}

export async function updateSupplierHandler(c: Context) {
  const db = c.env.DB
  const id = parseInt(c.req.param("id")!)
  const body = await c.req.parseBody()
  await updateSupplier(db, id, {
    name: body.name as string,
    contactPerson: body.contactPerson as string || undefined,
    phone: body.phone as string || undefined,
    email: body.email as string || undefined,
    leadTimeDays: parseInt(body.leadTimeDays as string) || 1,
    active: body.active === "1",
  })
  return c.redirect("/admin/suppliers?updated=1")
}

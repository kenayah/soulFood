import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getCategories, getMenuItems, getMenuItemById, createCategory, updateCategory, deleteCategory, createMenuItem, updateMenuItem, deleteMenuItem } from "../../features/menu/service"

export async function menu(c: Context) {
  const db = c.env.DB
  const categories = await getCategories(db)
  const items = await getMenuItems(db)

  const editItemId = c.req.query("edit")
  const editItem = editItemId ? await getMenuItemById(db, parseInt(editItemId)) : null

  return c.html(
    <AdminLayout title="Menu" currentPath="/admin/menu">
      <h1 class="mb-4">Menu Management</h1>

      {c.req.query("created") && <div class="alert alert-success">Created successfully.</div>}
      {c.req.query("updated") && <div class="alert alert-success">Updated successfully.</div>}
      {c.req.query("deleted") && <div class="alert alert-success">Deleted successfully.</div>}

      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">New Category</h5>
              <form method="post" action="/admin/menu/category">
                <div class="mb-2">
                  <input name="name" class="form-control" placeholder="Category name" required />
                </div>
                <div class="mb-2">
                  <input name="sortOrder" type="number" class="form-control" placeholder="Sort order" defaultValue="0" />
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Add Category</button>
              </form>
            </div>
          </div>
        </div>

        <div class="col-md-8">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">New Menu Item</h5>
              <form method="post" action="/admin/menu/item">
                <div class="row">
                  <div class="col-md-6 mb-2">
                    <input name="name" class="form-control" placeholder="Item name" required />
                  </div>
                  <div class="col-md-3 mb-2">
                    <input name="price" type="number" step="0.01" class="form-control" placeholder="Price (R)" required />
                  </div>
                  <div class="col-md-3 mb-2">
                    <input name="prepTimeMinutes" type="number" class="form-control" placeholder="Prep time (min)" />
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-2">
                    <select name="categoryId" class="form-select">
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div class="col-md-6 mb-2">
                    <textarea name="description" class="form-control" placeholder="Description" rows={2} />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Add Item</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <h3>Categories</h3>
      <table class="table table-sm mb-4">
        <thead>
          <tr>
            <th>Name</th>
            <th>Sort</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr>
              <td>{cat.name}</td>
              <td>{cat.sort_order}</td>
              <td>{cat.available ? "Yes" : "No"}</td>
              <td>
                <form method="post" action={"/admin/menu/category/" + cat.id + "/toggle"} style="display:inline">
                  <button type="submit" class="btn btn-sm btn-outline-secondary">
                    {cat.available ? "Disable" : "Enable"}
                  </button>
                </form>
              </td>
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
            <th>Actions</th>
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
              <td>
                <a href={"/admin/menu?edit=" + item.id} class="btn btn-sm btn-outline-primary me-1">Edit</a>
                <form method="post" action={"/admin/menu/item/" + item.id + "/delete"} style="display:inline">
                  <button type="submit" class="btn btn-sm btn-outline-danger">Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editItem && (
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Edit: {editItem.name}</h5>
            <form method="post" action={"/admin/menu/item/" + editItem.id}>
              <div class="row">
                <div class="col-md-6 mb-2">
                  <label class="form-label">Name</label>
                  <input name="name" class="form-control" value={editItem.name} required />
                </div>
                <div class="col-md-3 mb-2">
                  <label class="form-label">Price (R)</label>
                  <input name="price" type="number" step="0.01" class="form-control" value={editItem.price} required />
                </div>
                <div class="col-md-3 mb-2">
                  <label class="form-label">Prep time (min)</label>
                  <input name="prepTimeMinutes" type="number" class="form-control" value={editItem.prep_time_minutes ?? ""} />
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-2">
                  <label class="form-label">Category</label>
                  <select name="categoryId" class="form-select">
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option value={cat.id} selected={cat.id === editItem.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div class="col-md-6 mb-2">
                  <label class="form-label">Description</label>
                  <textarea name="description" class="form-control" rows={2}>{editItem.description ?? ""}</textarea>
                </div>
              </div>
              <div class="mb-2">
                <label class="form-label">
                  <input type="checkbox" name="available" value="1" checked={editItem.available} /> Available
                </label>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <a href="/admin/menu" class="btn btn-secondary ms-2">Cancel</a>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>,
  )
}

export async function createCategoryHandler(c: Context) {
  const db = c.env.DB
  const body = await c.req.parseBody()
  await createCategory(db, body.name as string, parseInt(body.sortOrder as string) || 0)
  return c.redirect("/admin/menu?created=1")
}

export async function toggleCategory(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const cat = await getCategories(db)
  const current = cat.find((c) => c.id === id)
  if (current) {
    await updateCategory(db, id, { available: !current.available })
  }
  return c.redirect("/admin/menu")
}

export async function createItemHandler(c: Context) {
  const db = c.env.DB
  const body = await c.req.parseBody()
  await createMenuItem(db, {
    name: body.name as string,
    price: parseFloat(body.price as string),
    description: body.description as string || undefined,
    categoryId: body.categoryId ? parseInt(body.categoryId as string) : undefined,
    prepTimeMinutes: body.prepTimeMinutes ? parseInt(body.prepTimeMinutes as string) : undefined,
  })
  return c.redirect("/admin/menu?created=1")
}

export async function updateItemHandler(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const body = await c.req.parseBody()
  await updateMenuItem(db, id, {
    name: body.name as string,
    price: parseFloat(body.price as string),
    description: body.description as string || undefined,
    categoryId: body.categoryId ? parseInt(body.categoryId as string) : undefined,
    prepTimeMinutes: body.prepTimeMinutes ? parseInt(body.prepTimeMinutes as string) : undefined,
    available: body.available === "1",
  })
  return c.redirect("/admin/menu?updated=1")
}

export async function deleteItemHandler(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  await deleteMenuItem(db, id)
  return c.redirect("/admin/menu?deleted=1")
}

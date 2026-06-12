import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getCategories, getMenuItems, getMenuItemById, createCategory, updateCategory, createMenuItem, updateMenuItem, deleteMenuItem } from "../../features/menu/service"

export async function menu(c: Context) {
  const db = c.env.DB
  const categories = await getCategories(db, true)
  const items = await getMenuItems(db)

  const editItemId = c.req.query("edit")
  const editItem = editItemId ? await getMenuItemById(db, parseInt(editItemId)) : null

  const activeTab = c.req.query("tab") || "items"
  const searchQuery = (c.req.query("search") || "").toLowerCase()
  const categoryFilter = c.req.query("category")

  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery)
    const matchesCategory = !categoryFilter || item.category_id === parseInt(categoryFilter)
    return matchesSearch && matchesCategory
  })

  return c.html(
    <AdminLayout title="Menu" currentPath="/admin/menu">
      <h1 class="text-2xl font-bold mb-4">Menu Management</h1>

      {c.req.query("created") && <div class="alert alert-success mb-4">Created successfully.</div>}
      {c.req.query("updated") && <div class="alert alert-success mb-4">Updated successfully.</div>}
      {c.req.query("deleted") && <div class="alert alert-success mb-4">Deleted successfully.</div>}
      {c.req.query("error") && <div class="alert alert-error mb-4">{c.req.query("error")}</div>}

      <div role="tablist" class="tabs tabs-bordered mb-4">
        <a role="tab" class={"tab" + (activeTab === "categories" ? " tab-active" : "")} href="/admin/menu?tab=categories">Categories</a>
        <a role="tab" class={"tab" + (activeTab === "items" ? " tab-active" : "")} href="/admin/menu?tab=items">Items</a>
      </div>

      {activeTab === "categories" && (
        <>
          <div class="flex justify-between items-center mb-3">
            <h5 class="font-semibold">All Categories</h5>
            <button type="button" class="btn btn-primary btn-sm" onclick="newCategoryModal.showModal()">+ Add Category</button>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-sm">
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
                      <form method="post" action={"/admin/menu/category/" + cat.id + "/toggle"} class="inline">
                        <button type="submit" class="btn btn-sm btn-outline btn-secondary">
                          {cat.available ? "Disable" : "Enable"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dialog id="newCategoryModal" class="modal">
            <div class="modal-box">
              <form method="dialog">
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
              </form>
              <h3 class="text-lg font-bold mb-4">New Category</h3>
              <form method="post" action="/admin/menu/category">
                <label class="form-control w-full mb-3">
                  <span class="label-text">Name</span>
                  <input name="name" class="input input-bordered w-full" required />
                </label>
                <label class="form-control w-full mb-3">
                  <span class="label-text">Sort order</span>
                  <input name="sortOrder" type="number" class="input input-bordered w-full" defaultValue="0" />
                </label>
                <div class="modal-action">
                  <button type="button" class="btn btn-ghost" onclick="newCategoryModal.close()">Cancel</button>
                  <button type="submit" class="btn btn-primary">Add Category</button>
                </div>
              </form>
            </div>
            <form method="dialog" class="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </>
      )}

      {activeTab === "items" && (
        <>
          {editItem && (
            <div class="card bg-base-100 shadow mb-4">
              <div class="card-body">
                <div class="flex justify-between items-center mb-3">
                  <h5 class="card-title">Edit: {editItem.name}</h5>
                  <a href="/admin/menu?tab=items" class="btn btn-sm btn-ghost">Cancel</a>
                </div>
                <form method="post" action={"/admin/menu/item/" + editItem.id}>
                  <div class="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                    <div class="md:col-span-2">
                      <label class="label"><span class="label-text">Name</span></label>
                      <input name="name" class="input input-bordered w-full" value={editItem.name} required />
                    </div>
                    <div>
                      <label class="label"><span class="label-text">Price (R)</span></label>
                      <input name="price" type="number" step="0.01" class="input input-bordered w-full" value={editItem.price} required />
                    </div>
                    <div>
                      <label class="label"><span class="label-text">Prep time (min)</span></label>
                      <input name="prepTimeMinutes" type="number" class="input input-bordered w-full" value={editItem.prep_time_minutes ?? ""} />
                    </div>
                    <div>
                      <label class="label"><span class="label-text">Available</span></label>
                      <label class="flex items-center gap-2 pt-2">
                        <input type="checkbox" name="available" value="1" class="checkbox" checked={editItem.available ? true : false} />
                        <span>Available</span>
                      </label>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label class="label"><span class="label-text">Category</span></label>
                      <select name="categoryId" class="select select-bordered w-full">
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option value={cat.id} selected={cat.id === editItem.category_id ? true : false}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label class="label"><span class="label-text">Description</span></label>
                      <textarea name="description" class="textarea textarea-bordered w-full" rows={2}>{editItem.description ?? ""}</textarea>
                    </div>
                    <div>
                      <label class="label"><span class="label-text">Starch</span></label>
                      <input name="starch" class="input input-bordered w-full" value={editItem.starch ?? ""} placeholder="Creamy Samp or Steamed Bread" />
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div class="md:col-span-2">
                      <label class="label"><span class="label-text">Image URL</span></label>
                      <input name="image" class="input input-bordered w-full" value={editItem.image ?? ""} placeholder="https://..." />
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
              </div>
            </div>
          )}

          <form method="get" action="/admin/menu" class="flex flex-wrap gap-2 mb-3">
            <input type="hidden" name="tab" value="items" />
            <input type="text" name="search" class="input input-bordered input-sm flex-1 min-w-40" placeholder="Search items..." value={c.req.query("search") || ""} />
            <select name="category" class="select select-bordered select-sm w-auto" onchange="this.form.submit()">
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option value={cat.id} selected={categoryFilter === String(cat.id)}>{cat.name}</option>
              ))}
            </select>
            <button type="submit" class="btn btn-sm btn-outline btn-secondary">Search</button>
            {searchQuery || categoryFilter ? <a href="/admin/menu?tab=items" class="btn btn-sm btn-outline btn-error">Clear</a> : ""}
            <button type="button" class="btn btn-sm btn-primary" onclick="newItemModal.showModal()">+ Add Item</button>
          </form>

          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Prep</th>
                  <th>Image</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr>
                    <td>{item.name}</td>
                    <td>{categories.find((c) => c.id === item.category_id)?.name ?? "—"}</td>
                    <td>R{item.price.toFixed(2)}</td>
                    <td>{item.prep_time_minutes ?? "—"} min</td>
                    <td>
                      {item.image ? (
                        <>
                          <a class="link link-primary" onclick={"imageModal" + item.id + ".showModal()"}>View</a>
                          <dialog id={"imageModal" + item.id} class="modal">
                            <div class="modal-box max-w-3xl">
                              <form method="dialog">
                                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                              </form>
                              <h3 class="text-lg font-bold mb-2">{item.name}</h3>
                              <img src={item.image} alt={item.name} class="w-full" />
                            </div>
                            <form method="dialog" class="modal-backdrop">
                              <button>close</button>
                            </form>
                          </dialog>
                        </>
                      ) : "—"}
                    </td>
                    <td>{item.available ? "Yes" : "No"}</td>
                    <td>
                      <a href={"/admin/menu?edit=" + item.id + "&tab=items"} class="btn btn-sm btn-primary me-1">Edit</a>
                      <form method="post" action={"/admin/menu/item/" + item.id + "/delete"} class="inline" onsubmit="return confirm('Delete this item?')">
                        <button type="submit" class="btn btn-sm btn-ghost text-error">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colspan={7} class="text-center text-base-content/60 py-4">No items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!searchQuery && !categoryFilter && items.length > 10 && (
            <p class="text-base-content/60 text-center mt-2">{items.length} items total</p>
          )}

          <dialog id="newItemModal" class="modal">
            <div class="modal-box max-w-xl">
              <form method="dialog">
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
              </form>
              <h3 class="text-lg font-bold mb-4">New Menu Item</h3>
              <form method="post" action="/admin/menu/item">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div class="md:col-span-2">
                    <label class="label"><span class="label-text">Name</span></label>
                    <input name="name" class="input input-bordered w-full" required />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="label"><span class="label-text">Price (R)</span></label>
                    <input name="price" type="number" step="0.01" class="input input-bordered w-full" required />
                  </div>
                  <div>
                    <label class="label"><span class="label-text">Prep time (min)</span></label>
                    <input name="prepTimeMinutes" type="number" class="input input-bordered w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="label"><span class="label-text">Category</span></label>
                    <select name="categoryId" class="select select-bordered w-full">
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="label"><span class="label-text">Description</span></label>
                    <textarea name="description" class="textarea textarea-bordered w-full" rows={2} />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="label"><span class="label-text">Starch</span></label>
                    <input name="starch" class="input input-bordered w-full" placeholder="Creamy Samp or Steamed Bread" />
                  </div>
                  <div>
                    <label class="label"><span class="label-text">Image URL</span></label>
                    <input name="image" class="input input-bordered w-full" placeholder="https://..." />
                  </div>
                </div>
                <div class="modal-action">
                  <button type="button" class="btn btn-ghost" onclick="newItemModal.close()">Cancel</button>
                  <button type="submit" class="btn btn-primary">Add Item</button>
                </div>
              </form>
            </div>
            <form method="dialog" class="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </>
      )}
    </AdminLayout>,
  )
}

export async function createCategoryHandler(c: Context) {
  const db = c.env.DB
  const body = await c.req.parseBody()
  await createCategory(db, body.name as string, parseInt(body.sortOrder as string) || 0)
  return c.redirect("/admin/menu?tab=categories&created=1")
}

export async function toggleCategory(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const cat = await getCategories(db, true)
  const current = cat.find((c) => c.id === id)
  if (current) {
    await updateCategory(db, id, { available: !current.available })
  }
  return c.redirect("/admin/menu?tab=categories")
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
    starch: body.starch as string || undefined,
    image: body.image as string || undefined,
  })
  return c.redirect("/admin/menu?tab=items&created=1")
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
    starch: body.starch as string || undefined,
    image: body.image as string || undefined,
    available: body.available === "1",
  })
  return c.redirect("/admin/menu?tab=items&updated=1")
}

export async function deleteItemHandler(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  try {
    await deleteMenuItem(db, id)
    return c.redirect("/admin/menu?tab=items&deleted=1")
  } catch (err) {
    return c.redirect("/admin/menu?tab=items&error=Could+not+delete+item.+It+may+have+existing+orders.")
  }
}

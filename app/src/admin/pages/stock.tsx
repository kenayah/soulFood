import type { Context } from "hono"
import { AdminLayout } from "../layout"
import {
  getIngredients,
  getStockCategories,
  getSuppliers,
  createIngredient,
  adjustStock,
  getStockMovements,
  updateIngredient,
} from "../../features/stock/service"

export async function stock(c: Context) {
  const db = c.env.DB
  const categories = await getStockCategories(db)
  const ingredients = await getIngredients(db)
  const suppliers = await getSuppliers(db)

  const categoryFilter = c.req.query("category")
  const filteredIngredients = categoryFilter
    ? ingredients.filter((i) => i.category_id === parseInt(categoryFilter))
    : ingredients

  const viewMovements = c.req.query("movements")
  const movements = viewMovements
    ? await getStockMovements(db, parseInt(viewMovements))
    : null
  const movementIngredient = viewMovements
    ? ingredients.find((i) => i.id === parseInt(viewMovements))
    : null

  const editId = c.req.query("edit")
  const editIngredient = editId
    ? ingredients.find((i) => i.id === parseInt(editId))
    : null

  return c.html(
    <AdminLayout title="Stock" currentPath="/admin/stock">
      <h1 class="text-2xl font-bold mb-4">Stock Management</h1>

      {c.req.query("adjusted") && <div class="alert alert-success mb-4">Stock adjusted.</div>}
      {c.req.query("created") && <div class="alert alert-success mb-4">Ingredient created.</div>}
      {c.req.query("updated") && <div class="alert alert-success mb-4">Ingredient updated.</div>}

      {editIngredient && (
        <div class="card bg-base-100 shadow mb-6">
          <div class="card-body">
            <div class="flex justify-between items-center mb-3">
              <h5 class="card-title">Edit: {editIngredient.name}</h5>
              <a href={"/admin/stock" + (categoryFilter ? "?category=" + categoryFilter : "")} class="btn btn-sm btn-ghost">Cancel</a>
            </div>
            <form method="post" action={"/admin/stock/ingredient/" + editIngredient.id + "/update" + (categoryFilter ? "?category=" + categoryFilter : "")} class="grid grid-cols-1 md:grid-cols-5 gap-3">
              <label class="form-control">
                <span class="label-text">Name</span>
                <input name="name" class="input input-bordered input-sm w-full" value={editIngredient.name} required />
              </label>
              <label class="form-control">
                <span class="label-text">Category</span>
                <select name="categoryId" class="select select-bordered select-sm w-full">
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option value={cat.id} selected={cat.id === editIngredient.category_id}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <label class="form-control">
                <span class="label-text">Unit</span>
                <input name="unit" class="input input-bordered input-sm w-full" value={editIngredient.unit} />
              </label>
              <label class="form-control">
                <span class="label-text">Stock</span>
                <input name="currentStock" type="number" step="0.01" class="input input-bordered input-sm w-full" value={editIngredient.current_stock} />
              </label>
              <label class="form-control">
                <span class="label-text">Min level</span>
                <input name="minStockLevel" type="number" step="0.01" class="input input-bordered input-sm w-full" value={editIngredient.min_stock_level} />
              </label>
              <label class="form-control">
                <span class="label-text">Max level</span>
                <input name="maxStockLevel" type="number" step="0.01" class="input input-bordered input-sm w-full" value={editIngredient.max_stock_level ?? ""} />
              </label>
              <label class="form-control">
                <span class="label-text">Reorder qty</span>
                <input name="reorderQuantity" type="number" step="0.01" class="input input-bordered input-sm w-full" value={editIngredient.reorder_quantity ?? ""} />
              </label>
              <label class="form-control">
                <span class="label-text">Unit cost (R)</span>
                <input name="unitCost" type="number" step="0.01" class="input input-bordered input-sm w-full" value={editIngredient.unit_cost ?? ""} />
              </label>
              <label class="form-control">
                <span class="label-text">Supplier</span>
                <select name="supplierId" class="select select-bordered select-sm w-full">
                  <option value="">No supplier</option>
                  {suppliers.map((s) => (
                    <option value={s.id} selected={s.id === editIngredient.supplier_id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <div class="md:col-span-5 flex gap-2 mt-2">
                <button type="submit" class="btn btn-primary btn-sm">Save</button>
                <a href={"/admin/stock" + (categoryFilter ? "?category=" + categoryFilter : "")} class="btn btn-ghost btn-sm">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      )}

      <dialog id="newStockModal" class="modal">
        <div class="modal-box max-w-xl">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 class="text-lg font-bold mb-4">New Stock Item</h3>
          <form method="post" action="/admin/stock/ingredient" class="grid grid-cols-1 md:grid-cols-6 gap-3">
            <label class="form-control">
              <span class="label-text">Name</span>
              <input name="name" class="input input-bordered input-sm w-full" required />
            </label>
            <label class="form-control">
              <span class="label-text">Category</span>
              <select name="categoryId" class="select select-bordered select-sm w-full">
                <option value="">Select...</option>
                {categories.map((cat) => (
                  <option value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
            <label class="form-control">
              <span class="label-text">Unit</span>
              <input name="unit" class="input input-bordered input-sm w-full" defaultValue="pieces" />
            </label>
            <label class="form-control">
              <span class="label-text">Stock</span>
              <input name="currentStock" type="number" step="0.01" class="input input-bordered input-sm w-full" defaultValue="0" />
            </label>
            <label class="form-control">
              <span class="label-text">Min level</span>
              <input name="minStockLevel" type="number" step="0.01" class="input input-bordered input-sm w-full" defaultValue="0" />
            </label>
            <label class="form-control">
              <span class="label-text">Max level</span>
              <input name="maxStockLevel" type="number" step="0.01" class="input input-bordered input-sm w-full" placeholder="Auto-calc reorder" />
            </label>
            <div class="md:col-span-6 flex gap-2">
              <label class="form-control flex-1">
                <span class="label-text">Supplier</span>
                <select name="supplierId" class="select select-bordered select-sm w-full">
                  <option value="">No supplier</option>
                  {suppliers.map((s) => (
                    <option value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label class="form-control w-32">
                <span class="label-text">Reorder qty</span>
                <input name="reorderQuantity" type="number" step="0.01" class="input input-bordered input-sm w-full" placeholder="Auto" />
              </label>
              <div class="flex items-end">
                <button type="submit" class="btn btn-primary btn-sm">Add</button>
              </div>
            </div>
          </form>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick="newStockModal.close()">Cancel</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <div class="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold">Stock Items</h3>
          <div class="tabs tabs-boxed">
            <a class={"tab tab-sm" + (!categoryFilter ? " tab-active" : "")} href="/admin/stock">All</a>
            {categories.map((cat) => (
              <a class={"tab tab-sm" + (categoryFilter === String(cat.id) ? " tab-active" : "")} href={"/admin/stock?category=" + cat.id}>{cat.name}</a>
            ))}
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="newStockModal.showModal()">+ New Stock Item</button>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Max</th>
              <th>Reorder</th>
              <th>Status</th>
              <th>Adjust Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ing) => {
              const isLow = ing.current_stock <= ing.min_stock_level
              const suggestedReorder = ing.max_stock_level
                ? Math.max(0, ing.max_stock_level - ing.current_stock)
                : null
              return (
                <tr class={isLow ? "bg-error/10" : ""}>
                  <td>{ing.name}</td>
                  <td><span class="badge badge-ghost badge-sm">{ing.category_name ?? "—"}</span></td>
                  <td>{ing.unit}</td>
                  <td class="font-mono">{ing.current_stock}</td>
                  <td class="font-mono">{ing.min_stock_level}</td>
                  <td class="font-mono">{ing.max_stock_level ?? "—"}</td>
                  <td class="font-mono">
                    {ing.reorder_quantity ?? (suggestedReorder !== null ? suggestedReorder : "—")}
                    {suggestedReorder !== null && !ing.reorder_quantity && (
                      <span class="text-xs text-base-content/50 ml-1">calc</span>
                    )}
                  </td>
                  <td>
                    {isLow ? (
                      <span class="badge badge-error">Reorder</span>
                    ) : (
                      <span class="badge badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    <form method="post" action={"/admin/stock/ingredient/" + ing.id + "/adjust"} class="flex gap-1 max-w-56">
                      <input name="adjustment" type="number" step="0.01" class="input input-bordered input-sm w-full" placeholder="+/- qty" required />
                      <input name="reason" class="input input-bordered input-sm w-24" placeholder="Reason" />
                      <button type="submit" class="btn btn-sm btn-outline btn-primary">Go</button>
                    </form>
                  </td>
                  <td>
                    <a href={"/admin/stock?edit=" + ing.id + (categoryFilter ? "&category=" + categoryFilter : "")} class="btn btn-sm btn-ghost">Edit</a>
                    <a href={"/admin/stock?movements=" + ing.id} class="btn btn-sm btn-ghost">Log</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {movements && movementIngredient && (
        <dialog id="movementsModal" class="modal modal-open">
          <div class="modal-box max-w-lg">
            <form method="dialog">
              <a href="/admin/stock" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</a>
            </form>
            <h3 class="text-lg font-bold mb-2">Stock Movement Log — {movementIngredient.name}</h3>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Adjustment</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr>
                      <td class="text-xs">{m.created_at}</td>
                      <td class={"font-mono " + (m.adjustment >= 0 ? "text-success" : "text-error")}>
                        {m.adjustment >= 0 ? "+" : ""}{m.adjustment}
                      </td>
                      <td class="font-mono">{m.stock_before}</td>
                      <td class="font-mono">{m.stock_after}</td>
                      <td>{m.reason ?? "—"}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colspan={5} class="text-center text-base-content/60 py-2">No movements recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div class="modal-action">
              <a href="/admin/stock" class="btn btn-sm">Close</a>
            </div>
          </div>
          <a href="/admin/stock" class="modal-backdrop">Close</a>
        </dialog>
      )}
    </AdminLayout>,
  )
}

export async function createIngredientHandler(c: Context) {
  const db = c.env.DB
  const body = await c.req.parseBody()
  await createIngredient(db, {
    name: body.name as string,
    unit: body.unit as string || "pieces",
    currentStock: parseFloat(body.currentStock as string) || 0,
    minStockLevel: parseFloat(body.minStockLevel as string) || 0,
    maxStockLevel: body.maxStockLevel ? parseFloat(body.maxStockLevel as string) : undefined,
    reorderQuantity: body.reorderQuantity ? parseFloat(body.reorderQuantity as string) : undefined,
    categoryId: body.categoryId ? parseInt(body.categoryId as string) : undefined,
    supplierId: body.supplierId ? parseInt(body.supplierId as string) : undefined,
  })
  return c.redirect("/admin/stock?created=1")
}

export async function adjustStockHandler(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const body = await c.req.parseBody()
  const adjustment = parseFloat(body.adjustment as string)
  const reason = body.reason as string || undefined

  if (isNaN(adjustment)) {
    return c.text("Invalid adjustment value", 400)
  }

  try {
    await adjustStock(db, id, adjustment, reason)
    return c.redirect("/admin/stock?adjusted=1")
  } catch (err) {
    return c.text((err as Error).message, 400)
  }
}

export async function updateIngredientHandler(c: Context) {
  const db = c.env.DB
  const id = parseInt(c.req.param("id")!)
  const body = await c.req.parseBody()
  const categoryFilter = c.req.query("category")
  await updateIngredient(db, id, {
    name: body.name as string,
    unit: body.unit as string,
    currentStock: parseFloat(body.currentStock as string),
    minStockLevel: parseFloat(body.minStockLevel as string),
    maxStockLevel: body.maxStockLevel ? parseFloat(body.maxStockLevel as string) : undefined,
    reorderQuantity: body.reorderQuantity ? parseFloat(body.reorderQuantity as string) : undefined,
    unitCost: body.unitCost ? parseFloat(body.unitCost as string) : undefined,
    categoryId: body.categoryId ? parseInt(body.categoryId as string) : undefined,
    supplierId: body.supplierId ? parseInt(body.supplierId as string) : undefined,
  })
  return c.redirect("/admin/stock?updated=1" + (categoryFilter ? "&category=" + categoryFilter : ""))
}

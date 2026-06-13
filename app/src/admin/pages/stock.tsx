import type { Context } from "hono"
import { AdminLayout } from "../layout"
import {
  getIngredientsPaginated,
  getStockCategories,
  getSuppliers,
  createIngredient,
  adjustStock,
  getStockMovements,
  updateIngredient,
} from "../../features/stock/service"
import { Pagination } from "../components/pagination"

export async function stock(c: Context) {
  const db = c.env.DB
  const categories = await getStockCategories(db)
  const suppliers = await getSuppliers(db)

  const categoryFilter = c.req.query("category")
  const page = parseInt(c.req.query("page") || "1")
  const limit = 20

  const { items: ingredients, total } = await getIngredientsPaginated(
    db,
    page,
    limit,
    categoryFilter ? parseInt(categoryFilter) : null,
  )

  const viewMovements = c.req.query("movements")
  const movements = viewMovements
    ? await getStockMovements(db, parseInt(viewMovements))
    : null
  const movementIngredient = viewMovements
    ? ingredients.find((i) => i.id === parseInt(viewMovements))
    : null

  return c.html(
    <AdminLayout title="Stock" currentPath="/admin/stock">
      <h1 class="text-2xl font-bold mb-4">Stock Management</h1>

      {c.req.query("adjusted") && <div class="alert alert-success mb-4">Stock adjusted.</div>}
      {c.req.query("created") && <div class="alert alert-success mb-4">Ingredient created.</div>}
      {c.req.query("updated") && <div class="alert alert-success mb-4">Ingredient updated.</div>}

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

      <h3 class="text-lg font-semibold mb-2">Stock Items</h3>
      <div class="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div class="tabs tabs-boxed">
          <a class={"tab tab-sm" + (!categoryFilter ? " tab-active" : "")} href="/admin/stock">All</a>
          {categories.map((cat) => (
            <a class={"tab tab-sm" + (categoryFilter === String(cat.id) ? " tab-active" : "")} href={"/admin/stock?category=" + cat.id}>{cat.name}</a>
          ))}
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="newStockModal.showModal()">+ New Stock Item</button>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Max</th>
              <th>Reorder</th>
              <th>Status</th>
              <th colspan={2}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              const isLow = ing.current_stock <= ing.min_stock_level
              const suggestedReorder = ing.max_stock_level
                ? Math.max(0, ing.max_stock_level - ing.current_stock)
                : null
              return <>
                <tr class={isLow ? "bg-error/10" : ""}>
                  <td>{ing.name}<br/><span class="text-xs text-base-content/60 max-md:hidden">{ing.category_name ?? "—"}</span></td>
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
                    <div class="flex gap-1">
                      <button type="button" class="btn btn-sm btn-outline btn-primary" onclick={"adjustModal" + ing.id + ".showModal()"} title="Adjust"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg></button>
                      <button type="button" class="btn btn-sm btn-ghost" onclick={"editModal" + ing.id + ".showModal()"} title="Edit"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
                      <a href={"/admin/stock?movements=" + ing.id} class="btn btn-sm btn-ghost" title="Log"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg></a>
                    </div>
                  </td>
                  <td></td>
                </tr>
                <tr class="md:hidden"><td colspan={10} class="text-xs text-base-content/60 pb-1 pt-0">Category: {ing.category_name ?? "—"}</td></tr>
                <tr><td colspan={10} style="padding:0;border:0">
                  <dialog id={"editModal" + ing.id} class="modal">
                    <div class="modal-box max-w-xl">
                      <form method="dialog">
                        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                      </form>
                      <h3 class="text-lg font-bold mb-4">Edit: {ing.name}</h3>
                      <form method="post" action={"/admin/stock/ingredient/" + ing.id + "/update" + (categoryFilter ? "?category=" + categoryFilter : "")} class="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <label class="form-control">
                          <span class="label-text">Name</span>
                          <input name="name" class="input input-bordered input-sm w-full" value={ing.name} required />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Category</span>
                          <select name="categoryId" class="select select-bordered select-sm w-full">
                            <option value="">Uncategorized</option>
                            {categories.map((cat) => (
                              <option value={cat.id} selected={cat.id === ing.category_id}>{cat.name}</option>
                            ))}
                          </select>
                        </label>
                        <label class="form-control">
                          <span class="label-text">Unit</span>
                          <input name="unit" class="input input-bordered input-sm w-full" value={ing.unit} />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Stock</span>
                          <input name="currentStock" type="number" step="0.01" class="input input-bordered input-sm w-full" value={ing.current_stock} />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Min level</span>
                          <input name="minStockLevel" type="number" step="0.01" class="input input-bordered input-sm w-full" value={ing.min_stock_level} />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Max level</span>
                          <input name="maxStockLevel" type="number" step="0.01" class="input input-bordered input-sm w-full" value={ing.max_stock_level ?? ""} />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Reorder qty</span>
                          <input name="reorderQuantity" type="number" step="0.01" class="input input-bordered input-sm w-full" value={ing.reorder_quantity ?? ""} />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Unit cost (R)</span>
                          <input name="unitCost" type="number" step="0.01" class="input input-bordered input-sm w-full" value={ing.unit_cost ?? ""} />
                        </label>
                        <label class="form-control">
                          <span class="label-text">Supplier</span>
                          <select name="supplierId" class="select select-bordered select-sm w-full">
                            <option value="">No supplier</option>
                            {suppliers.map((s) => (
                              <option value={s.id} selected={s.id === ing.supplier_id}>{s.name}</option>
                            ))}
                          </select>
                        </label>
                        <div class="md:col-span-5 flex gap-2 mt-2">
                          <button type="submit" class="btn btn-primary btn-sm">Save</button>
                        </div>
                      </form>
                      <div class="modal-action">
                        <button type="button" class="btn btn-ghost" onclick={"editModal" + ing.id + ".close()"}>Cancel</button>
                      </div>
                    </div>
                    <form method="dialog" class="modal-backdrop">
                      <button>close</button>
                    </form>
                  </dialog>
                </td></tr>
                <tr><td colspan={10} style="padding:0;border:0">
                  <dialog id={"adjustModal" + ing.id} class="modal">
                    <div class="modal-box max-w-sm">
                      <form method="dialog">
                        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                      </form>
                      <h3 class="text-lg font-bold mb-4">Adjust Stock — {ing.name}</h3>
                      <p class="text-sm text-base-content/60 mb-3">Current stock: <strong>{ing.current_stock}</strong> {ing.unit}</p>
                      <form method="post" action={"/admin/stock/ingredient/" + ing.id + "/adjust" + (categoryFilter ? "?category=" + categoryFilter : "")}>
                        <label class="form-control w-full mb-3">
                          <span class="label-text">Adjustment (+/-)</span>
                          <input name="adjustment" type="number" step="0.01" class="input input-bordered w-full" placeholder="e.g. 10 or -5" required />
                        </label>
                        <label class="form-control w-full mb-3">
                          <span class="label-text">Reason</span>
                          <input name="reason" class="input input-bordered w-full" placeholder="e.g. Delivery, spoilage" />
                        </label>
                        <div class="modal-action">
                          <button type="button" class="btn btn-ghost" onclick={"adjustModal" + ing.id + ".close()"}>Cancel</button>
                          <button type="submit" class="btn btn-primary">Apply</button>
                        </div>
                      </form>
                    </div>
                    <form method="dialog" class="modal-backdrop">
                      <button>close</button>
                    </form>
                  </dialog>
                </td></tr>
              </>
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} baseUrl="/admin/stock" additionalParams={categoryFilter ? { category: categoryFilter } : undefined} />

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
              <a href={"/admin/stock" + (categoryFilter ? "?category=" + categoryFilter : "")} class="btn btn-sm">Close</a>
            </div>
          </div>
          <a href={"/admin/stock" + (categoryFilter ? "?category=" + categoryFilter : "")} class="modal-backdrop">Close</a>
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
    const categoryRedirect = c.req.query("category") ? "&category=" + c.req.query("category") : ""
    await adjustStock(db, id, adjustment, reason)
    return c.redirect("/admin/stock?adjusted=1" + categoryRedirect)
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

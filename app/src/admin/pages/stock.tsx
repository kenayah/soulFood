import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getIngredients, getSuppliers, createIngredient, adjustStock } from "../../features/stock/service"

export async function stock(c: Context) {
  const db = c.env.DB
  const ingredients = await getIngredients(db)
  const suppliers = await getSuppliers(db)

  return c.html(
    <AdminLayout title="Stock" currentPath="/admin/stock">
      <h1 class="text-2xl font-bold mb-4">Stock Management</h1>

      {c.req.query("adjusted") && <div class="alert alert-success mb-4">Stock adjusted.</div>}
      {c.req.query("created") && <div class="alert alert-success mb-4">Ingredient created.</div>}

      <div class="card bg-base-100 shadow mb-6 max-w-md">
        <div class="card-body">
          <h5 class="card-title">New Ingredient</h5>
          <form method="post" action="/admin/stock/ingredient">
            <label class="form-control w-full mb-2">
              <span class="label-text">Name</span>
              <input name="name" class="input input-bordered w-full" required />
            </label>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <label class="form-control">
                <span class="label-text">Unit</span>
                <input name="unit" class="input input-bordered w-full" defaultValue="pieces" />
              </label>
              <label class="form-control">
                <span class="label-text">Stock</span>
                <input name="currentStock" type="number" step="0.01" class="input input-bordered w-full" defaultValue="0" />
              </label>
              <label class="form-control">
                <span class="label-text">Min level</span>
                <input name="minStockLevel" type="number" step="0.01" class="input input-bordered w-full" defaultValue="0" />
              </label>
            </div>
            <label class="form-control w-full mb-3">
              <span class="label-text">Supplier</span>
              <select name="supplierId" class="select select-bordered w-full">
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" class="btn btn-primary btn-sm">Add Ingredient</button>
          </form>
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-2">Ingredients</h3>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Status</th>
              <th>Adjust Stock</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              const isLow = ing.current_stock <= ing.min_stock_level
              return (
                <tr class={isLow ? "bg-error/10" : ""}>
                  <td>{ing.name}</td>
                  <td>{ing.unit}</td>
                  <td>{ing.current_stock}</td>
                  <td>{ing.min_stock_level}</td>
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
                      <button type="submit" class="btn btn-sm btn-outline btn-primary">Go</button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
    supplierId: body.supplierId ? parseInt(body.supplierId as string) : undefined,
  })
  return c.redirect("/admin/stock?created=1")
}

export async function adjustStockHandler(c: Context) {
  const id = parseInt(c.req.param("id")!)
  const db = c.env.DB
  const body = await c.req.parseBody()
  const adjustment = parseFloat(body.adjustment as string)

  if (isNaN(adjustment)) {
    return c.text("Invalid adjustment value", 400)
  }

  try {
    await adjustStock(db, id, adjustment)
    return c.redirect("/admin/stock?adjusted=1")
  } catch (err) {
    return c.text((err as Error).message, 400)
  }
}

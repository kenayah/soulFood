import type { Context } from "hono"
import { AdminLayout } from "../layout"
import { getIngredients, getSuppliers, createIngredient, adjustStock } from "../../features/stock/service"

export async function stock(c: Context) {
  const db = c.env.DB
  const ingredients = await getIngredients(db)
  const suppliers = await getSuppliers(db)

  return c.html(
    <AdminLayout title="Stock">
      <h1 class="mb-4">Stock Management</h1>

      {c.req.query("adjusted") && <div class="alert alert-success">Stock adjusted.</div>}
      {c.req.query("created") && <div class="alert alert-success">Ingredient created.</div>}

      <div class="row mb-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">New Ingredient</h5>
              <form method="post" action="/admin/stock/ingredient">
                <div class="mb-2">
                  <input name="name" class="form-control" placeholder="Ingredient name" required />
                </div>
                <div class="row">
                  <div class="col-4 mb-2">
                    <input name="unit" class="form-control" placeholder="Unit" defaultValue="pieces" />
                  </div>
                  <div class="col-4 mb-2">
                    <input name="currentStock" type="number" step="0.01" class="form-control" placeholder="Stock" defaultValue="0" />
                  </div>
                  <div class="col-4 mb-2">
                    <input name="minStockLevel" type="number" step="0.01" class="form-control" placeholder="Min level" defaultValue="0" />
                  </div>
                </div>
                <div class="mb-2">
                  <select name="supplierId" class="form-select">
                    <option value="">No supplier</option>
                    {suppliers.map((s) => (
                      <option value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Add Ingredient</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <h3>Ingredients</h3>
      <table class="table table-striped">
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
              <tr class={isLow ? "table-danger" : ""}>
                <td>{ing.name}</td>
                <td>{ing.unit}</td>
                <td>{ing.current_stock}</td>
                <td>{ing.min_stock_level}</td>
                <td>
                  {isLow ? (
                    <span class="badge bg-danger">Reorder</span>
                  ) : (
                    <span class="badge bg-success">OK</span>
                  )}
                </td>
                <td>
                  <form method="post" action={"/admin/stock/ingredient/" + ing.id + "/adjust"} class="d-flex gap-1" style="max-width:250px">
                    <input name="adjustment" type="number" step="0.01" class="form-control form-control-sm" placeholder="+/- qty" required />
                    <button type="submit" class="btn btn-sm btn-outline-primary">Go</button>
                  </form>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
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

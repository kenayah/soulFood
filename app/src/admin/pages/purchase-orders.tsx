import type { Context } from "hono"
import { AdminLayout } from "../layout"
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  getPurchaseOrderItems,
  getSuppliers,
  getIngredients,
  createPurchaseOrder,
  receivePurchaseOrder,
} from "../../features/stock/service"

export async function purchaseOrders(c: Context) {
  const db = c.env.DB
  const poList = await getPurchaseOrders(db)
  const suppliers = await getSuppliers(db)

  const viewId = c.req.query("view")
  const viewPo = viewId ? await getPurchaseOrderById(db, parseInt(viewId)) : null
  const viewItems = viewId ? await getPurchaseOrderItems(db, parseInt(viewId)) : null
  const viewPoData = viewPo as { id: number; supplier_name: string; status: string; total: number | null; expected_delivery: string | null; received_at: string | null; created_at: string } | null

  return c.html(
    <AdminLayout title="Purchase Orders" currentPath="/admin/purchase-orders">
      <h1 class="text-2xl font-bold mb-4">Purchase Orders</h1>

      {c.req.query("created") && <div class="alert alert-success mb-4">Purchase order created.</div>}
      {c.req.query("received") && <div class="alert alert-success mb-4">Purchase order received — stock updated.</div>}
      {c.req.query("error") && <div class="alert alert-error mb-4">{c.req.query("error")}</div>}

      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold">All Purchase Orders</h3>
        <button type="button" class="btn btn-primary btn-sm" onclick="newPoModal.showModal()">+ New PO</button>
      </div>

      <dialog id="newPoModal" class="modal">
        <div class="modal-box max-w-xl">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 class="text-lg font-bold mb-4">New Purchase Order</h3>
          <form method="post" action="/admin/purchase-orders" id="poForm">
            <label class="form-control w-full mb-3">
              <span class="label-text">Supplier</span>
              <select name="supplierId" class="select select-bordered w-full" required>
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <div id="poItems">
              <div class="font-semibold text-sm mb-2">Items</div>
              <div class="po-item grid grid-cols-3 gap-2 mb-2">
                <select name="ingredientId" class="select select-bordered select-sm" required>
                  <option value="">Ingredient...</option>
                </select>
                <input name="quantityOrdered" type="number" step="0.01" class="input input-bordered input-sm" placeholder="Qty" required />
                <input name="unitPrice" type="number" step="0.01" class="input input-bordered input-sm" placeholder="Unit price" required />
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline btn-secondary mb-3" onclick="addPOItem()">+ Add Item</button>

            <div class="modal-action mt-0">
              <button type="button" class="btn btn-ghost" onclick="newPoModal.close()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create PO</button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <script>
        {`
function addPOItem() {
  const container = document.getElementById('poItems')
  const div = document.createElement('div')
  div.className = 'po-item grid grid-cols-4 gap-2 mb-2 items-end'
  div.innerHTML = \`
    <select name="ingredientId" class="select select-bordered select-sm" required>
      <option value="">Ingredient...</option>
    </select>
    <input name="quantityOrdered" type="number" step="0.01" class="input input-bordered input-sm" placeholder="Qty" required />
    <input name="unitPrice" type="number" step="0.01" class="input input-bordered input-sm" placeholder="Unit price" required />
    <button type="button" class="btn btn-sm btn-ghost text-error" onclick="this.parentElement.remove()">Remove</button>
  \`
  container.appendChild(div)
}
        `}
      </script>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>#</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Total</th>
              <th>Expected</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(poList as { id: number; supplier_name: string; status: string; total: number | null; expected_delivery: string | null; received_at: string | null; created_at: string }[]).map((po) => (
              <tr>
                <td class="font-mono">#{po.id}</td>
                <td>{po.supplier_name}</td>
                <td>
                  {po.status === "received" ? (
                    <span class="badge badge-success text-white">Received</span>
                  ) : po.status === "draft" ? (
                    <span class="badge badge-ghost">Draft</span>
                  ) : po.status === "sent" ? (
                    <span class="badge badge-info text-white">Sent</span>
                  ) : (
                    <span class="badge badge-ghost">{po.status}</span>
                  )}
                </td>
                <td class="font-mono">{po.total != null ? "R" + po.total.toFixed(2) : "—"}</td>
                <td>{po.expected_delivery ?? "—"}</td>
                <td>{po.received_at ?? "—"}</td>
                <td>
                  <a href={"/admin/purchase-orders?view=" + po.id} class="btn btn-sm btn-ghost">View</a>
                  {po.status !== "received" && (
                    <form method="post" action={"/admin/purchase-orders/" + po.id + "/receive"} class="inline" onsubmit="return confirm('Receive this purchase order? This will update stock levels.')">
                      <button type="submit" class="btn btn-sm btn-outline btn-success">Receive</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(poList as unknown[]).length === 0 && (
              <tr>
                <td colspan={7} class="text-center text-base-content/60 py-4">No purchase orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewPoData && viewItems && (
        <dialog id="viewPoModal" class="modal modal-open">
          <div class="modal-box max-w-lg">
            <form method="dialog">
              <a href="/admin/purchase-orders" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</a>
            </form>
            <h3 class="text-lg font-bold mb-2">Purchase Order #{viewPoData.id}</h3>
            <div class="grid grid-cols-2 gap-2 text-sm mb-3">
              <div><span class="font-semibold">Supplier:</span> {viewPoData.supplier_name}</div>
              <div><span class="font-semibold">Status:</span> {viewPoData.status}</div>
              <div><span class="font-semibold">Created:</span> {viewPoData.created_at}</div>
              <div><span class="font-semibold">Received:</span> {viewPoData.received_at ?? "—"}</div>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItems.map((item) => (
                    <tr>
                      <td>{item.ingredient_name}</td>
                      <td class="font-mono">{item.quantity_ordered}</td>
                      <td class="font-mono">{item.quantity_received}</td>
                      <td class="font-mono">R{item.unit_price.toFixed(2)}</td>
                      <td class="font-mono">R{(item.quantity_ordered * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr class="font-semibold">
                    <td colspan={4}>Total</td>
                    <td class="font-mono">R{viewItems.reduce((s, i) => s + i.quantity_ordered * i.unit_price, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="modal-action">
              <a href="/admin/purchase-orders" class="btn btn-sm">Close</a>
            </div>
          </div>
          <a href="/admin/purchase-orders" class="modal-backdrop">Close</a>
        </dialog>
      )}
    </AdminLayout>,
  )
}

export async function createPurchaseOrderHandler(c: Context) {
  const db = c.env.DB
  const body = await c.req.parseBody()

  const supplierId = parseInt(body.supplierId as string)
  if (!supplierId) return c.redirect("/admin/purchase-orders?error=Select+a+supplier")

  const ingredientIds = Array.isArray(body.ingredientId) ? body.ingredientId : [body.ingredientId]
  const quantities = Array.isArray(body.quantityOrdered) ? body.quantityOrdered : [body.quantityOrdered]
  const prices = Array.isArray(body.unitPrice) ? body.unitPrice : [body.unitPrice]

  const items = ingredientIds
    .map((_: unknown, i: number) => ({
      ingredientId: parseInt(ingredientIds[i] as string),
      quantityOrdered: parseFloat(quantities[i] as string),
      unitPrice: parseFloat(prices[i] as string),
    }))
    .filter((item) => item.ingredientId && !isNaN(item.quantityOrdered) && !isNaN(item.unitPrice))

  if (items.length === 0) return c.redirect("/admin/purchase-orders?error=Add+at+least+one+item")

  try {
    await createPurchaseOrder(db, { supplierId, items })
    return c.redirect("/admin/purchase-orders?created=1")
  } catch {
    return c.redirect("/admin/purchase-orders?error=Failed+to+create+purchase+order")
  }
}

export async function receivePurchaseOrderHandler(c: Context) {
  const db = c.env.DB
  const id = parseInt(c.req.param("id")!)
  try {
    await receivePurchaseOrder(db, id)
    return c.redirect("/admin/purchase-orders?received=1")
  } catch (err) {
    return c.redirect("/admin/purchase-orders?error=" + encodeURIComponent((err as Error).message))
  }
}

import type { D1Database } from "@cloudflare/workers-types"
import { getDb, queryAll, queryOne, execute } from "../../lib/d1"

export interface OrderItemRow {
  id: number
  order_id: number
  menu_item_id: number
  item_name: string
  quantity: number
  unit_price: number
}

export interface OrderRow {
  id: number
  customer_name: string
  phone: string
  delivery_address: string | null
  notes: string | null
  status: string
  total: number
  payment_status: string
  payment_method: string
  created_at: string
  updated_at: string
}

export interface CustomerRow {
  id: number
  name: string
  phone: string
  delivery_address: string | null
  notes: string | null
  total_orders: number
  last_order_at: string
  created_at: string
  updated_at: string
}

export async function upsertCustomer(
  db: D1Database,
  data: { name: string; phone: string; deliveryAddress?: string; notes?: string }
): Promise<number> {
  const existing = await queryOne<{ id: number }>(
    db,
    "SELECT id FROM customers WHERE phone = ?",
    data.phone,
  )

  if (existing) {
    await execute(
      db,
      `UPDATE customers SET name = ?, delivery_address = COALESCE(?, delivery_address),
       notes = COALESCE(?, notes), total_orders = total_orders + 1,
       last_order_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      data.name,
      data.deliveryAddress ?? null,
      data.notes ?? null,
      existing.id,
    )
    return existing.id
  }

  const customer = await queryOne<{ id: number }>(
    db,
    `INSERT INTO customers (name, phone, delivery_address, notes) VALUES (?, ?, ?, ?) RETURNING id`,
    data.name,
    data.phone,
    data.deliveryAddress ?? null,
    data.notes ?? null,
  )
  return customer!.id
}

export async function createOrder(
  db: D1Database,
  data: {
    customerName: string
    phone: string
    deliveryAddress?: string
    notes?: string
    paymentMethod: string
    customerId?: number
    items: { menuItemId: number; quantity: number; itemName: string; unitPrice: number }[]
  }
): Promise<OrderRow> {
  const total = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  const order = await queryOne<OrderRow>(
    db,
    `INSERT INTO orders (customer_name, phone, delivery_address, notes, total, payment_method, customer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    data.customerName,
    data.phone,
    data.deliveryAddress ?? null,
    data.notes ?? null,
    total,
    data.paymentMethod,
    data.customerId ?? null,
  )

  if (!order) throw new Error("Failed to create order")

  for (const item of data.items) {
    await execute(
      db,
      `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price)
       VALUES (?, ?, ?, ?, ?)`,
      order.id,
      item.menuItemId,
      item.itemName,
      item.quantity,
      item.unitPrice,
    )
  }

  await logStatusChange(db, order.id, null, "placed", "system")

  return order
}

export async function getOrders(
  db: D1Database,
  filters?: { status?: string; page?: number; limit?: number }
): Promise<{ orders: OrderRow[]; total: number }> {
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const offset = (page - 1) * limit

  let whereClause = ""
  const params: unknown[] = []

  if (filters?.status) {
    whereClause = "WHERE status = ?"
    params.push(filters.status)
  }

  const totalResult = await queryOne<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM orders ${whereClause}`,
    ...params,
  )
  const total = totalResult?.count ?? 0

  const orders = await queryAll<OrderRow>(
    db,
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  )

  return { orders, total }
}

export async function getOrderById(db: D1Database, id: number): Promise<OrderRow | null> {
  return queryOne<OrderRow>(db, "SELECT * FROM orders WHERE id = ?", id)
}

export async function getOrderItems(db: D1Database, orderId: number): Promise<OrderItemRow[]> {
  return queryAll<OrderItemRow>(
    db,
    "SELECT * FROM order_items WHERE order_id = ? ORDER BY id",
    orderId,
  )
}

export async function updateOrderStatus(
  db: D1Database,
  orderId: number,
  newStatus: string,
  changedBy: string = "operator",
): Promise<OrderRow | null> {
  const order = await getOrderById(db, orderId)
  if (!order) return null

  await execute(
    db,
    "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
    newStatus,
    orderId,
  )

  await logStatusChange(db, orderId, order.status, newStatus, changedBy)
  await createNotification(db, `order_${newStatus}`, orderId, `Order #${orderId} status: ${newStatus}`)

  return getOrderById(db, orderId)
}

export async function cancelOrder(
  db: D1Database,
  orderId: number,
  changedBy: string = "operator",
): Promise<OrderRow | null> {
  return updateOrderStatus(db, orderId, "cancelled", changedBy)
}

async function logStatusChange(
  db: D1Database,
  orderId: number,
  fromStatus: string | null,
  toStatus: string,
  changedBy: string,
): Promise<void> {
  await execute(
    db,
    `INSERT INTO order_status_log (order_id, from_status, to_status, changed_by)
     VALUES (?, ?, ?, ?)`,
    orderId,
    fromStatus,
    toStatus,
    changedBy,
  )
}

async function createNotification(
  db: D1Database,
  type: string,
  orderId: number,
  message: string,
): Promise<void> {
  await execute(
    db,
    "INSERT INTO notifications (type, order_id, message) VALUES (?, ?, ?)",
    type,
    orderId,
    message,
  )
}

export async function getOrderStatusLog(
  db: D1Database,
  orderId: number,
): Promise<{ id: number; from_status: string | null; to_status: string; changed_by: string; created_at: string }[]> {
  return queryAll(
    db,
    "SELECT * FROM order_status_log WHERE order_id = ? ORDER BY created_at",
    orderId,
  )
}

export async function getCustomers(
  db: D1Database,
  page: number = 1,
  limit: number = 20,
): Promise<{ customers: CustomerRow[]; total: number }> {
  const offset = (page - 1) * limit
  const totalResult = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM customers",
  )
  const total = totalResult?.count ?? 0

  const customers = await queryAll<CustomerRow>(
    db,
    "SELECT * FROM customers ORDER BY last_order_at DESC NULLS LAST LIMIT ? OFFSET ?",
    limit,
    offset,
  )
  return { customers, total }
}

export async function getCustomerById(db: D1Database, id: number): Promise<CustomerRow | null> {
  return queryOne<CustomerRow>(db, "SELECT * FROM customers WHERE id = ?", id)
}

export async function getOrdersByCustomer(
  db: D1Database,
  customerId: number,
  limit: number = 20,
): Promise<OrderRow[]> {
  return queryAll<OrderRow>(
    db,
    "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT ?",
    customerId,
    limit,
  )
}

export async function updateCustomer(
  db: D1Database,
  id: number,
  data: { name?: string; phone?: string; deliveryAddress?: string; notes?: string },
): Promise<CustomerRow | null> {
  const sets: string[] = []
  const params: unknown[] = []

  if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name) }
  if (data.phone !== undefined) { sets.push("phone = ?"); params.push(data.phone) }
  if (data.deliveryAddress !== undefined) { sets.push("delivery_address = ?"); params.push(data.deliveryAddress) }
  if (data.notes !== undefined) { sets.push("notes = ?"); params.push(data.notes) }

  if (sets.length === 0) return getCustomerById(db, id)

  sets.push("updated_at = datetime('now')")
  params.push(id)
  await execute(db, `UPDATE customers SET ${sets.join(", ")} WHERE id = ?`, ...params)
  return getCustomerById(db, id)
}

export async function getDashboardStats(db: D1Database, page = 1, limit = 10): Promise<{
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  preparingOrders: number
  recentOrders: OrderRow[]
  recentTotal: number
}> {
  const today = await queryOne<{ orders: number; revenue: number }>(
    db,
    `SELECT COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
     FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'`,
  )

  const pending = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM orders WHERE status = 'placed'",
  )

  const preparing = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM orders WHERE status IN ('confirmed', 'preparing')",
  )

  const totalCount = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM orders",
  )

  const offset = (page - 1) * limit
  const recent = await queryAll<OrderRow>(
    db,
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    limit, offset,
  )

  return {
    todayOrders: today?.orders ?? 0,
    todayRevenue: today?.revenue ?? 0,
    pendingOrders: pending?.count ?? 0,
    preparingOrders: preparing?.count ?? 0,
    recentOrders: recent,
    recentTotal: totalCount?.count ?? 0,
  }
}

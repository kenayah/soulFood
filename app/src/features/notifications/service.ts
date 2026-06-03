import type { D1Database } from "@cloudflare/workers-types"
import { queryAll, execute } from "../../lib/d1"

export interface NotificationRow {
  id: number
  type: string
  order_id: number
  message: string
  acknowledged: boolean
  created_at: string
}

export async function getNotifications(
  db: D1Database,
  since?: number,
): Promise<NotificationRow[]> {
  if (since) {
    return queryAll<NotificationRow>(
      db,
      "SELECT * FROM notifications WHERE id > ? ORDER BY id",
      since,
    )
  }
  return queryAll<NotificationRow>(
    db,
    "SELECT * FROM notifications WHERE acknowledged = 0 ORDER BY id",
  )
}

export async function acknowledgeNotifications(
  db: D1Database,
  ids: number[],
): Promise<void> {
  if (ids.length === 0) return
  const placeholders = ids.map(() => "?").join(",")
  await execute(
    db,
    `UPDATE notifications SET acknowledged = 1 WHERE id IN (${placeholders})`,
    ...ids,
  )
}

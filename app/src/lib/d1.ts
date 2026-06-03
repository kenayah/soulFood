import type { D1Database } from "@cloudflare/workers-types"

export function getDb(env: { DB: D1Database }): D1Database {
  return env.DB
}

export async function queryAll<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T[]> {
  const stmt = db.prepare(sql)
  const result = params.length > 0 ? await stmt.bind(...params).all<T>() : await stmt.all<T>()
  return result.results ?? []
}

export async function queryOne<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.first<T>()
  return result ?? null
}

export async function execute(db: D1Database, sql: string, ...params: unknown[]): Promise<D1Result> {
  const stmt = db.prepare(sql)
  return params.length > 0 ? await stmt.bind(...params).run() : await stmt.run()
}

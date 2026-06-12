import type { D1Database } from "@cloudflare/workers-types"

const STATEMENTS: string[] = [
  "CREATE TABLE IF NOT EXISTS menu_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, available BOOLEAN NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, category_id INTEGER REFERENCES menu_categories(id), image TEXT, prep_time_minutes INTEGER, available BOOLEAN NOT NULL DEFAULT 1, ingredients_list TEXT, stock_keep_unit INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS menu_specials (id INTEGER PRIMARY KEY AUTOINCREMENT, menu_item_id INTEGER NOT NULL REFERENCES menu_items(id), day_of_week TEXT NOT NULL, special_price REAL NOT NULL, active BOOLEAN NOT NULL DEFAULT 1)",
  "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, phone TEXT NOT NULL, delivery_address TEXT, notes TEXT, status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')), total REAL NOT NULL DEFAULT 0, payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','verified','captured','refunded','failed')), payment_method TEXT NOT NULL DEFAULT 'cash', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id), menu_item_id INTEGER REFERENCES menu_items(id), item_name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL NOT NULL)",
  "CREATE TABLE IF NOT EXISTS order_status_log (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id), from_status TEXT, to_status TEXT NOT NULL, changed_by TEXT NOT NULL DEFAULT 'system', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id), provider TEXT NOT NULL, provider_tx_id TEXT, amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','refunded')), currency TEXT NOT NULL DEFAULT 'ZAR', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'pieces', current_stock REAL NOT NULL DEFAULT 0, min_stock_level REAL NOT NULL DEFAULT 0, max_stock_level REAL, reorder_quantity REAL, unit_cost REAL, supplier_id INTEGER REFERENCES suppliers(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact_person TEXT, phone TEXT, email TEXT, lead_time_days INTEGER DEFAULT 1, active BOOLEAN NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS purchase_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER NOT NULL REFERENCES suppliers(id), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','received','cancelled')), total REAL, expected_delivery TEXT, received_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS purchase_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id), ingredient_id INTEGER NOT NULL REFERENCES ingredients(id), quantity_ordered REAL NOT NULL, quantity_received REAL DEFAULT 0, unit_price REAL NOT NULL)",
  "CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, order_id INTEGER NOT NULL, message TEXT, acknowledged INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
  "CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)",
  "CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id)",
  "CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock)",
  "CREATE INDEX IF NOT EXISTS idx_order_status_log_order ON order_status_log(order_id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_ack ON notifications(acknowledged)",
  "CREATE TABLE IF NOT EXISTS stock_movement_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ingredient_id INTEGER NOT NULL REFERENCES ingredients(id), adjustment REAL NOT NULL, stock_before REAL NOT NULL, stock_after REAL NOT NULL, reason TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_stock_movement_ingredient ON stock_movement_log(ingredient_id)",
  "CREATE TABLE IF NOT EXISTS stock_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, sort_order INTEGER NOT NULL DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category_id)",
]

let migrationRan = false
let starchColMigrated = false
let customersMigrated = false
let stockCategoriesMigrated = false

async function ensureStarchColumn(db: D1Database): Promise<void> {
  if (starchColMigrated) return
  starchColMigrated = true
  try {
    await db.prepare("ALTER TABLE menu_items ADD COLUMN starch TEXT").run()
    console.log("Added starch column to menu_items")
  } catch {
    // Column already exists — ignore
  }
}

async function ensureCustomersTable(db: D1Database): Promise<void> {
  if (customersMigrated) return
  customersMigrated = true
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      delivery_address TEXT,
      notes TEXT,
      total_orders INTEGER NOT NULL DEFAULT 1,
      last_order_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
    await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)").run()
    await db.prepare("ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id)").run()
    await db.prepare("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)").run()
    console.log("Added customers table and order reference")
  } catch {
    // Table/column already exists — ignore
  }
}

async function ensureStockCategories(db: D1Database): Promise<void> {
  if (stockCategoriesMigrated) return
  stockCategoriesMigrated = true
  try {
    await db.prepare("ALTER TABLE ingredients ADD COLUMN category_id INTEGER REFERENCES stock_categories(id)").run()
    console.log("Added category_id to ingredients")
  } catch {
    // Column already exists — ignore
  }

  const existing = await db.prepare("SELECT COUNT(*) as count FROM stock_categories").first<{ count: number }>()
  if (!existing || existing.count === 0) {
    const categories = [
      { name: "Ingredients", description: "Food items, raw materials, cooking components", sort: 1 },
      { name: "Utensils", description: "Cutlery, cooking tools, knives, reusable kitchen tools", sort: 2 },
      { name: "Disposables", description: "Containers, plates, cups, serviettes, packaging, single-use items", sort: 3 },
      { name: "Hygiene", description: "Wipes, cleaning supplies, sanitizers, hand soap", sort: 4 },
      { name: "Utilities", description: "Gas, electricity, water — operational utilities", sort: 5 },
    ]
    for (const cat of categories) {
      await db.prepare(
        "INSERT INTO stock_categories (name, description, sort_order) VALUES (?, ?, ?)",
      ).bind(cat.name, cat.description, cat.sort).run()
    }
    console.log("Seeded stock categories")
  }
}

export async function initDb(db: D1Database): Promise<boolean> {
  if (migrationRan) return true
  migrationRan = true
  try {
    for (const stmt of STATEMENTS) {
      await db.prepare(stmt).run()
    }
    await ensureStarchColumn(db)
    await ensureCustomersTable(db)
    await ensureStockCategories(db)
    console.log("Database migration applied successfully")
    return true
  } catch (err) {
    console.error("Failed to apply database migration:", err)
    return false
  }
}

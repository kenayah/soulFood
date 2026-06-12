CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    delivery_address TEXT,
    notes TEXT,
    total_orders INTEGER NOT NULL DEFAULT 1,
    last_order_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

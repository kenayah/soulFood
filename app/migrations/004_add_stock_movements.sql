CREATE TABLE IF NOT EXISTS stock_movement_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
    adjustment REAL NOT NULL,
    stock_before REAL NOT NULL,
    stock_after REAL NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_movement_ingredient ON stock_movement_log(ingredient_id);

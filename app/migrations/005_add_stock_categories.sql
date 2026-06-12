CREATE TABLE IF NOT EXISTS stock_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE ingredients ADD COLUMN category_id INTEGER REFERENCES stock_categories(id);

CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category_id);

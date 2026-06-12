-- Seed: Menu Categories & Items
-- Usage:
--   npm run seed:local          (dev DB: soulfood-dev)
--   npm run seed:local:default  (default DB: soulfood)

INSERT OR REPLACE INTO menu_categories (id, name, sort_order) VALUES (1, 'Main Course', 1);
INSERT OR REPLACE INTO menu_categories (id, name, sort_order) VALUES (2, 'Side Dish', 2);
INSERT OR REPLACE INTO menu_categories (id, name, sort_order) VALUES (3, 'Hot Beverages', 3);
INSERT OR REPLACE INTO menu_categories (id, name, sort_order) VALUES (4, 'Drinks', 4);
INSERT OR REPLACE INTO menu_categories (id, name, sort_order) VALUES (5, 'Dessert', 5);

INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (1, 'Mogodu Wednesday', 'Deliciously slow cooked tripe served with Butternut & Creamy Spinach.', 90.00, 1, 30, 'Creamy Samp or Steamed Bread');
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (2, 'Umleqwa Friday', 'Tender Hardbody Chicken, served with Chakalaka & Spicy Spinach.', 100.00, 1, 35, 'Samp & Beans or Steamed Bread');
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (3, 'Sunday Kos Meal', 'Fried Savoury Rice, Beef Stew, Creamy Spinach, Roasted Butternut with Feta & Chakalaka.', 120.00, 1, 25, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (4, 'Sunday Kos 7 Colors Meal', 'Fried Savoury Rice, Beef Stew, Potato Salad, Chakalaka, Roasted Butternut with Feta, Creamy Spinach & Beetroot.', 150.00, 1, 30, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (5, 'Ama Zulu Beef Stew', 'Slowly Cooked Beef from Ma Gogo''s Pot', 145.00, 1, 40, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (6, 'Cow''s Head', 'Big Fat Cow''s Head Cooked Ama Zulu Style', 0.00, 1, 45, NULL);

INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (7, 'Anatie''s Umphokoqo', 'Anatie''s take on granulated, steamed maize with amasi (sour milk) — just like Grandma used to make.', 65.00, 2, 15, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (8, 'Steamed Bread', 'The Taste of a Long Lasting Tradition Carefully Passed Through Generation', 32.00, 2, 20, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (9, 'Creamy Samp', 'Creamy, buttery maize meal — the ultimate soul food side.', 26.00, 2, 20, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (10, 'Samp & Beans', 'Traditional samp and sugar beans, slow-cooked to perfection.', 26.00, 2, 25, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (11, 'Fried Savoury Rice', 'Flavourful fried rice with aromatic spices.', 26.00, 2, 15, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (12, 'Plain Rice', 'Simple steamed white rice.', 26.00, 2, 15, NULL);

INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (13, 'Umqombothi', 'Traditional African beer from maize, sorghum, yeast, water', 26.00, 4, 2, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (14, 'Rooibos Tea', 'Caffeine-free red bush tea from Cederberg Mountains, drunk black with honey or lemon', 16.00, 3, 5, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (15, 'Kloof Coffee', 'Freshly brewed locally roasted coffee, served black or with milk', 21.00, 3, 5, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (16, 'Rock Shandy', 'Lemonade, soda water, Angostura bitters and lemon slice, with ice', 26.00, 4, 3, NULL);
INSERT OR REPLACE INTO menu_items (id, name, description, price, category_id, prep_time_minutes, starch) VALUES (17, 'Spring Water', 'Pure natural spring water, still or sparkling', 16.00, 4, 1, NULL);

-- Reset SQLite auto-increment to match explicit IDs
DELETE FROM sqlite_sequence WHERE name = 'menu_categories';
DELETE FROM sqlite_sequence WHERE name = 'menu_items';
INSERT OR IGNORE INTO sqlite_sequence (name, seq) VALUES ('menu_categories', 5);
INSERT OR IGNORE INTO sqlite_sequence (name, seq) VALUES ('menu_items', 17);

# SoulFood — Session Log

## Project

Online takeaway management system for a South African comfort food business.

- **Stack:** Hono + Cloudflare Workers + D1 (SQLite) for backend/admin, Hugo static site for public storefront
- **Deploy:** GitHub Actions → Cloudflare Workers (API) + GitHub Pages (Hugo site)
- **Branch:** `dev` (development), `main` (production)
- **Repo:** github.com/kenayah/soulFood

## Last Session Notes

**Date:** June 10, 2026
**Branch:** `dev`

Completed:
- Seeded local D1 database with 5 categories (Main Course, Side Dish, Dessert, Hot Beverages, Drinks) and 17 menu items matching the Hugo frontend menu
- Created `app/seed.sql` for reproducible seeding
- Added `npm run seed:local` and `npm run seed:local:default` scripts
- Connected cart Place Order to backend API (`POST /api/orders`):
  - Checkout form with name, phone, address, notes fields slides into cart drawer
  - Submits order to API then opens WhatsApp with confirmation + order #
  - Clears cart on success, shows inline error on failure
- Added numeric `id` field to each `pricing_item` in `site/data/homepage.yml` (matching DB seed IDs)
- Updated `food-menu.html` to use `.id` for `data-id` attribute
- Fixed prices in DB seed (Kloof Coffee R21, Rock Shandy R26) to match YAML
- Added `site/hugo.toml` param `apiBaseURL` and JS global `SOULFOOD_API`
- Updated seed to use `INSERT OR REPLACE` to handle re-seeds
- Menu now fetched dynamically from `GET /api/public/menu` (JS fetch + render in `menu.js`)
- Added `starch` column to `menu_items` table (migration 002)
- Created public API endpoint at `/api/public/menu` returning categories with items
- Replaced static Hugo-rendered menu with JS-driven dynamic container
- Added `image` and `starch` fields to admin menu item create/edit forms + API routes + validators + service layer
- Updated docs/ (schema, API reference, getting-started, features)
- Starch choice now prompted client-side at add-to-cart: items with "or" in their starch field (e.g. "Creamy Samp or Steamed Bread") show a picker modal -> chosen starch saved per cart item -> displayed in cart -> included in order payload & WhatsApp message. Cart item identity keyed on `id::starch` so same item with different starch choices are separate line items.
- Created `customers` table with unique index on phone (migration 003 + init-db.ts)
- Added `customer_id` column to `orders` table referencing `customers(id)`
- Order API now upserts customer by phone on every order (creates or updates name/address/notes, increments `total_orders`, updates `last_order_at`)
- Frontend saves name/phone/address/notes to `localStorage` (`soulfood_checkout`) after successful order; pre-fills checkout form on next visit

Priorities:
- Before deployment: update `apiBaseURL` in `site/hugo.toml` to production Workers URL

Priorities:
- Hugo site deprecation warnings (`.Site.LanguageCode`, `.Site.Data`) — already fixed in templates
- Before deployment: update `apiBaseURL` in `site/hugo.toml` to production Workers URL

## Useful Commands

```sh
# API (app/)
cd app && npm run dev          # Start Wrangler dev server
cd app && npm run deploy       # Deploy to Cloudflare Workers

# Hugo site (site/)
cd site && npm run dev         # Hugo server with live reload
cd site && npm run build       # Build static site

# PDF generation
node scripts/generate-pdf.mjs
node scripts/generate-leaflet.mjs
```

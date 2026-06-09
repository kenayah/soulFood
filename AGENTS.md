# SoulFood — Session Log

## Project

Online takeaway management system for a South African comfort food business.

- **Stack:** Hono + Cloudflare Workers + D1 (SQLite) for backend/admin, Hugo static site for public storefront
- **Deploy:** GitHub Actions → Cloudflare Workers (API) + GitHub Pages (Hugo site)
- **Branch:** `dev` (development), `main` (production)
- **Repo:** github.com/kenayah/soulFood

## Last Session Notes

**Date:** June 9, 2026
**Branch:** `dev`

Completed:
- Gallery slider converted to card layout with captions and descriptions
- Updated `site/data/homepage.yml` — images changed from string list to objects with `image`, `caption`, `description`
- Updated `site/layouts/partials/gallery.html` → `site/themes/restaurant-hugo/layouts/partials/gallery.html` — wrapped each slide in `.slide-item` with `.slide-caption`
- Added card CSS (`slide-item`, `.slide-caption` styles) to `site/static/css/main.css`
- Fixed blog: homepage was showing 0 posts because `site.Params.main_sections` was undefined; changed filter to `where site.RegularPages "Type" "post"`
- Fixed blog listing page pagination scoped to posts only (was paginating all regular pages)
- Fixed 4 broken blog post image paths (wrong filenames/extensions: .png→.jpg, missing blog-img-1.jpg→blog-img-2.jpg)
- Made `.Params.author` conditional in single page template to avoid empty markup
- Added cart drawer (slide-in from right) with:
  - `site/static/js/cart.js` — localStorage cart with add/remove/qty/total, WhatsApp order via `wa.me`
  - `site/layouts/partials/cart-drawer.html` — drawer UI with empty state, item list, total, Place Order
  - `site/layouts/partials/food-menu.html` — override with "Add to Cart" buttons on each priced item
  - `site/layouts/_default/baseof.html` — override to include drawer + cart.js on all pages
  - Cart icon with count badge in navbar (`site/layouts/partials/header.html`)
  - Cart CSS (drawer, items, buttons, badge) appended to `site/static/css/main.css`
- Split "Starch Options as Extra" into individual clickable items (Creamy Samp, Samp & Beans, Fried Savoury Rice, Plain Rice — each R 26.00)
- Add to Cart button hidden on items without numeric prices (e.g. "Market Price")
- Menu organized by category: Main Course (first 6 items), Side Dish (remaining 6)
  - Category headings render as `<h3>` subheadings
  - Categories with no items (Dessert) are skipped — ready for later addition
- Added Drinks category with 3 non-alcoholic items: Umqombothi, Rooibos Tea, Rock Shandy (no price yet)

Priorities:
- Hugo site still has deprecation warnings: `.Site.LanguageCode` → `Site.Language.Locale`, `.Site.Data` → `hugo.Data`
- See `.opencode/notes.md` for specific file-level TODOs

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

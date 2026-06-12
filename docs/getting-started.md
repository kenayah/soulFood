# Getting Started

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Hugo](https://gohugo.io/installation/) | >= 0.147.2 | Static site generator |
| [Node.js](https://nodejs.org/) | >= 20 | Hono app runtime |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | >= 3 | Cloudflare Workers CLI |
| [Git](https://git-scm.com/) | any | Version control |

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/kenayah/soulFood.git
cd soulFood
```

### 2. Run the Hugo site

```bash
cd site
hugo server -D
```

Opens at `http://localhost:1313`. The site is the public storefront — menu, about, blog, contact.

### 3. Run the Hono API

```bash
cd app
npm install
npm run dev
```

Opens at `http://localhost:8787`. The API serves both REST endpoints and the admin dashboard.

### 4. Create and seed the D1 database

```bash
cd app

# Default database (used by `npm run dev`)
wrangler d1 create soulfood
wrangler d1 execute soulfood --local --file=migrations/001_create_tables.sql
wrangler d1 execute soulfood --local --file=migrations/002_add_starch.sql
wrangler d1 execute soulfood --local --file=migrations/003_add_customers.sql
npm run seed:local:default

# Dev environment database (used by `npm run dev -e dev`)
wrangler d1 create soulfood-dev -e dev
wrangler d1 execute soulfood-dev -e dev --local --file=migrations/001_create_tables.sql
wrangler d1 execute soulfood-dev -e dev --local --file=migrations/002_add_starch.sql
wrangler d1 execute soulfood-dev -e dev --local --file=migrations/003_add_customers.sql
npm run seed:local
```

Copy the database IDs into `wrangler.toml`.

> Migrations are also applied automatically at Worker startup by `init-db.ts` (idempotent — uses `IF NOT EXISTS` / try-catch). Manual execution is only needed for initial setup or production deploys.

### 5. Run everything together

The menu is fetched dynamically from the API — both servers must be running.

```bash
# Terminal 1 — Hono API (must run first, menu depends on it)
cd app && npm run dev

# Terminal 2 — Hugo site
cd site && hugo server
```

## Project Scripts

| Command | Location | Description |
|---|---|---|
| `npm run dev` | `app/` | Start Hono dev server |
| `npm run deploy` | `app/` | Deploy Hono to Cloudflare Workers |
| `npm run seed:local` | `app/` | Seed dev DB (`soulfood-dev`) with categories + menu items |
| `npm run seed:local:default` | `app/` | Seed default DB (`soulfood`) |
| `hugo server` | `site/` | Start Hugo dev server |
| `hugo` | `site/` | Build Hugo site to `public/` |
| `wrangler d1 execute` | `app/` | Run migrations against D1 |

## Deployment

### Hugo to GitHub Pages

Push to `main`. GitHub Actions workflow (`.github/workflows/gh-pages.yml`) builds and deploys the site.

### Hono to Cloudflare Workers

```bash
cd app
npm run deploy
```

Or push to `main` — the CI workflow (`.github/workflows/deploy-worker.yml`) handles it.

---

*Last updated: June 2026*

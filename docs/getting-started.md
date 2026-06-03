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

### 4. Create the D1 database

```bash
cd app
wrangler d1 create soulfood-dev
wrangler d1 execute soulfood-dev --file=migrations/001_create_tables.sql
```

Copy the database ID into `wrangler.toml`.

### 5. Run everything together

```bash
# Terminal 1 — Hugo site
cd site && hugo server

# Terminal 2 — Hono API + admin
cd app && npm run dev
```

## Project Scripts

| Command | Location | Description |
|---|---|---|
| `npm run dev` | `app/` | Start Hono dev server |
| `npm run deploy` | `app/` | Deploy Hono to Cloudflare Workers |
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

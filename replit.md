# Grill Me — FIFA Jersey Store

A full-stack FIFA jersey e-commerce store built entirely on the **Cloudflare free-tier native stack**. Features a jersey catalog, cart, OTP-verified checkout, Stripe payment intent, and an admin dashboard.

## Deployment targets

| Layer | Platform | Notes |
|-------|----------|-------|
| Frontend | Cloudflare Pages | Static SPA build via Vite |
| API | Cloudflare Workers | Hono framework, deployed with `wrangler deploy` |
| Database | Cloudflare D1 | SQLite-based, free tier |

## Run locally

```bash
# Install dependencies
pnpm install

# Seed local D1 state (first time only)
pnpm --filter @workspace/api-server exec wrangler d1 execute fifa-jersey-shop --file=../../db/schema.sql --local
pnpm --filter @workspace/api-server exec wrangler d1 execute fifa-jersey-shop --file=../../db/seed.sql --local

# Start API server (wrangler dev, port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port auto from $PORT)
pnpm --filter @workspace/grill-me run dev
```

## Deploy to Cloudflare

```bash
# Deploy API as a Worker
pnpm --filter @workspace/api-server run deploy   # wrangler deploy

# Build frontend for Pages
pnpm --filter @workspace/grill-me run build:pages
# Then publish dist/public/ to Cloudflare Pages (dashboard or wrangler pages deploy)
```

## Useful commands

```bash
pnpm run typecheck                             # Full typecheck across all packages
pnpm --filter @workspace/api-spec run codegen # Regenerate API hooks + Zod schemas from OpenAPI spec
```

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui, wouter routing, TanStack Query
- **API**: [Hono](https://hono.dev/) (Cloudflare Workers runtime) — raw D1 SQL queries, no ORM at runtime
- **Database**: Cloudflare D1 (SQLite) — schema in `db/schema.sql`, seed in `db/seed.sql`
- **Schema types**: Drizzle ORM (`sqlite-core`) in `lib/db` — used for type generation only, not at runtime
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API contract**: OpenAPI 3.0 spec → Orval codegen → React Query hooks + Zod schemas
- **Payments**: Stripe via direct `fetch` to Stripe REST API (no Stripe Node SDK — Workers compatible)
- **Email (OTP)**: Resend via direct `fetch` — demo mode shows OTP on screen when `RESEND_API_KEY` is absent

## Where things live

```
lib/
  api-spec/openapi.yaml          — OpenAPI contract (source of truth)
  api-client-react/src/generated/  — Generated TanStack Query hooks
  api-zod/src/generated/         — Generated Zod request/response schemas
  db/src/schema/                 — Drizzle sqlite-core schema (jerseys, orders, otp)

artifacts/
  api-server/
    src/index.ts                 — Hono app entry (Cloudflare Worker)
    src/dev-server.ts            — Node.js dev wrapper (D1 SQLite shim)
    src/routes/                  — jerseys, orders, otp, payments, admin, health
    src/lib/mailer.ts            — Resend email via fetch
    wrangler.toml                — Worker config (D1 binding, compatibility date)
  grill-me/
    src/pages/                   — Home, Shop, JerseyDetail, Cart, Checkout, OrderConfirmation
    src/contexts/CartContext.tsx  — Cart state (localStorage-backed, client-only)
    wrangler.toml                — Pages config (pages_build_output_dir)
  
db/
  schema.sql                     — D1 SQLite schema (source for wrangler d1 execute)
  seed.sql                       — 16 jersey rows for local/remote seeding
```

## Architecture decisions

- **Cloudflare-native only**: No Node.js-specific packages in the Worker bundle. Stripe and Resend are called via `fetch`. All DB access uses the `D1Database` binding directly (raw SQL).
- **Cart is 100% client-side**: React context + localStorage — no cart table or API needed.
- **OTP flow**: Code generated server-side → stored in D1 → verified before order placement. Token returned after verify, required on order POST.
- **Demo mode**: When `RESEND_API_KEY` is not set, `devOtp` is returned in the API response and shown prominently in the UI. Set the key to switch to real email.
- **No Drizzle at runtime**: `lib/db` schemas are `sqlite-core` types used for `drizzle-zod` type generation only. API routes use raw prepared statements against `c.env.DB` (D1).
- **SPA routing on Pages**: Vite build copies `index.html` → `404.html` so Cloudflare Pages serves the SPA on all routes.
- **Admin routes**: `/api/admin/orders` — list, get, update status; `/api/admin/stats` — revenue, order counts, top teams.

## Product features

- 16+ national team jersey catalog (Brazil, Argentina, France, England, Germany, Spain, Portugal, Italy, Netherlands, etc.)
- Filter by team name and kit type (home / away / third)
- Jersey detail page with size selector
- Cart with quantity management (localStorage, no login required)
- Checkout: customer info → OTP email verification → order confirmed
- Order confirmation page with order ID
- Stripe payment intent creation (`/api/payments/create-intent`)
- Admin dashboard: order management + revenue stats

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key for payment intent creation |
| `RESEND_API_KEY` | Optional | Resend API key for real OTP emails (demo mode if absent) |

Set in `wrangler.toml` `[vars]` for non-secret config, or as Cloudflare Worker secrets via `wrangler secret put`.

## User preferences

- OTP in demo mode — code shown on screen, no email service required for testing
- No real payment capture — Stripe payment intent only (no charge)
- Free tier only — D1, Workers, and Pages all within Cloudflare free limits

## Gotchas

- Always run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- OTP tokens expire after 10 minutes; the verified token is single-use
- D1 returns `INTEGER` booleans (0/1) — always use `Boolean()` cast in route handlers
- D1 returns JSON columns as strings — always `JSON.parse()` on `items` / `sizes` fields
- `wrangler dev` (workerd runtime) is the gold standard for local testing; `src/dev-server.ts` is a faster Node.js approximation using a SQLite shim
- Local D1 state lives in `artifacts/api-server/.wrangler/state/v3/d1/`

# Grill Me — FIFA Jersey Store

A full-stack FIFA jersey e-commerce store with cart, checkout, and OTP purchase verification.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/grill-me run dev` — run the frontend (port 22906)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks (React Query): `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- DB schema: `lib/db/src/schema/` — jerseys.ts, orders.ts, otp.ts
- API routes: `artifacts/api-server/src/routes/` — jerseys.ts, orders.ts, otp.ts
- Frontend: `artifacts/grill-me/src/`
  - Cart state: `src/contexts/CartContext.tsx` (localStorage-backed)
  - Pages: `src/pages/` (Home, Shop, JerseyDetail, Cart, Checkout, OrderConfirmation)

## Architecture decisions

- Cart is 100% client-side (React context + localStorage) — no cart API needed
- OTP is generated server-side and stored in `otp_codes` table with 10-minute expiry
- Demo mode: OTP code is returned in API response (`devOtp`) and displayed prominently in the UI — no email service required
- Order placement requires a verified OTP token (returned after `/otp/verify`) to prevent unverified orders
- Jersey images seeded with path references; design subagent generated actual image assets

## Product

- Jersey catalog with 16+ national team kits (Brazil, Argentina, France, England, Germany, Spain, Portugal, etc.)
- Filter by team and kit type (home/away/third)
- Add to cart with size selection
- Full checkout flow: customer info → OTP email verification → order placed
- Order confirmation page

## User preferences

- OTP in demo mode — code shown on screen, no email service
- No real payments — checkout form only
- Free tier compatible

## Gotchas

- Always run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- OTP tokens expire after 10 minutes
- The `ilike` filter on jerseys requires the `drizzle-orm` `ilike` import
- Numeric DB fields (price, rating) return as strings from pg — always `Number()` cast before responding

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

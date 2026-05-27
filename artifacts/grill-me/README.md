# Grill-Me Cloudflare Deployment

This frontend is configured for Cloudflare Pages.

## Build

```bash
pnpm install
pnpm --filter @workspace/grill-me build
```

The static output is generated to:

```bash
artifacts/grill-me/dist/public
```

## Cloudflare Pages deploy

Use the published directory above. If your frontend and backend are on different domains, set a Pages environment variable:

- `VITE_API_URL` = `https://<your-worker-domain>/<optional-base>/api`

Example:

```bash
wrangler pages publish artifacts/grill-me/dist/public --project-name fifa-jersey-shop --branch main
```

## Backend Worker deploy

From `artifacts/api-server`:

```bash
cd artifacts/api-server
wrangler deploy
```

## Required Cloudflare secrets and bindings

- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `GMAIL_USER` (optional)
- `DB` D1 binding

If your Pages frontend uses a separate Worker backend, set `VITE_API_URL` in Pages environment variables so the app can reach the Worker API.

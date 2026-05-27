---
name: Hono sub-app route ordering
description: Routes must be registered on a sub-app BEFORE mounting it with app.route() — Hono snapshots the route table at mount time.
---

**Rule:** Always register all routes on a Hono sub-app *before* calling `parentApp.route('/prefix', subApp)`.

**Why:** Hono snapshots the sub-app's route table at mount time. Any `subApp.route()` calls made *after* `parentApp.route('/prefix', subApp)` are silently ignored — the parent never sees them, and all requests return 404 (with CORS headers from middleware, making the server look alive).

**How to apply:** In index.ts or any router file, populate the sub-app fully, then mount:
```ts
// CORRECT
const api = new Hono();
api.route('/jerseys', jerseysRouter);
api.route('/', healthRouter);
app.route('/api', api);  // mount LAST

// WRONG — routes added after mount are invisible
const api = new Hono();
app.route('/api', api);   // mount FIRST — snapshot taken here
api.route('/jerseys', jerseysRouter);  // too late, ignored
```

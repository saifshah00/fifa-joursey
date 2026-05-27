// src/routes/jerseys.ts
import { Hono } from 'hono';
import { z } from 'zod';
import {
  ListJerseysQueryParams,
  GetJerseyParams,
  ListJerseysResponse,
  GetJerseyResponse,
  GetFeaturedJerseysResponse,
} from '@workspace/api-zod';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

// Helper: map DB row types to API shape
const mapJersey = (row: any) => ({
  id: Number(row.id),
  sku: row.sku,
  name: row.name,
  team: row.team,
  country: row.country,
  type: row.type,
  price: Number(row.price),
  originalPrice: row.originalPrice != null ? Number(row.originalPrice) : null,
  imageUrl: row.imageUrl,
  inStock: Boolean(row.inStock),
  sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
  rating: Number(row.rating),
  reviewCount: Number(row.reviewCount ?? 0),
  isFeatured: Boolean(row.isFeatured),
});

// GET /jerseys
app.get('/', async (c) => {
  try {
    // parse query params using your zod schema
    const rawQuery = c.req.query();
    const parsed = ListJerseysQueryParams.safeParse(rawQuery);
    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, 400);
    }
    const { team, type } = parsed.data;

    // Build SQL with parameter bindings
    const conditions: string[] = [];
    const bindings: any[] = [];

    if (team) {
      conditions.push('team LIKE ?');
      bindings.push(`%${team}%`);
    }
    if (type) {
      conditions.push('"type" = ?');
      bindings.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT id, sku, name, team, country, "type", price, originalPrice, imageUrl, inStock, sizes, rating, reviewCount, isFeatured
                 FROM jerseys
                 ${whereClause}
                 ORDER BY id`;

    const db = c.env.DB;
    const res = await db.prepare(sql).bind(...bindings).all();
    const rows = res.results ?? [];

    const mapped = rows.map(mapJersey);
    const validated = ListJerseysResponse.parse(mapped);
    return c.json(validated);
  } catch (err) {
    console.error('jerseys:list error', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// GET /jerseys/featured
app.get('/featured', async (c) => {
  try {
    const db = c.env.DB;
    const res = await db.prepare(
      `SELECT id, sku, name, team, country, "type", price, originalPrice, imageUrl, inStock, sizes, rating, reviewCount, isFeatured
       FROM jerseys
       WHERE isFeatured = 1
       ORDER BY id`
    ).all();
    const rows = res.results ?? [];
    const mapped = rows.map(mapJersey);
    const validated = GetFeaturedJerseysResponse.parse(mapped);
    return c.json(validated);
  } catch (err) {
    console.error('jerseys:featured error', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// GET /jerseys/:id
app.get('/:id', async (c) => {
  try {
    const rawId = c.req.param('id');
    const parsed = GetJerseyParams.safeParse({ id: Number(rawId) });
    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, 400);
    }
    const id = parsed.data.id;

    const db = c.env.DB;
    const res = await db.prepare(
      `SELECT id, sku, name, team, country, "type", price, originalPrice, imageUrl, inStock, sizes, rating, reviewCount, isFeatured
       FROM jerseys
       WHERE id = ?`
    ).bind(id).first();

    if (!res) return c.json({ error: 'Jersey not found' }, 404);

    const mapped = mapJersey(res);
    const validated = GetJerseyResponse.parse(mapped);
    return c.json(validated);
  } catch (err) {
    console.error('jerseys:get error', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export { app as jerseysRouter };

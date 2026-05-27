import { Hono } from 'hono';
import {
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  GetAdminOrderResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
  GetAdminStatsResponse,
} from '@workspace/api-zod';

export const adminRouter = new Hono<{ Bindings: { DB: D1Database } }>();

const VALID_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'] as const;

function mapOrderRow(row: any) {
  return {
    id: row.id,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    shippingAddress: row.shipping_address,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country,
    totalAmount: Number(row.total_amount),
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    createdAt: row.created_at,
  };
}

adminRouter.get('/admin/orders', async (c) => {
  const rawQuery = Object.fromEntries(c.req.query());
  const parsed = ListAdminOrdersQueryParams.safeParse(rawQuery);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { status, search, limit, offset } = parsed.data;
  const db = c.env.DB;

  const conditions: string[] = [];
  const bindings: any[] = [];
  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  }
  if (search) {
    conditions.push('(customer_name LIKE ? OR customer_email LIKE ?)');
    bindings.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const ordersSql = `
    SELECT id, status, customer_name, customer_email, shipping_address, city, postal_code, country, total_amount, items, created_at
    FROM orders
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?
    OFFSET ?
  `;
  const ordersResult = await db.prepare(ordersSql).bind(...bindings, limit, offset).all();
  const ordersRows = ordersResult.results ?? [];

  const countSql = `SELECT COUNT(*) AS total FROM orders ${whereClause}`;
  const countRow = await db.prepare(countSql).bind(...bindings).first();
  const total = countRow ? Number((countRow as any).total) : 0;

  return c.json(
    ListAdminOrdersResponse.parse({
      orders: ordersRows.map(mapOrderRow),
      total,
      limit,
      offset,
    }),
  );
});

adminRouter.get('/admin/orders/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  const db = c.env.DB;
  const row = await db
    .prepare(
      `SELECT id, status, customer_name, customer_email, shipping_address, city, postal_code, country, total_amount, items, created_at
       FROM orders
       WHERE id = ?`
    )
    .bind(id)
    .first();

  if (!row) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json(GetAdminOrderResponse.parse(mapOrderRow(row)));
});

adminRouter.patch('/admin/orders/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  const body = await c.req.json();
  const parsed = UpdateOrderStatusBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const status = parsed.data.status;
  if (!VALID_STATUSES.includes(status)) {
    return c.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, 400);
  }

  const updateResult = await c.env.DB.prepare(`UPDATE orders SET status = ? WHERE id = ?`).bind(status, id).run();
  if (!((updateResult as any).success && (updateResult as any).changes > 0)) {
    return c.json({ error: 'Order not found' }, 404);
  }

  const row = await c.env.DB
    .prepare(
      `SELECT id, status, customer_name, customer_email, shipping_address, city, postal_code, country, total_amount, items, created_at
       FROM orders
       WHERE id = ?`
    )
    .bind(id)
    .first();

  if (!row) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json(UpdateOrderStatusResponse.parse(mapOrderRow(row)));
});

adminRouter.get('/admin/stats', async (c) => {
  const db = c.env.DB;

  const totalsRow = await db.prepare(`SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders`).first();
  const totalOrders = totalsRow ? Number((totalsRow as any).totalOrders) : 0;
  const totalRevenue = totalsRow ? Number((totalsRow as any).totalRevenue) : 0;

  const statusRows = (await db.prepare(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`).all()).results ?? [];
  const ordersByStatus = statusRows.map((row: any) => ({ status: row.status, count: Number(row.count) }));

  const revenueByDayRows = (await db.prepare(`
    SELECT date(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    GROUP BY date(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all()).results ?? [];

  const topTeamsRows = (await db.prepare(`
    SELECT
      j.team AS team,
      SUM(CAST(json_extract(item.value, '$.quantity') AS INTEGER)) AS units,
      SUM(CAST(json_extract(item.value, '$.quantity') AS INTEGER) * j.price) AS revenue
    FROM orders o,
         json_each(o.items) AS item
    JOIN jerseys j ON j.id = CAST(json_extract(item.value, '$.jerseyId') AS INTEGER)
    GROUP BY j.team
    ORDER BY units DESC
    LIMIT 10
  `).all()).results ?? [];

  return c.json(
    GetAdminStatsResponse.parse({
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      ordersByStatus,
      revenueByDay: revenueByDayRows,
      topTeams: topTeamsRows,
    }),
  );
});

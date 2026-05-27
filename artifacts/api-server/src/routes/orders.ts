// src/routes/orders.ts
import { Hono } from 'hono';
import { CreateOrderBody } from '@workspace/api-zod';
import { sendEmail } from '../lib/mailer';

const ordersRouter = new Hono<{ Bindings: { DB: D1Database; RESEND_API_KEY?: string } }>();

function buildOtpTokenQuery(token: string) {
  return `SELECT id FROM otp_codes WHERE token = ? AND used = 1 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1`;
}

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

ordersRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = CreateOrderBody.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, 400);
    }

    const orderInput = parsed.data;
    const db = c.env.DB;

    const tokenResult = await db.prepare(buildOtpTokenQuery(orderInput.otpToken)).first();
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired OTP token' }, 400);
    }

    const jerseyIds = Array.from(new Set(orderInput.items.map((item) => item.jerseyId)));
    const placeholders = jerseyIds.map(() => '?').join(',');
    const prices = await db.prepare(`SELECT id, price FROM jerseys WHERE id IN (${placeholders})`).bind(...jerseyIds).all();
    const priceRows = prices.results ?? [];
    const priceMap = new Map<number, number>(priceRows.map((row: any) => [Number(row.id), Number(row.price)]));

    for (const item of orderInput.items) {
      if (!priceMap.has(item.jerseyId) || item.quantity <= 0) {
        return c.json({ error: `Invalid order item: ${item.jerseyId}` }, 400);
      }
    }

    const totalAmount = orderInput.items.reduce(
      (sum, item) => sum + priceMap.get(item.jerseyId)! * item.quantity,
      0,
    );

    const orderId = crypto.randomUUID();
    const insertSql = `
      INSERT INTO orders (id, status, customer_name, customer_email, shipping_address, city, postal_code, country, items, total_amount, created_at)
      VALUES (?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    await db.prepare(insertSql)
      .bind(
        orderId,
        orderInput.customerName,
        orderInput.customerEmail,
        orderInput.shippingAddress,
        orderInput.city ?? null,
        orderInput.postalCode ?? null,
        orderInput.country ?? null,
        JSON.stringify(orderInput.items),
        totalAmount,
      )
      .run();

    const orderResponse = {
      id: orderId,
      status: 'confirmed',
      customerName: orderInput.customerName,
      customerEmail: orderInput.customerEmail,
      shippingAddress: orderInput.shippingAddress,
      city: orderInput.city ?? null,
      postalCode: orderInput.postalCode ?? null,
      country: orderInput.country ?? null,
      totalAmount,
      items: orderInput.items,
      createdAt: new Date().toISOString(),
    };

    void sendEmail(c.env.RESEND_API_KEY, {
      to: orderInput.customerEmail,
      subject: 'Order confirmed',
      html: `<p>Thanks for your order. Order ID: ${orderId}</p><p>Total: $${totalAmount.toFixed(2)}</p>`,
      text: `Thanks for your order. Order ID: ${orderId}. Total: $${totalAmount.toFixed(2)}.`,
    });

    return c.json(orderResponse, 201);
  } catch (err) {
    console.error('orders:create error', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

ordersRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'Invalid id' }, 400);

    const db = c.env.DB;
    const row = await db.prepare(
      `SELECT id, status, customer_name, customer_email, shipping_address, city, postal_code, country, total_amount, items, created_at
       FROM orders
       WHERE id = ?`
    ).bind(id).first();

    if (!row) return c.json({ error: 'Order not found' }, 404);

    return c.json(mapOrderRow(row));
  } catch (err) {
    console.error('orders:get error', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export { ordersRouter };

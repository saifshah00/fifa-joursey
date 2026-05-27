import { Hono } from 'hono';
import { RequestOtpBody, RequestOtpResponse, VerifyOtpBody, VerifyOtpResponse } from '@workspace/api-zod';
import { sendOtpEmail } from '../lib/mailer';

const otpRouter = new Hono<{ Bindings: { DB: D1Database; RESEND_API_KEY?: string } }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

otpRouter.post('/otp/request', async (c) => {
  const body = await c.req.json();
  const parsed = RequestOtpBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { email } = parsed.data;
  const code = generateOtp();
  const db = c.env.DB;

  await db.prepare(
    `INSERT INTO otp_codes (email, code, used, expires_at, created_at) VALUES (?, ?, 0, ?, datetime('now'))`
  )
    .bind(email, code, new Date(Date.now() + 10 * 60 * 1000).toISOString())
    .run();

  try {
    await sendOtpEmail(c.env.RESEND_API_KEY, email, code);
  } catch (err) {
    console.error('otp:email error', err);
  }

  return c.json(
    RequestOtpResponse.parse({
      message: `A 6-digit code has been sent to ${email}. Check your inbox.`,
      devOtp: c.env.RESEND_API_KEY ? '' : code,
    }),
  );
});

otpRouter.post('/otp/verify', async (c) => {
  const body = await c.req.json();
  const parsed = VerifyOtpBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { email, otp } = parsed.data;
  const db = c.env.DB;

  const record = await db
    .prepare(
      `SELECT id FROM otp_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1`
    )
    .bind(email, otp)
    .first();

  if (!record) {
    return c.json({ error: 'Invalid or expired OTP. Please request a new one.' }, 400);
  }

  const token = crypto.randomUUID();
  await db.prepare(`UPDATE otp_codes SET used = 1, token = ? WHERE id = ?`).bind(token, record.id).run();

  return c.json(VerifyOtpResponse.parse({ message: 'OTP verified', token }));
});

export { otpRouter };

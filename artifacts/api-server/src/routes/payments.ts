import { Hono } from 'hono';
import { CreatePaymentIntentBody, CreatePaymentIntentResponse } from '@workspace/api-zod';

const paymentsRouter = new Hono<{ Bindings: { STRIPE_SECRET_KEY: string } }>();

paymentsRouter.post('/payments/create-intent', async (c) => {
  const body = await c.req.json();
  const parsed = CreatePaymentIntentBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { amountCents, currency } = parsed.data;
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: 'Stripe secret key not configured' }, 500);
  }

  const formData = new URLSearchParams();
  formData.append('amount', String(amountCents));
  formData.append('currency', currency.toLowerCase());
  formData.append('automatic_payment_methods[enabled]', 'true');

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    return c.json({ error: data.error?.message || 'Stripe payment creation failed' }, 500);
  }

  return c.json(
    CreatePaymentIntentResponse.parse({
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
    }),
  );
});

export { paymentsRouter };

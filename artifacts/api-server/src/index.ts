import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jerseysRouter } from './routes/jerseys';
import { ordersRouter } from './routes/orders';
import { otpRouter } from './routes/otp';
import { paymentsRouter } from './routes/payments';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';

export type Bindings = {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  GMAIL_USER?: string;
  BASE_PATH?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend requests
app.use('*', cors());

// Register all routes on the sub-app BEFORE mounting it — Hono snapshots
// the sub-app's route table at mount time, so order matters.
const api = new Hono<{ Bindings: Bindings }>();
api.route('/', healthRouter);
api.route('/jerseys', jerseysRouter);
api.route('/orders', ordersRouter);
api.route('/', otpRouter);
api.route('/', paymentsRouter);
api.route('/', adminRouter);

app.route('/api', api);

export default app;

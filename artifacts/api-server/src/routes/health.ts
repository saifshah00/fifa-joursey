import { Hono } from 'hono';
import { HealthCheckResponse } from '@workspace/api-zod';

const healthRouter = new Hono();

healthRouter.get('/healthz', (c) => {
  return c.json(HealthCheckResponse.parse({ status: 'ok' }));
});

export { healthRouter };

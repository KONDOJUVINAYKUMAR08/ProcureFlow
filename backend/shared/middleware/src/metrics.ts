import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Separate registry per process (not the global default) so multiple
// services running in the same test process (e.g. ai-service importing
// other services in-process in standalone mode) never collide on metric
// names being registered twice.
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/** Mount early (after body parsing, before routes) to time every request. */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    // req.route is only populated once Express has matched a route, so this
    // groups by the route PATTERN (e.g. "/api/vendors/:id"), not every literal
    // id value — keeps cardinality bounded.
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });
  next();
};

/** Mount at GET /metrics for Prometheus to scrape. */
export const metricsHandler = async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

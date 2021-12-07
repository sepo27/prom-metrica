import { RequestHandler } from 'express';
import { Registry } from 'prom-client';

export interface MetricaKit {
  collectorMiddleware: RequestHandler,
  metricsHandler: {
    endpoint: string,
    handler: RequestHandler,
  },
  registry: Registry,
}

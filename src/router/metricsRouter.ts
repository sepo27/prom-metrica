import { Router } from 'express';
import { Registry } from 'prom-client';
import { HttpMetric } from '../metric/http/HttpMetric';
import { collectorMiddleware } from '../middleware/collectorMiddleware';
import { metricsHandler } from '../handler/metricsHandler';

export const METRICS_DEFAULT_ENDPOINT = '/metrics';

interface Options {
  metricsEndpoint?: string,
}

export const metricsRouter = (metrics: HttpMetric[], options: Options = {}): Router => {
  // Setup metrics register

  const register = new Registry();

  metrics.forEach(m => {
    // @ts-ignore: TODO: fix type
    register.registerMetric(m);
  });

  // Init routing

  const
    router = Router(),
    metricsEndpoint = options.metricsEndpoint || METRICS_DEFAULT_ENDPOINT;

  // Use collector middleware

  router.use(collectorMiddleware(metrics, {
    excludeEndpoints: [metricsEndpoint],
  }));

  // Attach metrics handler
  router.get(metricsEndpoint, metricsHandler(register));

  return router;
};

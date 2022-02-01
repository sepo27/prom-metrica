import { Registry } from 'prom-client';
import { MetricaKit } from './types';
import { HttpMetric } from '../metric/http/HttpMetric';
import { PromMetric } from '../metric/prom/PromMetric';
import { collectorMiddleware as makeCollectorMiddleware } from '../middleware/collectorMiddleware';
import { METRICS_DEFAULT_ENDPOINT } from '../handler/constants';
import { metricsHandler as makeMetricsHandler } from '../handler/metricsHandler';
import { isHttpMetric } from '../metric/http/isHttpMetric';

interface Options {
  metricsEndpoint?: string,
}

const DefaultOptions: Options = {
  metricsEndpoint: METRICS_DEFAULT_ENDPOINT,
};

export const makeMetricaKit = (metrics: PromMetric[], options: Options = {}): MetricaKit => {
  // Define options

  const opts = { ...DefaultOptions, ...options };

  // Setup metrics register

  const registry = new Registry();

  metrics.forEach(m => {
    // @ts-ignore: TODO: fix type
    registry.registerMetric(m);
  });

  // Setup collector middleware

  const httpMetrics = metrics.filter(isHttpMetric) as HttpMetric[];

  const collectorMiddleware = makeCollectorMiddleware(httpMetrics, {
    excludeEndpoints: [opts.metricsEndpoint],
  });

  // Setup metrics handler

  const metricsHandler = {
    endpoint: opts.metricsEndpoint,
    handler: makeMetricsHandler(registry),
  };

  // Return stuff

  return {
    collectorMiddleware,
    metricsHandler,
    registry,
  };
};

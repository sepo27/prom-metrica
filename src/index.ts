import * as promClient from 'prom-client';
import { makeMetricaKit } from './kit/makeMetricaKit';
import { MetricaKit } from './kit/types';
import { HttpHistogramMetric } from './metric/http/histogram/HttpHistogramMetric';

export {
  HttpHistogramMetric,
  makeMetricaKit,
  MetricaKit,
  promClient,
};

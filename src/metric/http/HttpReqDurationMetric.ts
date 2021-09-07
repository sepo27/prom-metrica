import { HistogramConfiguration } from 'prom-client';
import { HistogramMetric } from '..';

const defaultLabelNames = ['protocol', 'method', 'path', 'statusCode'];

export class HttpReqDurationMetric extends HistogramMetric {
  constructor({ labelNames = defaultLabelNames, ...params }: HistogramConfiguration<string>) {
    super({
      ...params,
      labelNames,
    });
  }
}

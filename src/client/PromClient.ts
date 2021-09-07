import { register, Registry } from 'prom-client';
import { Metric } from '../metric/Metric';

type BaseMetricMapT = Record<string, Metric>

interface Options {
  metricPrefix?: string,
}

export class PromClient<MetricMapT extends BaseMetricMapT = BaseMetricMapT> {
  // eslint-disable-next-line no-useless-constructor,no-empty-function
  constructor(private options: Options = {}) {}

  /*** Public ***/

  public readonly register: Registry = register;
  public readonly metric: MetricMapT = {} as MetricMapT;

  public addMetric(key: keyof MetricMapT, metric: Metric) {
    this.metric[key] = metric as any; // TODO: type
  }

  public metricName(name: string): string {
    const { metricPrefix } = this.options;

    if (metricPrefix) {
      return `${metricPrefix.replace(/^_|_$/g, '')}_${name}`;
    }

    return name;
  }
}

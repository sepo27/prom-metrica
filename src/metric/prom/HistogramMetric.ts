import { Histogram } from 'prom-client';
import { PromMetric } from './PromMetric';

export class HistogramMetric<LabelT extends string = string> extends Histogram<LabelT> implements PromMetric {
  readonly name: string;
  readonly help: string;
  labelNames: string[] = [];
}

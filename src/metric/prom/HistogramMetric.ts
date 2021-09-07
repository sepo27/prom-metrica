import { Histogram } from 'prom-client';
import { Metric } from '../Metric';

export class HistogramMetric<LabelT extends string = string> extends Histogram<LabelT> implements Metric {
  name: string;
  help: string;
}

import { HistogramMetric } from '../metric';
import { PromClient } from './PromClient';

describe('PromClient', () => {
  it('adds metric', () => {
    type MetricMap = {
      foo: HistogramMetric,
    }

    const client = new PromClient<MetricMap>();
    const metric = new HistogramMetric({
      name: 'foo_metric',
      help: 'The foo metric',
    });
    client.addMetric('foo', metric);

    expect(client.metric.foo).toBeInstanceOf(HistogramMetric);
    expect(client.metric.foo.name).toBe('foo_metric');
  });

  it('makes metric name', () => {
    const client = new PromClient();

    expect(client.metricName('bar_secs')).toBe('bar_secs');
  });

  it('makes metric name with prefix', () => {
    const client = new PromClient({
      metricPrefix: 'abc',
    });

    expect(client.metricName('bar_secs')).toBe('abc_bar_secs');
  });

  it('makes metric name with prefix #2', () => {
    const client = new PromClient({
      metricPrefix: 'xyz_',
    });

    expect(client.metricName('fox_bar')).toBe('xyz_fox_bar');
  });
});

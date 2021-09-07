// eslint-disable-next-line max-classes-per-file
import * as sinonLib from 'sinon';
import { register } from 'prom-client';

describe('HttpReqDurationMetric.spec', () => {
  let sinon: sinonLib.SinonSandbox;

  beforeEach(() => {
    sinon = sinonLib.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    register.clear();
    require.cache = {};
  });

  it('inherits from HistogramMetric', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      const { HistogramMetric } = require('../prom/HistogramMetric');

      // eslint-disable-next-line global-require
      const metric = new (require('./HttpReqDurationMetric').HttpReqDurationMetric)({
        name: 'foo',
        help: 'foo',
      });
      expect(metric).toBeInstanceOf(HistogramMetric);
    });
  });

  it('adds http label names by default', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      const HistogramMetricModule = require('../prom/HistogramMetric');

      const histogramConstructorSpy = sinon.spy();
      class HistogramMetricMock {
        constructor(...params) {
          histogramConstructorSpy(...params);
        }
      }
      sinon.stub(HistogramMetricModule, 'HistogramMetric').value(HistogramMetricMock);

      // eslint-disable-next-line global-require
      new (require('./HttpReqDurationMetric').HttpReqDurationMetric)({
        name: 'barry',
        help: 'foo',
      });

      expect(histogramConstructorSpy.getCall(0).args).toEqual([{
        name: 'barry',
        help: 'foo',
        labelNames: ['protocol', 'method', 'path', 'statusCode'],
      }]);
    });
  });

  it('overwrites default http label names', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      const HistogramMetricModule = require('../prom/HistogramMetric');

      const histogramConstructorSpy = sinon.spy();
      class HistogramMetricMock {
        constructor(...params) {
          histogramConstructorSpy(...params);
        }
      }
      sinon.stub(HistogramMetricModule, 'HistogramMetric').value(HistogramMetricMock);

      // eslint-disable-next-line global-require
      new (require('./HttpReqDurationMetric').HttpReqDurationMetric)({
        name: 'a',
        help: 'b',
        labelNames: ['foo', 'bar', 'protocol'],
      });

      expect(histogramConstructorSpy.getCall(0).args).toMatchObject([{
        labelNames: ['foo', 'bar', 'protocol'],
      }]);
    });
  });
});

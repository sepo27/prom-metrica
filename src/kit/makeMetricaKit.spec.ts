import * as sinonLib from 'sinon';
import * as PromModule from 'prom-client';
import { HttpHistogramMetric } from '..';
import * as CollectorMiddlewareModule from '../middleware/collectorMiddleware';
import * as MetricsHandlerModule from '../handler/metricsHandler';
import { makeMetricaKit } from './makeMetricaKit';
import { METRICS_DEFAULT_ENDPOINT } from '../handler/constants';
import { HistogramMetric } from '../metric/prom/HistogramMetric';

describe('makeMetricaKit()', () => {
  let
    sinon: sinonLib.SinonSandbox,
    register,
    registerMetricSpy,
    collectorMiddlewareStub,
    metricsHandlerStub;

  beforeEach(() => {
    sinon = sinonLib.createSandbox();

    // Register mocks

    register = {
      registerMetric() {},
    };
    registerMetricSpy = sinon.spy(register, 'registerMetric');
    sinon.stub(PromModule, 'Registry').value(TestRegistryClass);

    // Other mocks
    collectorMiddlewareStub = sinon.stub(CollectorMiddlewareModule, 'collectorMiddleware');
    metricsHandlerStub = sinon.stub(MetricsHandlerModule, 'metricsHandler');
  });

  afterEach(() => {
    sinon.restore();
    PromModule.register.clear();
  });

  it('registers metrics in custom registry', () => {
    const
      metric1 = makeHttpMetric({ name: 'm1' }),
      metric2 = makeHttpMetric({ name: 'm2' });

    makeMetricaKit([metric1, metric2]);

    expect(registerMetricSpy.calledTwice).toBeTruthy();
    expect(registerMetricSpy.getCall(0).args).toEqual([metric1]);
    expect(registerMetricSpy.getCall(1).args).toEqual([metric2]);
  });

  it('sets up collector middleware', () => {
    const
      metrics = [makeHttpMetric()],
      collectorMiddleware = () => {};

    collectorMiddlewareStub.returns(collectorMiddleware);

    const kit = makeMetricaKit(metrics);

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[0]).toEqual(metrics);
    expect(kit.collectorMiddleware).toBe(collectorMiddleware);
  });

  it('allows non-http metrics', () => {
    const
      histogramMetric = new HistogramMetric({
        name: 'hist',
        help: 'HistHelp',
      }),
      httpMetric = makeHttpMetric(),
      collectorMiddleware = () => {};

    collectorMiddlewareStub.returns(collectorMiddleware);

    makeMetricaKit([histogramMetric, httpMetric]);

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[0]).toEqual([httpMetric]);
  });

  it('excludes default metrics endpoint from collector by default', () => {
    makeMetricaKit([]);

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[1]).toEqual({
      excludeEndpoints: [METRICS_DEFAULT_ENDPOINT],
    });
  });

  it('excludes custom metrics endpoint from collector by default', () => {
    const metricsEndpoint = '/bar/foo';

    makeMetricaKit([], { metricsEndpoint });

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[1]).toEqual({
      excludeEndpoints: [metricsEndpoint],
    });
  });

  it('sets up metrics handler', () => {
    const
      metrics = [makeHttpMetric()],
      metricsHandler = () => {};

    metricsHandlerStub.returns(metricsHandler);

    const kit = makeMetricaKit(metrics);

    expect(metricsHandlerStub.calledOnce).toBeTruthy();
    expect(metricsHandlerStub.getCall(0).args).toEqual([register]);
    expect(kit.metricsHandler.endpoint).toBe(METRICS_DEFAULT_ENDPOINT);
    expect(kit.metricsHandler.handler).toBe(metricsHandler);
  });

  it('sets up metrics handler with custom endpoint', () => {
    const kit = makeMetricaKit([], { metricsEndpoint: '/bar/baz' });

    expect(kit.metricsHandler.endpoint).toBe('/bar/baz');
  });

  it('returns metrics registry', () => {
    const kit = makeMetricaKit([]);
    expect(kit.registry).toBe(register);
  });

  /*** Lib ***/

  class TestRegistryClass {
    constructor() {
      return register;
    }
  }

  function makeHttpMetric(params = {}) {
    return new HttpHistogramMetric({
      name: 'foo',
      help: 'foo',
      ...params,
    });
  }
});

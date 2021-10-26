/* eslint-disable max-classes-per-file */

import * as sinonLib from 'sinon';
import * as PromModule from 'prom-client';
import * as ExpressModule from 'express';
import { HttpHistogramMetric } from '../metric/http/histogram/HttpHistogramMetric';
import { METRICS_DEFAULT_ENDPOINT, metricsRouter } from './metricsRouter';
import * as CollectorMiddlewareModule from '../middleware/collectorMiddleware';
import * as MetricsHandlerModule from '../handler/metricsHandler';

describe('metricsRouter', () => {
  let
    sinon: sinonLib.SinonSandbox,
    register,
    registerMetricSpy,
    router,
    routerUseSpy,
    routerGetSpy,
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

    // Router mocks

    router = {
      use() {},
      get() {},
    };
    routerUseSpy = sinon.spy(router, 'use');
    routerGetSpy = sinon.spy(router, 'get');
    sinon.stub(ExpressModule, 'Router').returns(router);

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
      metric1 = makeMetric({ name: 'm1' }),
      metric2 = makeMetric({ name: 'm2' }),
      metrics = [metric1, metric2];

    metricsRouter(metrics);

    expect(registerMetricSpy.calledTwice).toBeTruthy();
    expect(registerMetricSpy.getCall(0).args).toEqual([metric1]);
    expect(registerMetricSpy.getCall(1).args).toEqual([metric2]);
  });

  it('uses collector middleware', () => {
    const
      metrics = [makeMetric()],
      collectorMiddleware = () => {};

    collectorMiddlewareStub.returns(collectorMiddleware);

    metricsRouter(metrics);

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[0]).toEqual(metrics);
    expect(routerUseSpy.calledOnce).toBeTruthy();
    expect(routerUseSpy.getCall(0).args).toEqual([collectorMiddleware]);
  });

  it('attaches metrics handler by default', () => {
    const
      metrics = [makeMetric()],
      metricsHandler = () => {};

    metricsHandlerStub.returns(metricsHandler);

    metricsRouter(metrics);

    expect(metricsHandlerStub.calledOnce).toBeTruthy();
    expect(metricsHandlerStub.getCall(0).args).toEqual([register]);
    expect(routerGetSpy.calledOnce).toBeTruthy();
    expect(routerGetSpy.getCall(0).args).toEqual([METRICS_DEFAULT_ENDPOINT, metricsHandler]);
  });

  it('provides option to configure custom metrics endpoint', () => {
    metricsRouter([], {
      metricsEndpoint: '/foo/bar',
    });

    expect(routerGetSpy.calledOnce).toBeTruthy();
    expect(routerGetSpy.getCall(0).args[0]).toBe('/foo/bar');
  });

  it('excludes default metrics endpoint from collector by default', () => {
    metricsRouter([]);

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[1]).toEqual({
      excludeEndpoints: [METRICS_DEFAULT_ENDPOINT],
    });
  });

  it('excludes custom metrics endpoint from collector by default', () => {
    const metricsEndpoint = '/bar/foo';

    metricsRouter([], { metricsEndpoint });

    expect(collectorMiddlewareStub.calledOnce).toBeTruthy();
    expect(collectorMiddlewareStub.getCall(0).args[1]).toEqual({
      excludeEndpoints: [metricsEndpoint],
    });
  });

  it('returns router', () => {
    const [retRouter] = metricsRouter([]);

    expect(retRouter).toBe(router);
  });

  it('returns metrics registry', () => {
    const [, retRegister] = metricsRouter([]);

    expect(retRegister).toBe(register);
  });

  it('discards metrics handler when configured so', () => {
    const
      metrics = [makeMetric()],
      metricsHandler = () => {};

    metricsHandlerStub.returns(metricsHandler);

    metricsRouter(metrics, {
      discardMetricsHandler: true,
    });

    expect(metricsHandlerStub.calledOnce).toBeFalsy();
  });

  /*** Lib ***/

  class TestRegistryClass {
    constructor() {
      return register;
    }
  }

  function makeMetric(params = {}) {
    return new HttpHistogramMetric({
      name: 'foo',
      help: 'foo',
      ...params,
    });
  }
});

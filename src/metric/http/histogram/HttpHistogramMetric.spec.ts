/* eslint-disable global-require */

import * as sinonLib from 'sinon';
import { register } from 'prom-client';
import { HttpHistogramMetric } from './HttpHistogramMetric';

describe('HttpHistogramMetric', () => {
  let sinon: sinonLib.SinonSandbox;

  beforeEach(() => {
    sinon = sinonLib.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    register.clear();
  });

  it('startRequestTimer() with default request labels', () => {
    const
      metric = makeMetric(),
      req = {
        protocol: 'http',
        method: 'get',
        path: '/foo',
      };

    const startTimerSpy = sinon.spy(metric, 'startTimer');

    // @ts-ignore
    metric.startRequestTimer(req);

    expect(metric.labelNames).toEqual(['protocol', 'method', 'path', 'statusCode']);
    expect(startTimerSpy.calledOnce).toBeTruthy();
    expect(startTimerSpy.getCall(0).args).toEqual([{
      protocol: 'http',
      method: 'GET',
      path: '/foo',
    }]);
  });

  it('startRequestTimer() with custom label map request', () => {
    const
      labelMap = {
        req: {
          foo: req => req.path,
        },
      },
      metric = makeMetric({
        labelMap,
      }),
      req = {
        path: '/foxy',
      };

    const startTimerSpy = sinon.spy(metric, 'startTimer');

    // @ts-ignore
    metric.startRequestTimer(req);

    expect(metric.labelNames).toEqual(['foo']);
    expect(startTimerSpy.calledOnce).toBeTruthy();
    expect(startTimerSpy.getCall(0).args).toEqual([{
      foo: '/foxy',
    }]);
  });

  it('startRequestTimer() with custom label map request overwriting default labels', () => {
    const
      labelMap = {
        req: {
          path: req => `${req.path}/custom`,
          foo: 'stuff',
        },
      },
      metric = makeMetric({
        labelMap,
        mergeLabels: true,
      }),
      req = {
        protocol: 'http',
        method: 'get',
        path: '/foo',
      };

    const startTimerSpy = sinon.spy(metric, 'startTimer');

    // @ts-ignore
    metric.startRequestTimer(req);

    expect(metric.labelNames).toEqual(['protocol', 'method', 'path', 'foo', 'statusCode']);
    expect(startTimerSpy.calledOnce).toBeTruthy();
    expect(startTimerSpy.getCall(0).args).toEqual([{
      protocol: 'http',
      method: 'GET',
      path: '/foo/custom',
      foo: 'stuff',
    }]);
  });

  it('startRequestTimer() with default response labels', () => {
    const
      metric = makeMetric(),
      req = {
        protocol: 'http',
        method: 'get',
        path: '/foo',
      },
      res = { statusCode: 201 };

    const timerSpy = sinon.spy();
    sinon.stub(metric, 'startTimer').returns(timerSpy);

    // @ts-ignore
    metric.startRequestTimer(req)(res);

    expect(metric.labelNames).toEqual(['protocol', 'method', 'path', 'statusCode']);
    expect(timerSpy.calledOnce).toBeTruthy();
    expect(timerSpy.getCall(0).args).toEqual([{
      statusCode: res.statusCode,
    }]);
  });

  it('startRequestTimer() with custom response labels', () => {
    const
      metric = makeMetric({
        labelMap: {
          res: {
            barry: res => res.status,
          },
        },
      }),
      req = {},
      res = { status: '201 OK' };

    const timerSpy = sinon.spy();
    sinon.stub(metric, 'startTimer').returns(timerSpy);

    // @ts-ignore
    metric.startRequestTimer(req)(res);

    expect(metric.labelNames).toEqual(['barry']);
    expect(timerSpy.calledOnce).toBeTruthy();
    expect(timerSpy.getCall(0).args).toEqual([{
      barry: res.status,
    }]);
  });

  it('startRequestTimer() with custom response labels merging default ones', () => {
    const
      metric = makeMetric({
        labelMap: {
          res: {
            foo: res => res.status,
          },
        },
        mergeLabels: true,
      }),
      req = {
        protocol: 'http',
        method: 'get',
        path: '/foo',
      },
      res = {
        status: '201 OK',
        statusCode: 201,
      };

    const timerSpy = sinon.spy();
    sinon.stub(metric, 'startTimer').returns(timerSpy);

    // @ts-ignore
    metric.startRequestTimer(req)(res);

    expect(metric.labelNames).toEqual(['protocol', 'method', 'path', 'statusCode', 'foo']);
    expect(timerSpy.calledOnce).toBeTruthy();
    expect(timerSpy.getCall(0).args).toEqual([{
      foo: res.status,
      statusCode: res.statusCode,
    }]);
  });

  it('startRequestTimer() returns duration', () => {
    const
      metric = makeMetric({
        labelMap: {},
      }),
      duration = 123;

    const timerSpy = sinon.stub().returns(duration);
    sinon.stub(metric, 'startTimer').returns(timerSpy);

    // @ts-ignore
    const timer = metric.startRequestTimer({});

    // @ts-ignore
    expect(timer({})).toBe(duration);
  });

  /*** Lib ***/

  function makeMetric(params = {}) {
    return new HttpHistogramMetric({
      name: 'foo',
      help: 'foo',
      ...params,
    });
  }
});

import * as sinonLib from 'sinon';
import { register } from 'prom-client';
import { HttpHistogramMetric } from '../metric/http/histogram/HttpHistogramMetric';
import { collectorMiddleware } from './collectorMiddleware';

describe('collectorMiddleware', () => {
  let sinon: sinonLib.SinonSandbox;

  beforeEach(() => {
    sinon = sinonLib.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    register.clear();
  });

  it('starts request timer for metrics', () => {
    const
      metric1 = makeMetric({ name: 'm1' }),
      metric2 = makeMetric({ name: 'm2' }),
      req = {},
      res = { on() {} },
      next = () => {};

    const
      startTimerSpy1 = sinon.stub(metric1, 'startRequestTimer'),
      startTimerSpy2 = sinon.stub(metric2, 'startRequestTimer');

    // @ts-ignore
    collectorMiddleware([metric1, metric2])(req, res, next);

    expect(startTimerSpy1.calledOnce).toBeTruthy();
    expect(startTimerSpy1.getCall(0).args).toEqual([req]);
    expect(startTimerSpy2.calledOnce).toBeTruthy();
    expect(startTimerSpy2.getCall(0).args).toEqual([req]);
  });

  it('ends request timer for metrics', () => {
    const
      metric1 = makeMetric({ name: 'm1' }),
      metric2 = makeMetric({ name: 'm2' }),
      req = {},
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      res = { on(...args) {} },
      next = () => {};

    const
      timerSpy1 = sinon.spy(),
      timerSpy2 = sinon.spy();

    sinon.stub(metric1, 'startRequestTimer').returns(timerSpy1);
    sinon.stub(metric2, 'startRequestTimer').returns(timerSpy2);
    sinon.stub(res, 'on').withArgs('close').callsArg(1);

    // @ts-ignore
    collectorMiddleware([metric1, metric2])(req, res, next);

    expect(timerSpy1.calledOnce).toBeTruthy();
    expect(timerSpy1.getCall(0).args).toEqual([res]);
    expect(timerSpy2.calledOnce).toBeTruthy();
    expect(timerSpy2.getCall(0).args).toEqual([res]);
  });

  it('calls next', () => {
    const
      metric = makeMetric(),
      req = {},
      res = { on() {} },
      nextSpy = sinon.spy();

    sinon.stub(metric, 'startRequestTimer');

    // @ts-ignore
    collectorMiddleware([metric])(req, res, nextSpy);

    expect(nextSpy.calledOnce).toBeTruthy();
    expect(nextSpy.getCall(0).args).toEqual([]);
  });

  it('provides option to exclude endpoints', () => {
    const
      metric = makeMetric(),
      req = { path: '/foo' },
      res = { on() {} },
      nextSpy = sinon.spy();

    const startTimerSpy = sinon.stub(metric, 'startRequestTimer');

    // @ts-ignore
    collectorMiddleware([metric], { excludeEndpoints: ['/foo'] })(req, res, nextSpy);

    expect(startTimerSpy.callCount).toBe(0);
    expect(nextSpy.calledOnce).toBeTruthy();
    expect(nextSpy.getCall(0).args).toEqual([]);
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

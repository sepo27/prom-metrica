import * as sinonLib from 'sinon';
import { register } from 'prom-client';
import { HttpReqDurationMetric } from '../metric/http/HttpReqDurationMetric';
import { httpRequestDurationMiddleware } from './httpRequestDurationMiddleware';

describe('httpRequestDurationMiddleware()', () => {
  let sinon;

  beforeEach(() => {
    sinon = sinonLib.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    register.clear();
  });

  it('observes http request duration metric with default labels', () => {
    const metric = new HttpReqDurationMetric({
      name: 'foo',
      help: 'foo',
    });

    const observeSpy = sinon.spy();
    sinon.stub(metric, 'startTimer').returns(observeSpy);

    const
      reqMock = {
        protocol: 'https',
        method: 'get',
        path: '/foo/bar',
      },
      resMock = {
        statusCode: 200,
        on() {},
      },
      nextSpy = sinon.spy();

    sinon.stub(resMock, 'on').withArgs('close').callsArg(1);

    const middleware = httpRequestDurationMiddleware(metric);
    // @ts-ignore
    middleware(reqMock, resMock, nextSpy);

    expect(observeSpy.calledOnce).toBeTruthy();
    expect(observeSpy.getCall(0).args).toEqual([{
      protocol: reqMock.protocol,
      method: reqMock.method.toUpperCase(),
      path: reqMock.path,
      statusCode: resMock.statusCode,
    }]);
    expect(nextSpy.calledOnce).toBeTruthy();
  });

  it('observes http request duration metric with custom labels', () => {
    const metric = new HttpReqDurationMetric({
      name: 'foo',
      help: 'foo',
    });

    const observeSpy = sinon.spy();
    sinon.stub(metric, 'startTimer').returns(observeSpy);

    const
      reqMock = {
        method: 'get',
        path: '/bar/foo',
      },
      resMock = {
        on() {},
      },
      nextSpy = sinon.spy();

    sinon.stub(resMock, 'on').withArgs('close').callsArg(1);

    const middleware = httpRequestDurationMiddleware(metric, {
      labels: req => ({
        method: req.method.toUpperCase(),
        path: req.path,
      }),
    });
    // @ts-ignore
    middleware(reqMock, resMock, nextSpy);

    expect(observeSpy.calledOnce).toBeTruthy();
    expect(observeSpy.getCall(0).args).toEqual([{
      method: reqMock.method.toUpperCase(),
      path: reqMock.path,
    }]);
  });

  it('provides options to exclude some endpoints', () => {
    const
      metric = new HttpReqDurationMetric({
        name: 'foo',
        help: 'bar',
      }),
      reqMock = { path: '/metrics' },
      resMock = { on() {} },
      resOnSpy = sinon.spy(resMock, 'on'),
      nextSpy = sinon.spy();

    const middleware = httpRequestDurationMiddleware(metric, {
      excludeEndpoints: ['/metrics'],
    });

    // @ts-ignore
    middleware(reqMock, resMock, nextSpy);

    expect(resOnSpy.callCount).toBe(0);
    expect(nextSpy.calledOnce).toBeTruthy();
  });
});

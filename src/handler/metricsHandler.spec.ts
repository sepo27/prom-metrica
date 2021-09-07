import * as sinonLib from 'sinon';
import { metricsHandler } from './metricsHandler';

describe('metricsHandler', () => {
  let sinon: sinonLib.SinonSandbox;

  beforeEach(() => {
    sinon = sinonLib.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('resolves with metrics from register', async () => {
    const
      metricsData = 'foo bar baz',
      register = {
        contentType: 'application/foo',
        metrics() { return Promise.resolve(metricsData); },
      },
      res = {
        set() { return this; },
        status() { return this; },
        send() { return this; },
      };

    const
      resSetSpy = sinon.spy(res, 'set'),
      resStatusSpy = sinon.spy(res, 'status'),
      resSendSpy = sinon.spy(res, 'send');

    // @ts-ignore
    const handler = metricsHandler(register);

    // @ts-ignore
    await handler({}, res, () => {});

    expect(resSetSpy.calledOnce).toBeTruthy();
    expect(resSetSpy.getCall(0).args).toEqual(['Content-Type', register.contentType]);

    expect(resStatusSpy.calledOnce).toBeTruthy();
    expect(resStatusSpy.getCall(0).args).toEqual([200]);

    expect(resSendSpy.calledOnce).toBeTruthy();
    expect(resSendSpy.getCall(0).args).toEqual([metricsData]);
  });
});

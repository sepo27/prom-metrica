// eslint-disable-next-line import/no-unresolved
import { NextFunction, Request, Response } from 'express';
import { HttpMetric } from '../metric/http/HttpMetric';

interface Options {
  excludeEndpoints?: string[],
}

export const collectorMiddleware = (metrics: HttpMetric[], options: Options = {}) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (options.excludeEndpoints && options.excludeEndpoints.indexOf(req.path) > -1) {
    next();
    return;
  }

  const timers = metrics.map(m => m.startRequestTimer(req));

  res.on('close', () => {
    timers.forEach(t => { t(res); });
  });

  next();
};

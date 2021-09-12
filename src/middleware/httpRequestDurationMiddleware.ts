// eslint-disable-next-line import/no-unresolved
import { Request, Response, NextFunction } from 'express';
import { HttpReqDurationMetric } from '../metric/http/HttpReqDurationMetric';

interface Options {
  labels?: (req: Request, res: Response) => object,
  excludeEndpoints?: string[],
}

export const httpRequestDurationMiddleware = (metric: HttpReqDurationMetric, options: Options = {}) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (options.excludeEndpoints && options.excludeEndpoints.indexOf(req.path) > -1) {
    next();
    return;
  }

  const observe = metric.startTimer();

  res.on('close', () => {
    const labels = options.labels
      ? options.labels(req, res)
      : {
        protocol: req.protocol,
        method: req.method.toUpperCase(),
        path: req.path,
        statusCode: res.statusCode,
      };

    observe(labels);
  });

  next();
};

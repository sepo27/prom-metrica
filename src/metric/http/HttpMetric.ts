// eslint-disable-next-line import/no-unresolved
import { Request, Response } from 'express';
import { PromMetric } from '../prom/PromMetric';

export interface HttpMetric extends PromMetric {
  startRequestTimer(req: Request): (res: Response) => number
}

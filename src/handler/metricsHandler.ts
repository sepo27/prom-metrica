import { Registry } from 'prom-client';
// eslint-disable-next-line import/no-unresolved
import { Handler } from 'express';

export const metricsHandler = (register: Registry): Handler => async (_, res) => {
  res.set('Content-Type', register.contentType);
  res.status(200).send(await register.metrics());
};

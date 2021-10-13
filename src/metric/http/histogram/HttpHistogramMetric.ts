// eslint-disable-next-line import/no-unresolved
import { Request, Response } from 'express';
import { HistogramConfiguration } from 'prom-client';
import { HistogramMetric } from '../../prom/HistogramMetric';
import { HttpMetric } from '../HttpMetric';

type LabelVal = string | number;
type ReqLabelProducer = (req: Request) => LabelVal;
type ResLabelProducer = (res: Response) => LabelVal;

interface LabelMap {
  req?: {
    [k: string]: LabelVal | ReqLabelProducer,
  },
  res?: {
    [k: string]: LabelVal | ResLabelProducer,
  },
}

interface Params extends HistogramConfiguration<string> {
  labelMap?: LabelMap,
  mergeLabels?: boolean,
}

const defaultLabelMap: LabelMap = {
  req: {
    method: req => req.method.toUpperCase(),
  },
  res: {
    statusCode: res => obfuscateStatusCode(res.statusCode),
  },
};

export class HttpHistogramMetric extends HistogramMetric implements HttpMetric {
  constructor({ labelMap, mergeLabels, ...config }: Params) {
    super(config);
    this.initLabels({ labelMap, mergeLabels, ...config });
  }

  /*** Public ***/

  startRequestTimer(req: Request): (res: Response) => number {
    const
      startLabels = this.mapLabels(this.labelMap.req, req),
      timer = this.startTimer(startLabels);

    return (res: Response) => {
      const endLabels = this.mapLabels(this.labelMap.res, res);
      return timer(endLabels);
    };
  }

  /*** Private ***/

  private labelMap: LabelMap = {};

  private initLabels({ labelMap: paramLabelMap, mergeLabels }: Params) {
    let labelMap = { ...defaultLabelMap };

    if (paramLabelMap && mergeLabels) {
      labelMap.req = { ...labelMap.req, ...paramLabelMap.req };
      labelMap.res = { ...labelMap.res, ...paramLabelMap.res };
    } else if (paramLabelMap) {
      labelMap = { req: {}, res: {}, ...paramLabelMap };
    }

    this.labelNames = Object
      .keys(labelMap.req)
      .concat(Object.keys(labelMap.res));

    this.labelMap = labelMap;
  }

  private mapLabels(map, labelInput) {
    return Object.keys(map).reduce(
      (acc, label) => {
        const labelVal = typeof map[label] === 'function'
          ? map[label](labelInput)
          : map[label];

        return Object.assign(acc, { [label]: labelVal });
      },
      {},
    );
  }
}

/*** Lib ***/

function obfuscateStatusCode(code) {
  return `${code.toString()[0]}xx`;
}

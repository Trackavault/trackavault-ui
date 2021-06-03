import BigNumber from 'bignumber.js';
import {AssetPrice} from '@src/app/services/api/api.service.types';
import {AssetPriceDetail} from '@src/app/services/sources/investment.source.types';

export const weightedMean = (arrValues: BigNumber[], arrWeights: BigNumber[]): BigNumber => {
  const result = arrValues
    .map((value, i) => {
      const weight = arrWeights[i];
      const sum = value.times(weight);
      return [sum, weight];
    })
    .reduce((p, c) => [p[0].plus(c[0]), p[1].plus(c[1])], [new BigNumber(0), new BigNumber(0)]);

  return result[0].div(result[1]);
};

export function calcAPY(previous: BigNumber, current: BigNumber, numDays: number): number {
  if (previous.eq(0) || current.eq(0)) {
    return 0;
  }
  return ((current.minus(previous).div(previous).div(numDays).plus(1)).pow(365)).minus(1).toNumber();
}

export function calcAssetValue(assetPrice: AssetPrice, amount: BigNumber, name: string): AssetPriceDetail[] {
  const result = [{
    amount,
    name,
    price: new BigNumber(assetPrice.price),
    currency: 'USD',
  }] as AssetPriceDetail[];

  let assetAcc = amount;
  for (let i = assetPrice.chain.length - 1; i >= 0 ; i--) {
    const chainEl = assetPrice.chain[i];
    assetAcc = assetAcc.times(chainEl.factor);
    result.push({
      amount: assetAcc,
      name: chainEl.name,
      price: new BigNumber(chainEl.price),
      currency: 'USD',
    });
  }

  return result;
}

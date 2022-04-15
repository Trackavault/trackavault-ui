import moment from 'moment';
import BigNumber from 'bignumber.js';
import {CurrencyValue} from '@src/app/services/currency/currency.service';
import {Observable} from 'rxjs';
import {weightedMean} from '@src/app/utils/math';
import {Transaction} from '@src/app/services/api/api.service.types';

export enum EPlatform {
  Ethereum,
  Fantom,
}

export interface AssetPriceDetail {
  amount: BigNumber;
  name: string;
  price: BigNumber;
  currency: string;
}

export class Investment {
  id: string;
  platform: EPlatform;
  name: string;
  shares: BigNumber;
  transaction: Transaction;
  value: {
    current: AssetPriceDetail[];
    initial: AssetPriceDetail[];
  };
  logo?: string;
  profitAll: AssetPriceDetail[];
  profitDaily: AssetPriceDetail[];
  roi: string;
  roiDaily: string;
  apy?: {
    position: string;
    30: string;
    7: string;
    1: string;
  };
  extra?: any; // TODO is migration still supported?

  static Merge(investments: Investment[]): Investment {
    const mergeAssetPriceDetail = (a: AssetPriceDetail[]): AssetPriceDetail => {
      return {
        name: a[0].name,
        price: weightedMean(a.map(x => x.price), a.map(x => x.amount)),
        amount: a.reduce((rv, x) => {
          return rv.plus(x.amount);
        }, new BigNumber(0)),
        currency: a[0].currency,
      };
    };
    const assetReduce = (assetArr: AssetPriceDetail[][], callbackfn: ((asset: AssetPriceDetail[]) => AssetPriceDetail)) => {
      return assetArr[0].map((asset, index) => callbackfn(assetArr.map(x => x[index])));
    };
    const sumAmount = (a: AssetPriceDetail[]): AssetPriceDetail => {
      return {
        name: a[0].name,
        price: a[0].price,
        amount: a.reduce((rv, x) => rv.plus(x.amount), new BigNumber(0)),
        currency: a[0].currency,
      };
    };

    const value = {
      current: assetReduce(investments.map(x => x.value.current), mergeAssetPriceDetail),
      initial: assetReduce(investments.map(x => x.value.initial), mergeAssetPriceDetail),
    };
    const profitAll = assetReduce(investments.map(x => x.profitAll), sumAmount);
    const profitDaily = assetReduce(investments.map(x => x.profitDaily), sumAmount);
    return {
      id: investments[0].id,
      platform: investments[0].platform,
      name: investments[0].name,
      shares: investments.reduce((rv, x) => rv.plus(x.shares), new BigNumber(0)),
      transaction: investments.reduce(
        (rv, x) => {
          if (rv.blockNumber < x.transaction.blockNumber) {
            return rv;
          }
          return x.transaction;
        },
        investments[0].transaction),
      value,
      logo: investments[0].logo,
      profitAll,
      profitDaily,
      roi: profitAll[profitAll.length - 1].amount.div(value.initial[value.initial.length - 1].amount).toString(10),
      roiDaily: profitDaily[profitDaily.length - 1].amount
        .div(value.initial[value.initial.length - 1].amount)
        .toString(10),
      apy: {
        ...investments[0].apy,
        position: weightedMean(investments.map(x => new BigNumber(x.apy.position)), investments.map(x => x.shares)).toFormat(4)
      },
      extra: investments[0].extra, // TODO is migration still supported?
    };
  }
}

export class InvestmentCompleted extends Investment{
  transactionEntry: Transaction;
}

export class ServiceData {
  ongoing: Investment[] = [];
  completed: InvestmentCompleted[] = [];
}

export interface IInvestmentSource {
  fetchAll(wallets: string[]): Observable<ServiceData>;
}

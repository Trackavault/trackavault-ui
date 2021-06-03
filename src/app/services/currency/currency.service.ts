import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import currencies from '@src/assets/currencies.json';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay} from 'rxjs/operators';
import BigNumber from 'bignumber.js';

export interface ICurrency {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  name_plural: string;
}

export interface Rates {
  CAD: number;
  HKD: number;
  ISK: number;
  PHP: number;
  DKK: number;
  HUF: number;
  CZK: number;
  AUD: number;
  RON: number;
  SEK: number;
  IDR: number;
  INR: number;
  BRL: number;
  RUB: number;
  HRK: number;
  JPY: number;
  THB: number;
  CHF: number;
  SGD: number;
  PLN: number;
  BGN: number;
  TRY: number;
  CNY: number;
  NOK: number;
  NZD: number;
  ZAR: number;
  USD: number;
  MXN: number;
  ILS: number;
  GBP: number;
  KRW: number;
  MYR: number;
}

export interface CurrencyRates {
  rates: Rates;
  base: string;
  date: string;
}

export interface ICurrencyValue {
  amount: BigNumber;
  currency: string;
}

export class CurrencyValue implements ICurrencyValue {
  amount: BigNumber;
  currency: string;

  constructor(inAmount: BigNumber.Value, inCurrency: string) {
    this.amount = new BigNumber(inAmount);
    this.currency = inCurrency;
  }
}

export const memoize = fn => {
  let cache = {};
  let cacheCreationDate = new Date().getTime();

  const memoizedFunction = (...args) => {
    if (Date.now() - cacheCreationDate > 1000 * 60 * 60) {
      cache = {};
      cacheCreationDate = new Date().getTime();
    }
    const cacheKey = JSON.stringify(args);

    if (typeof cache[cacheKey] === 'undefined') {
      const result = fn(...args).pipe(shareReplay());
      cache[cacheKey] = result;
      return result;
    }
    else {
      return cache[cacheKey];
    }
  };
  return memoizedFunction;
};

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  currencySource: BehaviorSubject<ICurrency> = new BehaviorSubject(currencies.USD);
  public getRate: (arg0: string, arg1: string) => Observable<number>;

  constructor(private http: HttpClient) {
    const cachedCurrencyCode = localStorage.getItem('currency');
    if (cachedCurrencyCode) {
      this.setCurrency(cachedCurrencyCode);
    }

    this.getRate = memoize(this._getRate.bind(this));
  }

  setCurrency(code: string): void {
    if (currencies[code]) {
      this.currencySource.next(currencies[code]);
      localStorage.setItem('currency', code);
    }
  }

  getAllCurrencies(): string[] {
    return Object.keys(currencies);
  }

  private _getRate(from: string, to): Observable<number> {
    if (from === to) {
      return of(1);
    }
    return this.http.get(`https://min-api.cryptocompare.com/data/price?fsym=${from}&tsyms=${to}`)
      .pipe(
        map(result => {
          return result[to];
        })
      );
  }

  convert(from: ICurrencyValue, toCurrency: string): Observable<BigNumber> {
    if (from.currency === toCurrency) {
      return of(from.amount);
    }
    return this.getRate(from.currency, toCurrency)
      .pipe(map(conversionRate => new BigNumber(from.amount).times(conversionRate)));
  }
}

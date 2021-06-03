import {Injectable, OnDestroy} from '@angular/core';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, Observable, ReplaySubject, Subscription} from 'rxjs';
import {Investment, InvestmentCompleted, ServiceData} from '@src/app/services/sources/investment.source.types';
import {SettingsService} from '@src/app/services/settings/settings.service';
import {ApiService} from '@src/app/services/api/api.service';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import {toChecksumAddress} from 'web3-utils';
import {AssetPositionCompletedExtended, AssetPositionExtended, DailyPriceResponse} from '@src/app/services/api/api.service.types';
import {calcAPY, calcAssetValue} from '@src/app/utils/math';

@Injectable({
  providedIn: 'root'
})
export class InvestmentSourcesService implements OnDestroy {
  private walletsCache: string[] = [];
  private fetchAll$: ReplaySubject<ServiceData>;
  private sub: Subscription;

  constructor(private settings: SettingsService,
              private api: ApiService) {
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  fetchAll(wallets: string[] = []): Observable<ServiceData> {
    const walletsToUse = wallets.length !== 0 ? wallets : this.settings.settings.value.ethereumWallets;
    if (JSON.stringify(walletsToUse) !== JSON.stringify(this.walletsCache)) {
      this.walletsCache = walletsToUse;
      this.fetchAll$ = new ReplaySubject<ServiceData>();
      this.sub = this.fetchAllInternal(walletsToUse).subscribe(serviceData => this.fetchAll$.next(serviceData));
    }
    return this.fetchAll$;
  }

  getDailyPrices(investments: Investment[]): Observable<DailyPriceResponse[]> {
    return this.api.GetDailyPrices(investments.map(x => ({id: x.id, blockNumber: x.transaction.blockNumber})));
  }

  private fetchAllInternal(wallets: string[]): Observable<ServiceData> {
    return combineLatest([
      this.settings.wallets,
      this.settings.ignoreDust,
    ]).pipe(
      switchMap(([settingsWallets, ignoreDust]) => {
        const walletsUsed = wallets.length !== 0 ? wallets : settingsWallets;

        const DetailPosition = (position: AssetPositionExtended|AssetPositionCompletedExtended) => {
          const baseCurrency = position.value.current.chain[0].name;
          const currentValue = calcAssetValue(position.value.current, new BigNumber(position.shares), position.shareToken);
          const initialValue = calcAssetValue(position.value.initial, new BigNumber(position.shares), position.shareToken);
          if (ignoreDust && initialValue[0].amount.lte('10e-18')) {
            return;
          }
          const profits = currentValue.map((value, index) => {
            return ({
              ...value,
              amount: value.amount.minus(initialValue[index].amount)
            });
          });
          const numDays = position.transactionEntry
            ? moment.utc(position.transaction.timestamp, 'X').diff(moment.utc(position.transactionEntry.timestamp, 'X'), 'days') || 1
            : moment().utc().diff(moment.utc(position.transaction.timestamp, 'X'), 'days') || 1;
          const dailyProfits = profits.map(e => ({
            ...e,
            amount: e.amount.div(numDays)
          }));

          return {
            id: position.id,
            name: position.shareToken.replace(/^yvCurve-|yv/, ''),
            shares: new BigNumber(position.shares),
            transaction: position.transaction,
            value: {
              current: currentValue,
              initial: initialValue,
            },
            logo: position.logo,
            profitAll: profits,
            profitDaily: dailyProfits,
            roi: profits[profits.length - 1].amount.div(initialValue[initialValue.length - 1].amount).toString(10),
            roiDaily: dailyProfits[dailyProfits.length - 1].amount.div(initialValue[initialValue.length - 1].amount).toString(10),
            apy: 'apy' in position ? position.apy : null
          };
        };
        const DetailCompletedPosition = (position: AssetPositionCompletedExtended) => {
          const detailedPosition = DetailPosition(position);
          return {
            ...detailedPosition,
            transactionEntry: position.transactionEntry
          } as InvestmentCompleted;
        };

        return this.api.GetDefi(walletsUsed).pipe(
          map(history => {
            const adaptersHistory = history.map(adapterHistory => {
              return {
                ongoing: adapterHistory.ongoing.map((position: AssetPositionExtended) => DetailPosition(position)),
                completed: adapterHistory.completed.map((position: AssetPositionCompletedExtended) => DetailCompletedPosition(position))
              };
            });
            return {
              ongoing: adaptersHistory.flatMap(x => x.ongoing ? x.ongoing : []).filter(x => x),
              completed: adaptersHistory.flatMap(x => x.completed ? x.completed : []).filter(x => x),
            };
          })
        );
      })
    );
  }

  public mergeInvestments(investments: Investment[]): Investment[] {
    const investmentsById = Array.from(Object.values(investments.reduce((rv, x) => {
      (rv[x.id] = rv[x.id] || []).push(x);
      return rv;
    }, {}))) as Investment[][];
    return investmentsById.map(g => Investment.Merge(g));
  }
}

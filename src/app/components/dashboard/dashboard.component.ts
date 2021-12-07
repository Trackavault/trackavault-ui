import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {combineLatest, forkJoin, Observable, pipe, Subject} from 'rxjs';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {map, shareReplay, switchMap, takeUntil} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SettingsService} from '@src/app/services/settings/settings.service';
import {InvestmentSourcesService} from '@src/app/services/sources/investmentSources.service';
import {ActivatedRoute} from '@angular/router';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {isAddress} from 'web3-utils';
import {Investment, ServiceData} from '@src/app/services/sources/investment.source.types';
import {CurrencyService, CurrencyValue, ICurrencyValue} from '@src/app/services/currency/currency.service';
import BigNumber from 'bignumber.js';
import {calcAPY, calcAssetValue} from '@src/app/utils/math';
import {ApiService} from '@src/app/services/api/api.service';
import moment from 'moment';
import {DailyPriceResponse} from '@src/app/services/api/api.service.types';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('ongoing') table!: MatTable<Investment>;
  @ViewChild('ongoingSort') sort!: MatSort;
  dataSource: MatTableDataSource<Investment>;
  displayedColumns: string[];
  expandedElement: any | null;
  // tslint:disable-next-line:max-line-length
  allPositionsData$: Observable<ServiceData>;

  loadingData: boolean;
  noWallets = false;

  private notifier = new Subject();
  cards: any[];
  cards1: any[];
  cards2: any[];
  isHandset$: Observable<boolean>;
  dailyBalanceChart$: Observable<{ x: number; y: number }[]>;
  dailyProfitsChart$: Observable<{ label: string, data: { x: number; y: number }[]}[]>;

  constructor(private ref: ChangeDetectorRef,
              private currencyService: CurrencyService,
              private investmentSources: InvestmentSourcesService,
              private apiService: ApiService,
              private settings: SettingsService,
              private breakpointObserver: BreakpointObserver,
              private snackBar: MatSnackBar,
              private route: ActivatedRoute) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.HandsetPortrait)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );

    this.dataSource = new MatTableDataSource();
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'value':
          return item.value.current[0].amount.times(item.value.current[0].price).toNumber();
        case 'valueInitial':
          return item.value.initial[0].amount.times(item.value.initial[0].price).toNumber();
        case 'logo':
          return item.name;
        case 'profitAll': // TODO
          return item.profitAll[0].amount.times(item.profitAll[0].price).toNumber();
        case 'profitDaily': // TODO
          return item.profitDaily[0].amount.times(item.profitDaily[0].price).toNumber();
        case 'roi':
          return item.roi;
        case 'APY':
          return item.apy.position;
      }
    };
  }

  ngOnInit(): void {
    this.loadingData = true;
    this.isHandset$.pipe(takeUntil(this.notifier)).subscribe(isHandset => {
      this.displayedColumns = isHandset
        ? ['logo', 'profitAll', 'APY']
        : ['logo', 'valueInitial', 'value', 'profitAll', 'roi', 'profitDaily', 'APY'];
    });

    this.route.queryParams.subscribe(params => {
      const walletsParam = params.wallets ? params.wallets.split(',').filter(w => isAddress(w)) : [];
      // remove duplicates
      const wallets = [...new Set(walletsParam as string[])];
      this.noWallets = wallets.length === 0 && this.settings.settings.value.ethereumWallets.length === 0;
      this.allPositionsData$ = this.investmentSources.fetchAll(wallets);
      this.allPositionsData$.pipe(takeUntil(this.notifier)).subscribe((serviceData) => {
          this.loadingData = false;
          this.ref.detectChanges();
          this.dataSource.sort = this.sort;
          this.dataSource.data = this.settings.settings.value.groupInvestments
            ? this.investmentSources.mergeInvestments(serviceData.ongoing)
            : serviceData.ongoing;
          this.table.dataSource = this.dataSource;

          this.dataSource.data.map(x => {
            // @ts-ignore
            x.lineChartData$ = this.apiService.GetStats().pipe(
              map(values => {
                const generateAPYChartData = (asset: DailyPriceResponse, numDays: number) => {
                  const assetData = [];
                  for (let i = 0; i < asset.daily.length; i++) {
                    if (i > numDays - 1) {
                      const assetDailyData = asset.daily[i];
                      const assetDailyValue = calcAssetValue(assetDailyData.price, new BigNumber(1), '');
                      const assetDailyDataOld = asset.daily[i - numDays];
                      const assetDailyDataOldValue = calcAssetValue(assetDailyDataOld.price, new BigNumber(1), '');
                      const apy = calcAPY(assetDailyDataOldValue[assetDailyDataOldValue.length - 1].amount,
                        assetDailyValue[assetDailyValue.length - 1].amount,
                        numDays);
                      assetData.push({
                        x: moment.utc(parseInt(assetDailyData.timestamp, 10) * 1000),
                        y: apy
                      });
                    }
                  }
                  return {
                    // @ts-ignore
                    label: `APY ${numDays}d`,
                    lineTension: 0,
                    interpolate: true,
                    borderWidth: 3,
                    data: assetData,
                  };
                };

                const data = values[0]
                  .filter(asset => asset.id === x.id)
                  .map(asset => {
                    return [3, 7, 30].map(numDays => generateAPYChartData(asset, numDays));
                  });
                this.loadingData = false;
                return data[0];
              })
            );
          });
        },
        (err) => console.error(err)
      );


      const dataWithCurrency = combineLatest([this.allPositionsData$, this.settings.currency]);
      const conversionPipe = pipe(
        switchMap((value: ICurrencyValue) => this.currencyService.convert(value, this.settings.settings.value.currencyCode)),
        map(result => {
          return {
            amount: result,
            currency: this.settings.settings.value.currencyCode
          } as ICurrencyValue;
        })
      );
      const balance$ = dataWithCurrency.pipe(
        map(([serviceData, currencyCode]) => {
          // tslint:disable-next-line:max-line-length
          return new CurrencyValue(serviceData.ongoing.reduce((acc, c) => acc.plus(c.value.current[0].amount.times(c.value.current[0].price)), new BigNumber(0)), 'USD');
        }),
        conversionPipe
      );
      const profits$ = dataWithCurrency.pipe(
        map(([serviceData, currencyCode]) => {
          return new CurrencyValue(serviceData.ongoing
            .reduce((acc, c) => {
              const elem = c.profitAll[c.profitAll.length - 1];
              return acc.plus(elem.amount.times(elem.price));
            }, new BigNumber(0)), 'USD');
        }),
        conversionPipe
      );
      const dailyReturns$ = dataWithCurrency.pipe(
        map(([serviceData, currencyCode]) => {
          return new CurrencyValue(
            serviceData.ongoing
              .reduce((acc, c) => {
                const elem = c.profitDaily[c.profitDaily.length - 1];
                return acc.plus(elem.amount.times(elem.price));
              }, new BigNumber(0)),
            'USD');
        }),
        conversionPipe
      );
      this.dailyBalanceChart$ = dataWithCurrency.pipe(
        switchMap(([serviceData, currencyCode]) => {
          const mergedInvestments = this.investmentSources.mergeInvestments(serviceData.ongoing);
          return forkJoin([this.investmentSources.getDailyPrices(mergedInvestments)]).pipe(
            map(([prices]) => {
              return {
                mergedInvestments,
                prices,
              };
            }),
          );
        }),
        map(({mergedInvestments, prices}) => {
          const investmentsById = mergedInvestments.reduce((rv, x) => ({...rv, [x.id]: x}), {}) as {[key: string]: Investment};
          const dailyBalanceObj = {};
          prices.map(p => {
            p.daily.map(d => {
              const dayValue = dailyBalanceObj[d.timestamp] || new BigNumber(0);
              dailyBalanceObj[d.timestamp] = dayValue.plus(investmentsById[p.id].shares.times(d.price.price));
            });
          });
          const timestamps = Object.keys(dailyBalanceObj);
          return timestamps.map(t => ({
            x: parseInt(t, 10),
            y: dailyBalanceObj[t].toNumber()
          }));
        }),
        switchMap(chartData => {
          return forkJoin([this.currencyService.getRate('USD', this.settings.settings.value.currencyCode)])
            .pipe(
              map(([rate]) => {
                return chartData.map(e => ({
                  x: e.x,
                  y: e.y * rate
                }));
              })
            );
        })
      );
      this.dailyProfitsChart$ = dataWithCurrency.pipe(
        switchMap(([serviceData, currencyCode]) => {
          return forkJoin(serviceData.ongoing.map(x => this.investmentSources.getDailyPrices([x]).pipe(
            map(prices => {
              const initialAmountInBase = x.value.initial[x.value.initial.length - 1].amount;
              const priceBaseCurrent = x.value.current[x.value.current.length - 1].price;
              return {
                label: x.name,
                data: prices[0].daily.map(p => {
                  const value = calcAssetValue(p.price, x.shares, '');
                  const amountBaseAtDate = value[value.length - 1].amount;
                  return {
                    x: parseInt(p.timestamp, 10),
                    y: amountBaseAtDate.minus(initialAmountInBase).times(priceBaseCurrent).toNumber(),
                  };
                })
              };
            }),
            switchMap(chartData => {
              return forkJoin([this.currencyService.getRate('USD', this.settings.settings.value.currencyCode)])
                .pipe(
                  map(([rate]) => {
                    chartData.data = chartData.data.map(e => ({...e, y: e.y * rate}));
                    return chartData;
                  })
                );
            })
          )));
        })
      );

      this.cards = [
        {title: 'Balance', value$: balance$},
        {title: 'Profits', value$: profits$},
        {title: 'Daily', value$: dailyReturns$},
        {title: 'Monthly', value$: dailyReturns$.pipe(map(value => ({...value, amount: value.amount.times(30.5)})))},
        {title: 'Yearly', value$: dailyReturns$.pipe(map(value => ({...value, amount: value.amount.times(365)})))},
      ];

      this.cards1 = [this.cards[0], this.cards[1], this.cards[2]];
      this.cards2 = [this.cards[3], this.cards[4]];
    });
  }

  ngAfterViewInit(): void {
    this.settings.newVersionDetected$.pipe(takeUntil(this.notifier)).subscribe(newVersion => {});
  }

  ngOnDestroy(): void {
    this.allPositionsData$ = undefined;
    this.notifier.next();
    this.notifier.complete();
  }

  onClickElement(element: any): void {
    this.expandedElement = this.expandedElement === element ? null : element;
  }
}

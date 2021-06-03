import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Chart, ChartConfiguration, ChartOptions, ChartType, Plugin} from 'chart.js';
import {SettingsService} from '@src/app/services/settings/settings.service';
import {CurrencyService, ICurrencyValue} from '@src/app/services/currency/currency.service';
import {forkJoin, Observable, Subject} from 'rxjs';
import BigNumber from 'bignumber.js';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import {BaseChartDirective} from 'ng2-charts';
import autocolors from 'chartjs-plugin-autocolors';
import {ServiceData} from '@src/app/services/sources/investment.source.types';

Chart.register(autocolors);

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  public pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };
  public pieChartOptions: ChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: context => context.label + ': ' + context.parsed + '%'
        }
      },
      legend: {
        display: false,
      },
      // @ts-ignore
      crosshair: {
        enabled: false
      },
      autocolors: {
        enabled: true,
        mode: 'data'
      },
    }
  };
  public pieChartPlugins: Plugin[] = [
    autocolors,
  ];
  public pieChartType: ChartType = 'pie';
  private notifier = new Subject();
  private dataObservable$: Observable<any>;
  constructor(private settings: SettingsService,
              private currencyService: CurrencyService) {
  }

  @Input()
  set data(inServiceDataObservable: Observable<ServiceData>) {
    this.dataObservable$ = inServiceDataObservable.pipe(
      takeUntil(this.notifier),
      switchMap((data) => {
        let reduced: {[key: string]: ICurrencyValue} = {};
        reduced = data.ongoing.reduce((acc, current) => {
          const valueInFiat = current.value.current[0].amount.times(current.value.current[0].price);
          if (acc.hasOwnProperty(current.name)) {
            acc[current.name].amount = acc[current.name].amount.plus(valueInFiat);
          } else {
            acc[current.name] = { amount: new BigNumber(valueInFiat), currency: 'USD' };
          }
          return acc;
        }, {});
        return forkJoin(Object.values(reduced).
        map(v => this.currencyService.getRate(v.currency, this.settings.settings.value.currencyCode))).pipe(
          map(rates => {
            const labels = [];
            const allAmountsInCurrency = rates.map((rate, index) => Object.values(reduced)[index].amount.times(rate));
            const total = allAmountsInCurrency.reduce((acc, current) => acc.plus(current));
            const datasetData = Object.keys(reduced).map( (e, index) => {
              labels.push(e);
              return parseFloat(allAmountsInCurrency[index].div(total).times(100).toFormat(2));
            });
            this.pieChartData.labels = labels;
            this.pieChartData.datasets = [{ data: datasetData }];
            this.chart?.update();
          })
        );
      }),
    );
    this.dataObservable$.subscribe(() => {});
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }
}

import {Component, Inject, Input, LOCALE_ID, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {formatCurrency, getCurrencySymbol} from '@angular/common';
import {SettingsService} from '@src/app/services/settings/settings.service';
import {CurrencyService} from '@src/app/services/currency/currency.service';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import moment from 'moment';

@Component({
  selector: 'app-profit-chart',
  templateUrl: './profit-chart.component.html',
  styleUrls: ['./profit-chart.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ProfitChartComponent implements OnInit, OnDestroy {
  public TooltipsCallbacks = {
    label: (tooltipItem: any) => {
      return formatCurrency(tooltipItem.raw.y as number, this.locale, getCurrencySymbol(this.settings.settings.value.currencyCode, 'wide'));
    }
  };
  public lineChartLegend = true;
  private notifier = new Subject();
  private showDaily = false;
  private showDailySub = new BehaviorSubject<boolean>(false);
  public chartData$: any;

  constructor(private settings: SettingsService,
              private currencyService: CurrencyService,
              @Inject(LOCALE_ID) private locale: string) {
  }

  @Input()
  set data(data: Observable<{ label: string, data: { x: number; y: number }[]}[]>) {
    if (!data) { return; }
    this.chartData$ = combineLatest([data, this.settings.settings, this.showDailySub]).pipe(
      takeUntil(this.notifier),
      map(([rawData]) => {
        return rawData.map(e => {
          return {
            label: e.label,
            data: e.data
              .sort((a, b) => a.x - b.x)
              .map(x => ({
                x: moment.utc(x.x * 1000), // uses milliseconds timestamp
                y: x.y
              }))
              .map((x, idx) => {
                if (this.showDaily) {
                  return {
                    x: x.x,
                    y: idx !== 0 ? x.y - e.data[idx - 1].y : 0,
                  };
                } else {
                  return x;
                }
              }),
            lineTension: 0,
            interpolate: true,
            borderWidth: 3,
          };
        });
      })
    );
  }
  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  toggleDaily(): void {
    this.showDaily = !this.showDaily;
    this.showDailySub.next(this.showDaily);
  }
}


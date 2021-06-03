import {Component, Inject, Input, LOCALE_ID} from '@angular/core';
import {formatCurrency, getCurrencySymbol} from '@angular/common';
import {SettingsService} from '@src/app/services/settings/settings.service';
import {CurrencyService} from '@src/app/services/currency/currency.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import moment from 'moment';

@Component({
  selector: 'app-balance-chart',
  templateUrl: './balance-chart.component.html',
  styleUrls: ['./balance-chart.component.css'],
})
export class BalanceChartComponent {
  public TooltipsCallbacks = {
    label: (tooltipItem: any) => {
      return formatCurrency(tooltipItem.raw.y as number, this.locale, getCurrencySymbol(this.settings.settings.value.currencyCode, 'wide'));
    }
  };
  public rawDataObservable$;

  constructor(private settings: SettingsService,
              private currencyService: CurrencyService,
              @Inject(LOCALE_ID) private locale: string) {
  }

  @Input()
  set data(data: Observable<{ x: number; y: number }[]>) {
    this.rawDataObservable$ = data?.pipe(
      map(rawData => {
        const formattedData = rawData
          .sort((a, b) => a.x - b.x)
          .map(x => ({
            x: moment.utc(x.x * 1000), // uses milliseconds timestamp
            y: x.y
          }));
        return [{
          label: 'Balance',
          data: formattedData,
          lineTension: 0,
          interpolate: true,
          borderWidth: 3
        }];
      })
    );
  }
}

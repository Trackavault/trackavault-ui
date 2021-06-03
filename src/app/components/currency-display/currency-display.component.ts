import {Component, Input, OnInit} from '@angular/core';
import {CurrencyService, ICurrencyValue} from '@src/app/services/currency/currency.service';
import {SettingsService} from '@src/app/services/settings/settings.service';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-currency-display',
  templateUrl: './currency-display.component.html',
  styleUrls: ['./currency-display.component.css']
})
export class CurrencyDisplayComponent implements OnInit {
  _item: ICurrencyValue;
  _converted: ICurrencyValue;
  private _loadingConversion: boolean;

  @Input()
  set item(val: ICurrencyValue) {
    this._item = val;
    this._loadingConversion = true;
    this.convert();
  }

  constructor(private settings: SettingsService,
              private currencyService: CurrencyService) {
    this._item = {amount: new BigNumber(0), currency: 'USD'};
    this._converted = {amount: new BigNumber(0), currency: 'USD'};
  }

  ngOnInit(): void {
    this.settings.settings.subscribe(val => this.convert());
  }

  convert(): void {
    if (this._item.amount.gt(0)
      && !this._item.amount.isNaN()
      && this._item.amount.isFinite()
      && this._item.currency !== this.settings.settings.value.currencyCode) {
      this.currencyService.getRate(this._item.currency, this.settings.settings.value.currencyCode)
        .subscribe(conversionRate => {
          this._converted.amount = this._item.amount.times(conversionRate);
          this._converted.currency = this.settings.settings.value.currencyCode;
          this._loadingConversion = false;
        });
    }
    else {
      this._converted = Object.assign({}, this._item);
    }
  }
}

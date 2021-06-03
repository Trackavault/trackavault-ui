import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatSelectChange} from '@angular/material/select';
import {CurrencyService} from '@src/app/services/currency/currency.service';
import {Subscription} from 'rxjs';
import {ISettings, SettingsService} from '@src/app/services/settings/settings.service';

@Component({
  selector: 'app-currency-selection',
  templateUrl: './currency-selection.component.html',
  styleUrls: ['./currency-selection.component.css']
})
export class CurrencySelectionComponent implements OnInit, OnDestroy {
  private userSettings: ISettings;
  private userSettingsSubscription: Subscription;

  selectedCurrency: string;
  possibleCurrencies: any[];

  constructor(private currencyService: CurrencyService, private settingsService: SettingsService) {
    this.possibleCurrencies = [];
    for (const currency of currencyService.getAllCurrencies()) {
      this.possibleCurrencies.push(
        {value: currency, viewValue: currency}
      );
    }
    this.selectedCurrency = this.possibleCurrencies[0].value;
  }

  ngOnInit(): void {
    this.userSettingsSubscription = this.settingsService.settings.subscribe(
      settings => {
        this.userSettings = settings;
        this.selectedCurrency = this.userSettings.currencyCode;
      });
  }

  ngOnDestroy(): void {
    this.userSettingsSubscription.unsubscribe();
  }

  onSelect($event: MatSelectChange): void {
    this.settingsService.setCurrency($event.value);
  }
}

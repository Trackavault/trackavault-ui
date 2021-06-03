import {AfterContentInit, Component, Input, OnInit} from '@angular/core';
import {CurrencyService} from '@src/app/services/currency/currency.service';
import {SettingsService} from '@src/app/services/settings/settings.service';
import BigNumber from 'bignumber.js';
import {TooltipOptions} from 'ng2-tooltip-directive';
import {AssetPriceDetail} from '@src/app/services/sources/investment.source.types';

@Component({
  selector: 'app-asset-display',
  templateUrl: './asset-display.component.html',
  styleUrls: ['./asset-display.component.css']
})
export class AssetDisplayComponent implements AfterContentInit, OnInit {
  @Input() asset: AssetPriceDetail[];
  @Input() skipFirst: boolean;
  assetsToDisplay: AssetPriceDetail[];

  tooltipOptions: TooltipOptions = {
    'max-width': 300,
    'hide-delay': 50,
  };

  baseAsset: AssetPriceDetail;
  fiatPrice: BigNumber;
  fiatCurrency: string;

  fiatPriceConverted: BigNumber;
  targetFiatCurrency: string;

  constructor(private settings: SettingsService,
              private currencyService: CurrencyService) {
  }

  ngOnInit(): void {
  }

  ngAfterContentInit(): void {
    this.baseAsset = this.asset[this.asset.length - 1];
    this.fiatPrice = this.baseAsset.amount.times(this.baseAsset.price);
    this.fiatCurrency = this.baseAsset.currency;
    this.settings.settings.subscribe(val => this.convert());
    this.assetsToDisplay = this.skipFirst ? this.asset.slice(1) : this.asset;
  }

  convert(): void {
    if (this.fiatPrice
      && this.fiatPrice.gt(0)
      && !this.fiatPrice.isNaN()
      && this.fiatPrice.isFinite()) {
      if (this.fiatCurrency !== this.settings.settings.value.currencyCode) {
        this.currencyService.getRate(this.fiatCurrency, this.settings.settings.value.currencyCode)
          .subscribe(conversionRate => {
            this.fiatPriceConverted = this.fiatPrice.times(conversionRate);
            this.targetFiatCurrency = this.settings.settings.value.currencyCode;
          });
      } else {
        this.fiatPriceConverted = this.fiatPrice;
        this.targetFiatCurrency = this.fiatCurrency;
      }
    }
  }
}

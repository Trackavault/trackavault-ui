import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import currencies from '@src/assets/currencies.json';
import versionCompare from '@src/app/utils/version-compare';
import {environment} from '@src/environments/environment';

export interface ISettings{
  ethereumWallets: string[];
  currencyCode: string;
  lastVersion: string;
  groupInvestments: boolean;
  ignoreDust: boolean;
  experimental: boolean;
  lastInstallPrompt: number;
}

const defaultSettings: ISettings = {
  ethereumWallets: [],
  currencyCode: 'USD',
  lastVersion: '0.0.0',
  groupInvestments: true,
  ignoreDust: true,
  experimental: false,
  lastInstallPrompt: 0,
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // tslint:disable-next-line:variable-name
  private readonly _settings: BehaviorSubject<ISettings>;
  // tslint:disable-next-line:variable-name
  private readonly _currency: BehaviorSubject<string>;
  // tslint:disable-next-line:variable-name
  private readonly _wallets: BehaviorSubject<string[]>;
  // tslint:disable-next-line:variable-name
  private readonly _groupInvestments: BehaviorSubject<boolean>;
  // tslint:disable-next-line:variable-name
  private readonly ignoreDust$: BehaviorSubject<boolean>;
  newVersionDetected$: BehaviorSubject<boolean>;

  constructor() {
    const savedSettings = SettingsService.loadSettings();
    this.newVersionDetected$ = new BehaviorSubject<boolean>(versionCompare(savedSettings.lastVersion, environment.appVersion) < 0);
    this._settings = new BehaviorSubject(savedSettings);
    this._currency = new BehaviorSubject(savedSettings.currencyCode);
    this._wallets = new BehaviorSubject<string[]>(savedSettings.ethereumWallets);
    this._groupInvestments = new BehaviorSubject<boolean>(savedSettings.groupInvestments);
    this.ignoreDust$ = new BehaviorSubject<boolean>(savedSettings.ignoreDust);

    // Update version number
    savedSettings.lastVersion = environment.appVersion;
    this.saveSettings(savedSettings);
  }

  get settings(): BehaviorSubject<ISettings> {
    return this._settings;
  }

  get currency(): BehaviorSubject<string> {
    return this._currency;
  }

  get wallets(): BehaviorSubject<string[]> {
    return this._wallets;
  }

  get groupInvestments(): BehaviorSubject<boolean> {
    return this._groupInvestments;
  }

  get ignoreDust(): BehaviorSubject<boolean> {
    return this.ignoreDust$;
  }

  private static loadSettings(): ISettings|undefined {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      return {
        ...defaultSettings,
        ...JSON.parse(savedSettings)
      };
    }
    return defaultSettings;
  }

  private saveSettings(newSettings: ISettings): void {
    localStorage.setItem('settings', JSON.stringify(newSettings));
    this._settings.next(newSettings);
  }

  addEthereumWallet(walletAddress: string): void {
    const newWalletAddress = walletAddress.toLowerCase();
    const newSettings = this._settings.value;
    if (newSettings.ethereumWallets.indexOf(newWalletAddress) === -1) {
      newSettings.ethereumWallets.push(newWalletAddress);
      this.saveSettings(newSettings);
      this._wallets.next(newSettings.ethereumWallets);
    }
  }

  removeEthereumWallet(walletAddress: string): void {
    const newSettings = this._settings.value;
    newSettings.ethereumWallets = newSettings.ethereumWallets.filter((value) => value !== walletAddress);
    this.saveSettings(newSettings);
    this._wallets.next(newSettings.ethereumWallets);
  }

  setCurrency(code: string): void {
    if (currencies[code]) {
      const newSettings = this._settings.value;
      newSettings.currencyCode = code;
      this.saveSettings(newSettings);
      this._currency.next(code);
    }
  }

  setGroupInvestments(shouldGroup: boolean): void {
    const newSettings = this._settings.value;
    newSettings.groupInvestments = shouldGroup;
    this.saveSettings(newSettings);
    this._groupInvestments.next(newSettings.groupInvestments);
  }

  setExperimental(newValue: boolean): void {
    const newSettings = this._settings.value;
    newSettings.experimental = newValue;
    this.saveSettings(newSettings);
  }

  toggleExperimental(): void {
    const settings = this._settings.value;
    this.setExperimental(!settings.experimental);
  }

  setIgnoreDust(shouldIgnore: boolean): void {
    const newSettings = this._settings.value;
    newSettings.ignoreDust = shouldIgnore;
    this.saveSettings(newSettings);
    this.ignoreDust$.next(newSettings.ignoreDust);
  }

  setLastInstallPrompt(): void {
    const settings = this._settings.value;
    settings.lastInstallPrompt = Date.now();
    this.saveSettings(settings);
  }
}

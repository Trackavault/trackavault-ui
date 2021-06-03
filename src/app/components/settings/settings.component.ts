import {Component, OnInit} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ISettings, SettingsService} from '@src/app/services/settings/settings.service';
import {isAddress} from 'web3-utils';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings$: BehaviorSubject<ISettings>;
  newWallet: string;

  constructor(private settingsService: SettingsService) {
    this.settings$ = this.settingsService.settings;
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (isAddress(this.newWallet)) {
      this.settingsService.addEthereumWallet(this.newWallet);
      this.newWallet = '';
    }
    else {
      console.warn(`Failed to add wallet, invalid address: ${this.newWallet}`);
    }
  }

  deleteWallet(wallet: string): void {
    this.settingsService.removeEthereumWallet(wallet);
  }

  setExperimental(checked: boolean): void {
    this.settingsService.setExperimental(checked);
  }

  setGroupInvestments(checked: boolean): void {
    this.settingsService.setGroupInvestments(checked);
  }

  setIgnoreDust(checked: boolean): void {
    this.settingsService.setIgnoreDust(checked);
  }
}

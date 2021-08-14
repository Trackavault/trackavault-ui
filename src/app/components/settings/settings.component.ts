import {Component, OnInit} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ISettings, SettingsService} from '@src/app/services/settings/settings.service';
import {isAddress} from 'web3-utils';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings$: BehaviorSubject<ISettings>;
  newWallet: string;

  constructor(
    private readonly snackbar: MatSnackBar,
    private readonly clipboard: Clipboard,
    private settingsService: SettingsService) {
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

  copyLink(wallet: string): void {
    const fullUrl = location.origin + '/?wallets=' + wallet;

    if (this.clipboard.copy(fullUrl)) {
      this.snackbar.open('Link copied', '', {duration: 2500});
    } else {
      this.snackbar.open('Link copy failed. Please try again!', '', {duration: 2500});
    }
  }
}

import {Injectable} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {Platform} from '@angular/cdk/platform';
import {timer} from 'rxjs';
import {take} from 'rxjs/operators';
import {PwaPromptComponent} from '@src/app/components/pwa-prompt/pwa-prompt.component';
import {SettingsService} from '@src/app/services/settings/settings.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any;

  constructor(
    private bottomSheet: MatBottomSheet,
    private platform: Platform,
    private settings: SettingsService
  ) { }

  public initPwaPrompt(): void {
    const ttl = 30 * 24 * 60 * 60 * 1000;
    if (this.settings.settings.value.lastInstallPrompt < Date.now() - ttl) {
      this.settings.setLastInstallPrompt();
      // if (this.platform.ANDROID) {
      //   window.addEventListener('beforeinstallprompt', (event: any) => {
      //     event.preventDefault();
      //     this.promptEvent = event;
      //     this.openPromptComponent('android');
      //   });
      // }
      if (this.platform.IOS) {
        // @ts-ignore
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
        if (!isInStandaloneMode) {
          this.openPromptComponent('ios');
        }
      }
    }
  }

  private openPromptComponent(mobileType: 'ios' | 'android'): void {
    timer(3000)
      .pipe(take(1))
      .subscribe(() => this.bottomSheet.open(PwaPromptComponent, { data: { mobileType, promptEvent: this.promptEvent } }));
  }
}

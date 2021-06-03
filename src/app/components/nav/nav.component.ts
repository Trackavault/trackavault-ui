import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {SettingsService} from '@src/app/services/settings/settings.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements AfterViewInit, OnDestroy {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  showExperimental = false;

  menuItems = [
    {
      link: 'home',
      icon: 'dashboard',
    },
    {
      link: 'history',
      icon: 'history',
    },
    {
      link: 'stats',
      icon: 'auto_graph',
    },
    // {
    //   link: 'stats',
    //   icon: 'insights',
    //   isExperimental: true,
    // },
    {
      link: 'settings',
      icon: 'settings',
    }
  ];
  menuItemsExperimental = [];
  widget: any;

  constructor(private breakpointObserver: BreakpointObserver,
              private settings: SettingsService) {
    settings.settings.subscribe(value => {
      this.showExperimental = value.experimental;
    });
  }

  ngAfterViewInit(): void {
    (window as any).Frill_Config = {
      selector: '.frill-container',
      token: '7ff83b37-23b4-4765-9526-c841efe7cbba', // This is your company public token
      position: 'fixed',
      offset: [0, 10],
      callbacks: {
        onReady(frillWidget): void {
          this.widget = frillWidget;
        },
      },
    };
    if ('Frill' in window) {
      this.widget = (window as any).Frill.widget((window as any).Frill_Config);
    }
  }

  ngOnDestroy(): void {
    this.widget?.destroy();
  }


}

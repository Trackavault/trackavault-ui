import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from '@src/app/app.component';
import {AppRoutingModule} from '@src/app/app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {LayoutModule} from '@angular/cdk/layout';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatMenuModule} from '@angular/material/menu';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatInputModule} from '@angular/material/input';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatCheckboxModule} from '@angular/material/checkbox';

import {CurrencySelectionComponent} from '@src/app/components/currency-selection/currency-selection.component';
import {NavComponent} from '@src/app/components/nav/nav.component';
import {CurrencyDisplayComponent} from '@src/app/components/currency-display/currency-display.component';
import {SettingsComponent} from '@src/app/components/settings/settings.component';
import {DashboardComponent} from '@src/app/components/dashboard/dashboard.component';
import {StatsComponent} from '@src/app/components/stats/stats.component';
import {ProfitChartComponent} from '@src/app/components/charts/profit-chart/profit-chart.component';
import {TipJarComponent} from '@src/app/components/tip-jar/tip-jar.component';
import {PieChartComponent} from '@src/app/components/charts/pie-chart/pie-chart.component';
import {BalanceChartComponent} from '@src/app/components/charts/balance-chart/balance-chart.component';
import {SnackBarUpdateComponent} from '@src/app/components/snack-bar-update/snack-bar-update.component';
import {LineChartComponent} from '@src/app/components/charts/line-chart/line-chart.component';

import {CacheInterceptor} from '@src/app/utils/cache.interceptor';

import {AngularFireModule} from '@angular/fire';
import {
  AngularFireAnalyticsModule,
  APP_NAME,
  APP_VERSION,
  CONFIG,
  DEBUG_MODE,
  ScreenTrackingService,
  UserTrackingService
} from '@angular/fire/analytics';
import {environment} from '@src/environments/environment';
import {FooterComponent} from '@src/app/components/footer/footer.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {LoadingSpinnerComponent} from '@src/app/components/loading-spinner/loading-spinner.component';
import {SERVICE_WORKER} from '@angular/fire/messaging';
import {ChartsModule} from 'ng2-charts';
import {HistoryComponent} from '@src/app/components/history/history.component';
import {PwaPromptComponent} from '@src/app/components/pwa-prompt/pwa-prompt.component';
import {PwaService} from '@src/app/services/pwa.service';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {AssetDisplayComponent} from '@src/app/components/asset-display/asset-display.component';
import {TooltipModule} from 'ng2-tooltip-directive';
import {MatTooltipModule} from '@angular/material/tooltip';

const initializer = (pwaService: PwaService) => () => pwaService.initPwaPrompt();

@NgModule({
    declarations: [
      AppComponent,
      NavComponent,
      CurrencySelectionComponent,
      CurrencyDisplayComponent,
      SettingsComponent,
      DashboardComponent,
      HistoryComponent,
      FooterComponent,
      LoadingSpinnerComponent,
      StatsComponent,
      ProfitChartComponent,
      TipJarComponent,
      PieChartComponent,
      BalanceChartComponent,
      SnackBarUpdateComponent,
      LineChartComponent,
      PwaPromptComponent,
      AssetDisplayComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        environment.production ? AngularFireModule.initializeApp(environment.firebase) : [],
        environment.production ? AngularFireAnalyticsModule : [],
        AppRoutingModule,
        LayoutModule,
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        RouterModule,
        MatGridListModule,
        MatCardModule,
        MatMenuModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatProgressSpinnerModule,
        HttpClientModule,
        MatSelectModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
        MatSnackBarModule,
        MatCheckboxModule,
        ChartsModule,
        MatBottomSheetModule,
        TooltipModule,
        MatTooltipModule
    ],
  providers: [
    {
      provide: APP_INITIALIZER, useFactory: initializer, deps: [PwaService], multi: true},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    },
    environment.production ? ScreenTrackingService : [],
    environment.production ? UserTrackingService : [],

    { provide: CONFIG, useValue: {
        send_page_view: true,
        allow_ad_personalization_signals: false,
        anonymize_ip: true
      }
    },
    { provide: DEBUG_MODE, useValue: !environment.production },
    { provide: APP_NAME, useValue: environment.appName },
    { provide: APP_VERSION, useValue: environment.appVersion },
    { provide: SERVICE_WORKER, useFactory: () =>
        (typeof navigator !== 'undefined' && navigator.serviceWorker?.getRegistration()) ?? undefined
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

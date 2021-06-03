import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SettingsComponent} from '@src/app/components/settings/settings.component';
import {DashboardComponent} from '@src/app/components/dashboard/dashboard.component';
import {AboutComponent} from '@src/app/components/about/about.component';
import {StatsComponent} from '@src/app/components/stats/stats.component';
import {TipJarComponent} from '@src/app/components/tip-jar/tip-jar.component';
import {HistoryComponent} from '@src/app/components/history/history.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'home', redirectTo: '' },
  { path: 'history', component: HistoryComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'tip-jar', component: TipJarComponent },
  ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

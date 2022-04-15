import {AfterViewInit, ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {map, shareReplay, takeUntil} from 'rxjs/operators';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {Observable, Subject} from 'rxjs';
import {InvestmentSourcesService} from '@src/app/services/sources/investmentSources.service';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {EPlatform, InvestmentCompleted} from '@src/app/services/sources/investment.source.types';
import moment from 'moment';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements AfterViewInit {
  @ViewChild('completed') tableCompleted!: MatTable<InvestmentCompleted>;
  @ViewChild('completedSort') sortCompleted!: MatSort;
  dataSourceCompleted: MatTableDataSource<InvestmentCompleted>;
  displayedColumnsCompleted: string[];
  loadingData: boolean;
  private notifier = new Subject();
  private isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private ref: ChangeDetectorRef,
              private investmentSources: InvestmentSourcesService,
              private breakpointObserver: BreakpointObserver) {
    this.dataSourceCompleted = new MatTableDataSource<InvestmentCompleted>();
    this.dataSourceCompleted.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'initial':
          return item.value.initial[0].amount.times(item.value.initial[0].price).toNumber();
        case 'exit':
          return item.value.current[0].amount.times(item.value.current[0].price).toNumber();
        case 'profitAll': // TODO
          return item.profitAll[0].amount.times(item.profitAll[0].price).toNumber();
        case 'profitDaily': // TODO
          return item.profitDaily[0].amount.times(item.profitDaily[0].price).toNumber();
        case 'roi':
          return item.roi;
        case 'timestampBegin':
          return item.transactionEntry.timestamp;
        case 'timestampEnd':
          return item.transaction.timestamp;
      }
    };
    this.loadingData = true;
  }

  ngAfterViewInit(): void {
    this.isHandset$.pipe(takeUntil(this.notifier)).subscribe(isHandset => {
      this.displayedColumnsCompleted = isHandset
        ? ['logo', 'profitAll', 'roi']
        : ['logo', 'initial', 'exit', 'profitAll', 'profitDaily', 'roi', 'timestampBegin', 'timestampEnd'];
    });
    this.investmentSources.fetchAll([]).pipe(takeUntil(this.notifier)).subscribe(value => {
        this.loadingData = false;
        this.ref.detectChanges();
        const data = value.completed.map(x => {
          return {
            ...x,
            transaction: {
              ...x.transaction,
              date: moment.utc(x.transaction.timestamp, 'X').local(),
            },
            transactionEntry: {
              ...x.transactionEntry,
              date: moment.utc(x.transactionEntry.timestamp, 'X').local()
            }
          };
        });
        this.dataSourceCompleted.data = data;
        this.dataSourceCompleted.sort = this.sortCompleted;
        this.tableCompleted.dataSource = this.dataSourceCompleted;
      },
      (err) => console.error(err),
      () => console.log('completed'));
  }

  getBlockTrackerUrl(platform: EPlatform): string {
    switch (platform) {
      case EPlatform.Ethereum:
        return 'https://etherscan.io/tx';
      case EPlatform.Fantom:
        return 'https://ftmscan.com/tx';
    }
    return '';
  }
}

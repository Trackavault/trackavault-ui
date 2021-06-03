import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {map} from 'rxjs/operators';
import {LineChartComponent} from '@src/app/components/charts/line-chart/line-chart.component';
import {ApiService} from '@src/app/services/api/api.service';
import {calcAPY, calcAssetValue} from '@src/app/utils/math';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import {of} from 'rxjs';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class StatsComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild(LineChartComponent) LineChart!: LineChartComponent;
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['name', 'apy'];

  public tooltipOptions: any = {
    enabled: false,
    mode: 'index',
    intersect: false,
    external: (args: any) => {
      this.ref.detectChanges();
    }
  };
  loadingData: boolean;

  public lineChartData$;
  private allData: { data: any[]; borderWidth: number; interpolate: boolean; label: string; lineTension: number }[];

  constructor(private ref: ChangeDetectorRef,
              private apiService: ApiService) {
  }

  ngAfterViewInit(): void {
    this.loadingData = true;;
    // this.yearn.getAllStats().subscribe(value => {});
  }

  ngOnInit(): void {
    this.apiService.GetStats().pipe(
      map(values => {
        const data = values[0]
          .filter(asset => asset.daily.length > 7)
          .filter(asset => asset.daily.filter(d => d.price.price === '0').length !== asset.daily.length)
          .map(asset => {
            const assetData = [];
            for (let i = 0; i < asset.daily.length; i++) {
              if (i > 6) {
                const assetDailyData = asset.daily[i];
                const assetDailyValue = calcAssetValue(assetDailyData.price, new BigNumber(1), '');
                const assetDailyData7d = asset.daily[i - 7];
                const assetDailyData7dValue = calcAssetValue(assetDailyData7d.price, new BigNumber(1), '');
                const apy7d = calcAPY(assetDailyData7dValue[assetDailyData7dValue.length - 1].amount,
                  assetDailyValue[assetDailyValue.length - 1].amount,
                  7);
                assetData.push({
                  x: moment.utc(parseInt(assetDailyData.timestamp, 10) * 1000),
                  y: apy7d
                });
              }
            }
            return {
              label: asset.name,
              lineTension: 0,
              interpolate: true,
              borderWidth: 1,
              data: assetData,
            };
          });
        return data.filter(x => x.data.length !== 0);
      })
    ).subscribe(allData => {
      this.loadingData = false;
      this.ref.detectChanges();
      this.allData = allData;
      this.dataSource = new MatTableDataSource();
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'apy':
            return item.apy;
          case 'name':
            return item.name;
        }
      };
      this.dataSource.data = allData.map((x, index) => ({
          name: x.label,
          apy: x.data[x.data.length - 1].y,
          index
        }));
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.table.dataSource = this.dataSource;
    });
  }

  onTooltips(tooltipModel: any): void {

  }

  onRowClicked(index: number): void {
    this.lineChartData$ = of([this.allData[index]]);
    // const NumIndexVisible = this.LineChart.chart.data.datasets.filter((v, idx) => {
    //   return this.LineChart.chart.chart.isDatasetVisible(idx);
    // }).length;
    // const showAll = NumIndexVisible === 1 && this.LineChart.chart.chart.isDatasetVisible(index);
    // this.LineChart.chart.data.datasets.map((v, idx) => {
    //   this.LineChart.chart.chart.setDatasetVisibility(idx, showAll ? true : idx === index);
    // });
    // this.LineChart.chart.update();
  }
}

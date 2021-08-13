import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import moment from 'moment';
import {takeUntil} from 'rxjs/operators';
import {ChartData, ChartOptions, Plugin} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import 'chartjs-adapter-moment';
import autocolors from 'chartjs-plugin-autocolors';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css'],
})
export class LineChartComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  public chartType = 'line';
  public chartData: ChartData<'line', any, string | string[]>;
  public chartPlugins: Plugin<'line'>[] = [
    // crosshairPlugin,
    autocolors
  ];
  public chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 0,
      },
      line: {
        tension: 0,
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        axis: 'x',
        callbacks: {}
      },
      // @ts-ignore
      crosshair: {
        enabled: true,
        line: {
          color: '#3f51b5',
          width: 1
        },
        sync: {
          enabled: false
        },
        zoom: {
          enabled: true,
        },
      },
      autocolors: {
        enabled: true,
      }
    },
    scales: {
      x: {
        type: 'time',
        display: true,
        title: {
          display: false,
        },
        time: {
          tooltipFormat: 'LL',
          unit: 'month',
        },
        ticks: {}
      },
      y: {
        title: {
          display: false,
        },
        ticks: {}
      }
    }
  };
  private notifier = new Subject();
  private currentBounds = '';
  public loadingData = false;
  private extraButtonArgs: { title: string; callback: any };

  @Input()
  set legend(enabled: boolean) {
    this.chartOptions.plugins.legend.display = enabled;
    this.chart?.update();
  }

  @Input()
  set data(data: Observable<any[]>) {
    if (!data) {
      console.warn('Invalid observable');
      return;
    }
    this.loadingData = true;
    data.pipe(takeUntil(this.notifier)).subscribe(result => {
      this.chartData = {
        datasets: result
      };
      if (this.chart) {
        this.chart.chart.data = this.chartData;
        this.updateBounds(this.currentBounds);
      }
      this.loadingData = false;
    });
  }

  @Input()
  set ExtraButton(extraButtonArgs: {title: string, callback: any}) {
    if (extraButtonArgs) {
      this.extraButtonArgs = extraButtonArgs;
    }
  }

  @Input()
  set TooltipsCallbacks(callbacks: any) {
    this.chartOptions.plugins.tooltip.callbacks = callbacks;
    this.chart?.update();
  }

  @Input()
  set TooltipOptions(tooltip: any) {
    this.chartOptions.plugins.tooltip = tooltip;
    this.chart?.update();
  }

  constructor() {
    this.chartData = {
      datasets: []
    };
  }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  getValueBeforeAndAfter(date: moment.Moment, dataset: any): { before: any, after: any; } {
    const data = [...dataset.data];

    // check if value exist
    const exist = data.find(e => date.isSame(e.x));
    if (exist) {
      return {
        before: exist,
        after: exist,
      };
    }

    return {
      after: data.sort((a, b) => a.x.valueOf() - b.x.valueOf()).find(e => e.x.isAfter(date)),
      before: data.sort((a, b) => b.x.valueOf() - a.x.valueOf()).find(e => e.x.isBefore(date))
    };
  }

    updateBounds(interval?: string): void {
    this.currentBounds = interval;
    const now = moment();
    const xMax = moment(now);
    let xMin = null;
    switch (interval) {
      case '1D':
        xMin = now.subtract(1, 'day');
        break;
      case '1W':
        xMin = now.subtract(1, 'week');
        break;
      case '1M':
        xMin = now.subtract(1, 'month');
        break;
      case '1Y':
        xMin = now.subtract(1, 'year');
        break;
      case 'All':
        break;
    }


    const SavedHiddenState = this.chart.chart.data.datasets.map((obj, index) => {
      const meta = this.chart.chart.getDatasetMeta(index);
      return meta.hidden;
    });

    if (xMin) {
      let yMin = Math.min(...this.chartData.datasets.filter((value, index) => !SavedHiddenState[index])
        .map(dataset => Math.min(...dataset.data.map(e => e)
          .filter(e => moment(e.x).isBetween(xMin, xMax, undefined, '[]'))
          .map(e => e.y))));
      let yMax = Math.max(...this.chartData.datasets.filter((value, index) => !SavedHiddenState[index])
        .map(dataset => Math.max(...dataset.data.map(e => e)
          .filter(e => moment(e.x).isBetween(xMin, xMax, undefined, '[]'))
          .map(e => e.y))));

      // try to interpolate all datasets to find yMin/yMax
      this.chartData.datasets.map(dataset => {
        const {after, before} = this.getValueBeforeAndAfter(xMin, dataset);
        if (before) {
          const slope = (after.y - before.y) / (after.x.valueOf() - before.x.valueOf());
          const intercept = after.y - slope * after.x;
          const datasetMin = slope * xMin.valueOf() + intercept;
          if (!yMin || datasetMin < yMin) {
            yMin = datasetMin;
          }
          if (!yMax || datasetMin > yMax) {
            yMax = datasetMin;
          }
        }
      });


      this.chart.chart.options.scales.x.min = xMin.valueOf();
      this.chart.chart.options.scales.x.max = xMax.valueOf();
      this.chart.chart.options.scales.y.min = Math.min(yMin, yMax);
      this.chart.chart.options.scales.y.max = Math.max(yMin, yMax);
    }
    else {
      this.chart.chart.options.scales.x.min = undefined;
      this.chart.chart.options.scales.x.max = undefined;
      this.chart.chart.options.scales.y.min = undefined;
      this.chart.chart.options.scales.y.max = undefined;
    }

    this.chart.chart.data.datasets.map((obj, index) => {
      const meta = this.chart.chart.getDatasetMeta(index);
      meta.hidden = SavedHiddenState[index];
    });
    this.chart?.update();
  }
}

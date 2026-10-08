import {
  Component,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  ElementRef,
  afterNextRender,
  effect,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SalesService, RevenueForecastData } from '../services/sales';
import { ThemeService } from '../services/theme';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-revenue-forecast',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (salesService.revenueForecast(); as forecast) {
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all space-y-5">
        <!-- Header & Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <mat-icon class="text-lg">auto_graph</mat-icon>
              </div>
              <h2 class="text-lg font-bold text-[#14265c] dark:text-white">
                Revenue Forecast &bull; {{ forecast.quarterLabel }}
              </h2>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ordinary Least Squares (OLS) trend analysis projecting sales for the upcoming quarter
            </p>
          </div>

          <!-- Scenario Switcher -->
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 select-none">
              Model:
            </span>
            <button
              type="button"
              (click)="salesService.forecastScenario.set('conservative')"
              [class.bg-white]="salesService.forecastScenario() === 'conservative'"
              [class.dark:bg-slate-700]="salesService.forecastScenario() === 'conservative'"
              [class.text-slate-900]="salesService.forecastScenario() === 'conservative'"
              [class.dark:text-white]="salesService.forecastScenario() === 'conservative'"
              [class.shadow-xs]="salesService.forecastScenario() === 'conservative'"
              [class.text-slate-500]="salesService.forecastScenario() !== 'conservative'"
              [class.dark:text-slate-400]="salesService.forecastScenario() !== 'conservative'"
              class="px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer">
              Conservative
            </button>
            <button
              type="button"
              (click)="salesService.forecastScenario.set('baseline')"
              [class.bg-white]="salesService.forecastScenario() === 'baseline'"
              [class.dark:bg-slate-700]="salesService.forecastScenario() === 'baseline'"
              [class.text-slate-900]="salesService.forecastScenario() === 'baseline'"
              [class.dark:text-white]="salesService.forecastScenario() === 'baseline'"
              [class.shadow-xs]="salesService.forecastScenario() === 'baseline'"
              [class.text-slate-500]="salesService.forecastScenario() !== 'baseline'"
              [class.dark:text-slate-400]="salesService.forecastScenario() !== 'baseline'"
              class="px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer">
              Baseline
            </button>
            <button
              type="button"
              (click)="salesService.forecastScenario.set('optimistic')"
              [class.bg-white]="salesService.forecastScenario() === 'optimistic'"
              [class.dark:bg-slate-700]="salesService.forecastScenario() === 'optimistic'"
              [class.text-slate-900]="salesService.forecastScenario() === 'optimistic'"
              [class.dark:text-white]="salesService.forecastScenario() === 'optimistic'"
              [class.shadow-xs]="salesService.forecastScenario() === 'optimistic'"
              [class.text-slate-500]="salesService.forecastScenario() !== 'optimistic'"
              [class.dark:text-slate-400]="salesService.forecastScenario() !== 'optimistic'"
              class="px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer">
              Optimistic
            </button>
          </div>
        </div>

        <!-- Metric Highlights Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Total Projected Revenue -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Projected {{ forecast.quarterLabel }} Revenue
            </span>
            <div class="text-xl sm:text-2xl font-black text-[#14265c] dark:text-white mt-1">
              {{ formatCurrency(forecast.totalForecast) }}
            </div>
            <div class="flex items-center gap-1.5 mt-1.5 text-[11px]">
              <span
                class="font-bold px-1.5 py-0.5 rounded"
                [class.bg-emerald-100]="forecast.growthPercentage >= 0"
                [class.text-emerald-800]="forecast.growthPercentage >= 0"
                [class.dark:bg-emerald-950]="forecast.growthPercentage >= 0"
                [class.dark:text-emerald-300]="forecast.growthPercentage >= 0"
                [class.bg-rose-100]="forecast.growthPercentage < 0"
                [class.text-rose-800]="forecast.growthPercentage < 0">
                {{ forecast.growthPercentage >= 0 ? '+' : '' }}{{ forecast.growthPercentage }}% QoQ
              </span>
              <span class="text-slate-500 dark:text-slate-400">vs prior 3 mos</span>
            </div>
          </div>

          <!-- Monthly Run Rate -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Monthly Forecast Pace
            </span>
            <div class="text-xl sm:text-2xl font-black text-[#14265c] dark:text-white mt-1">
              {{ formatCurrency(forecast.monthlyAverage) }}
            </div>
            <div class="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <mat-icon class="text-xs text-blue-500">trending_flat</mat-icon>
              <span>Expected per-month run rate</span>
            </div>
          </div>

          <!-- Trend Slope Momentum -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Trend Momentum
            </span>
            <div class="text-xl sm:text-2xl font-black text-[#14265c] dark:text-white mt-1">
              {{ forecast.trendSlope >= 0 ? '+' : '' }}{{ formatCurrency(forecast.trendSlope) }}/mo
            </div>
            <div class="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <mat-icon class="text-xs" [class.text-emerald-500]="forecast.trendSlope >= 0" [class.text-rose-500]="forecast.trendSlope < 0">
                {{ forecast.trendSlope >= 0 ? 'arrow_upward' : 'arrow_downward' }}
              </mat-icon>
              <span>{{ forecast.trendDirection === 'growth' ? 'Upward Trajectory' : forecast.trendDirection === 'decline' ? 'Downward Curve' : 'Stable Trend' }}</span>
            </div>
          </div>

          <!-- Range Bounds -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Confidence Interval (80%)
            </span>
            <div class="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">
              {{ formatCurrency(forecast.forecastMonths[0].lowerBound) }} &ndash; {{ formatCurrency(forecast.forecastMonths[forecast.forecastMonths.length - 1].upperBound) }}
            </div>
            <div class="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <mat-icon class="text-xs text-indigo-500">security</mat-icon>
              <span>Expected variance band</span>
            </div>
          </div>
        </div>

        <!-- Chart Container -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-4 text-xs font-medium">
              <span class="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span class="w-3 h-3 rounded-full bg-[#3b82f6]"></span> Historical Actuals
              </span>
              <span class="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span class="w-3 h-1.5 border-t-2 border-dashed border-[#6366f1]"></span> Forecasted Trend
              </span>
              <span class="inline-flex items-center gap-1.5 text-purple-500 dark:text-purple-400">
                <span class="w-3 h-3 rounded-sm bg-purple-200 dark:bg-purple-900/40"></span> Prediction Interval Band
              </span>
            </div>
          </div>

          <div class="relative h-72 sm:h-80 w-full">
            <canvas #forecastCanvas></canvas>
          </div>
        </div>

        <!-- Month-by-Month Forecast Breakdown Cards -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-4">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2.5">
            Quarter Breakdown By Month
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            @for (m of forecast.forecastMonths; track m.month; let i = $index) {
              <div class="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/30 flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wide block">
                    Month {{ i + 1 }} &bull; {{ m.label }}
                  </span>
                  <span class="text-base font-extrabold text-[#14265c] dark:text-white">
                    {{ formatCurrency(m.predictedSales) }}
                  </span>
                </div>
                <div class="text-right text-[10px] text-slate-500 dark:text-slate-400">
                  <span class="block">Range:</span>
                  <span class="font-mono text-slate-700 dark:text-slate-300">
                    {{ formatCurrency(m.lowerBound) }} - {{ formatCurrency(m.upperBound) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center py-8">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
          <mat-icon class="text-2xl">auto_graph</mat-icon>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white">Revenue Forecast (Next Quarter)</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
          At least 2 historical monthly periods are required to compute the Ordinary Least Squares (OLS) trend analysis.
          Try widening your date filter to view quarterly forecasts.
        </p>
        <button
          type="button"
          (click)="salesService.resetFiltersToAll()"
          class="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer">
          <mat-icon class="text-xs">restart_alt</mat-icon>
          Reset Date Filters
        </button>
      </div>
    }
  `
})
export class RevenueForecast implements OnDestroy {
  readonly salesService = inject(SalesService);
  readonly themeService = inject(ThemeService);

  readonly forecastCanvas = viewChild<ElementRef<HTMLCanvasElement>>('forecastCanvas');
  private forecastChart?: Chart;
  private isRendered = false;

  constructor() {
    afterNextRender(() => {
      this.isRendered = true;
      const canvas = this.forecastCanvas()?.nativeElement;
      if (canvas) {
        this.initChart(canvas);
      }
    });

    effect(() => {
      const forecast = this.salesService.revenueForecast();
      const isDark = this.themeService.isDark();
      const canvas = this.forecastCanvas()?.nativeElement;

      if (!this.isRendered) return;

      if (!forecast || !canvas) {
        if (this.forecastChart) {
          this.forecastChart.destroy();
          this.forecastChart = undefined;
        }
        return;
      }

      if (!this.forecastChart) {
        this.initChart(canvas);
      }
      this.updateChart(forecast, isDark);
    });
  }

  private initChart(canvas: HTMLCanvasElement): void {
    if (this.forecastChart) {
      this.forecastChart.destroy();
    }

    const isDark = this.themeService.isDark();
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9';
    const tickColor = isDark ? '#94a3b8' : '#64748b';

    this.forecastChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#0f172a' : '#14265c',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: isDark ? '#334155' : 'transparent',
            borderWidth: isDark ? 1 : 0,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const dsName = ctx.dataset.label;
                const val = Number(ctx.parsed.y);
                if (dsName === 'Upper Bound') return ` Upper Band: $${val.toLocaleString()}`;
                if (dsName === 'Lower Bound') return ` Lower Band: $${val.toLocaleString()}`;
                if (dsName === 'Forecast (Next Q)') return ` Projected Forecast: $${val.toLocaleString()}`;
                return ` Actual Sales: $${val.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              callback: (val) => `$${Number(val).toLocaleString()}`
            }
          }
        }
      }
    });

    const currentForecast = this.salesService.revenueForecast();
    if (currentForecast) {
      this.updateChart(currentForecast, isDark);
    }
  }

  private updateChart(forecast: RevenueForecastData, isDark = false): void {
    if (!this.forecastChart) return;

    const histLabels = forecast.historicalMonths.map(h => h.label);
    const futureLabels = forecast.forecastMonths.map(f => f.label);
    const allLabels = [...histLabels, ...futureLabels];

    const histCount = forecast.historicalMonths.length;

    // 1. Historical Actual Sales dataset
    const actualData: (number | null)[] = [
      ...forecast.historicalMonths.map(h => h.sales),
      null, null, null
    ];

    // 2. Forecast Trend line (bridges from last historical point)
    const lastHistVal = forecast.historicalMonths[histCount - 1].sales;
    const forecastData: (number | null)[] = new Array(allLabels.length).fill(null);
    forecastData[histCount - 1] = lastHistVal;
    forecastData[histCount] = forecast.forecastMonths[0].predictedSales;
    forecastData[histCount + 1] = forecast.forecastMonths[1].predictedSales;
    forecastData[histCount + 2] = forecast.forecastMonths[2].predictedSales;

    // 3. Upper & Lower confidence interval bounds
    const upperData: (number | null)[] = new Array(allLabels.length).fill(null);
    const lowerData: (number | null)[] = new Array(allLabels.length).fill(null);
    upperData[histCount - 1] = lastHistVal;
    lowerData[histCount - 1] = lastHistVal;
    upperData[histCount] = forecast.forecastMonths[0].upperBound;
    lowerData[histCount] = forecast.forecastMonths[0].lowerBound;
    upperData[histCount + 1] = forecast.forecastMonths[1].upperBound;
    lowerData[histCount + 1] = forecast.forecastMonths[1].lowerBound;
    upperData[histCount + 2] = forecast.forecastMonths[2].upperBound;
    lowerData[histCount + 2] = forecast.forecastMonths[2].lowerBound;

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9';
    const tickColor = isDark ? '#94a3b8' : '#64748b';

    this.forecastChart.data.labels = allLabels;
    this.forecastChart.data.datasets = [
      // Upper Bound fill boundary
      {
        label: 'Upper Bound',
        data: upperData,
        borderColor: 'rgba(99, 102, 241, 0.25)',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: '+1'
      },
      // Lower Bound
      {
        label: 'Lower Bound',
        data: lowerData,
        borderColor: 'rgba(99, 102, 241, 0.25)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false
      },
      // Actual Historical Sales
      {
        label: 'Actual Sales',
        data: actualData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 3.5,
        pointHoverRadius: 6,
        tension: 0.25,
        fill: true
      },
      // Forecasted Line
      {
        label: 'Forecast (Next Q)',
        data: forecastData,
        borderColor: '#6366f1',
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [6, 4],
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.25,
        fill: false
      }
    ];

    if (this.forecastChart.options.scales) {
      if (this.forecastChart.options.scales['x']) {
        this.forecastChart.options.scales['x'].ticks = { ...this.forecastChart.options.scales['x'].ticks, color: tickColor };
      }
      if (this.forecastChart.options.scales['y']) {
        this.forecastChart.options.scales['y'].grid = { ...this.forecastChart.options.scales['y'].grid, color: gridColor };
        this.forecastChart.options.scales['y'].ticks = { ...this.forecastChart.options.scales['y'].ticks, color: tickColor };
      }
    }

    this.forecastChart.update();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  ngOnDestroy(): void {
    this.forecastChart?.destroy();
  }
}

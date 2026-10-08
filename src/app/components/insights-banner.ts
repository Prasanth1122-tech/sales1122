import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../services/sales';

@Component({
  selector: 'app-insights-banner',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (salesService.smartInsights(); as insights) {
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6 transition-all">
        <div class="flex items-center justify-between mb-3.5">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <mat-icon class="text-base">insights</mat-icon>
            </div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Executive Summary & Highlights</h2>
          </div>
          <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Automated Intelligence</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Top Product -->
          @if (insights.topProduct; as p) {
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <mat-icon class="text-base">star</mat-icon>
              </div>
              <div class="min-w-0">
                <span class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Top Revenue Leader</span>
                <p class="text-xs font-bold text-[#14265c] dark:text-white truncate" [title]="p.name">{{ p.name }}</p>
                <p class="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">\${{ p.sales.toLocaleString() }} ({{ p.pct }}% of sales)</p>
              </div>
            </div>
          }

          <!-- Top Category -->
          @if (insights.topCategory; as c) {
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <mat-icon class="text-base">category</mat-icon>
              </div>
              <div class="min-w-0">
                <span class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Leading Department</span>
                <p class="text-xs font-bold text-[#14265c] dark:text-white truncate">{{ c.name }}</p>
                <p class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">\${{ c.sales.toLocaleString() }} ({{ c.pct }}% share)</p>
              </div>
            </div>
          }

          <!-- Peak Month -->
          @if (insights.bestMonth; as m) {
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <mat-icon class="text-base">calendar_month</mat-icon>
              </div>
              <div class="min-w-0">
                <span class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Peak Sales Month</span>
                <p class="text-xs font-bold text-[#14265c] dark:text-white truncate">{{ m.label }}</p>
                <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">\${{ m.sales.toLocaleString() }} revenue</p>
              </div>
            </div>
          }

          <!-- Regional Hub -->
          @if (insights.topRegion; as r) {
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <mat-icon class="text-base">location_city</mat-icon>
              </div>
              <div class="min-w-0">
                <span class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Top Market Region</span>
                <p class="text-xs font-bold text-[#14265c] dark:text-white truncate">{{ r.region }} Market</p>
                <p class="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">\${{ r.profit.toLocaleString() }} profit</p>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class InsightsBanner {
  readonly salesService = inject(SalesService);
}

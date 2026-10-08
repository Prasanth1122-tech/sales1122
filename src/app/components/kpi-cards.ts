import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../services/sales';

@Component({
  selector: 'app-kpi-cards',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total Sales -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Sales</span>
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <mat-icon class="text-xl">payments</mat-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#14265c] dark:text-white tracking-tight">
          {{ formatCurrency(salesService.kpis().totalSales) }}
        </div>
        <div class="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span class="text-blue-600 dark:text-blue-400 font-medium">Avg ticket:</span>
          <span>{{ formatCurrency(salesService.kpis().avgOrderValue) }} / order</span>
        </div>
      </div>

      <!-- Total Profit -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-600"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Profit</span>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <mat-icon class="text-xl">trending_up</mat-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#14265c] dark:text-white tracking-tight">
          {{ formatCurrency(salesService.kpis().totalProfit) }}
        </div>
        <div class="flex items-center gap-1.5 mt-2 text-xs">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 text-emerald-800">
            {{ salesService.kpis().profitMargin }}% margin
          </span>
          <span class="text-slate-500 dark:text-slate-400">net return</span>
        </div>
      </div>

      <!-- Total Orders -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Orders</span>
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <mat-icon class="text-xl">receipt_long</mat-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#14265c] dark:text-white tracking-tight">
          {{ salesService.kpis().totalOrders | number }}
        </div>
        <div class="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <mat-icon class="text-sm text-amber-600 dark:text-amber-400 leading-none">task_alt</mat-icon>
          <span>Processed transactions</span>
        </div>
      </div>

      <!-- Total Quantity -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-violet-600"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Quantity</span>
          <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <mat-icon class="text-xl">inventory_2</mat-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#14265c] dark:text-white tracking-tight">
          {{ salesService.kpis().totalQuantity | number }}
        </div>
        <div class="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <mat-icon class="text-sm text-purple-600 dark:text-purple-400 leading-none">local_shipping</mat-icon>
          <span>Units shipped to date</span>
        </div>
      </div>
    </div>
  `
})
export class KpiCards {
  readonly salesService = inject(SalesService);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
}

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from './services/sales';
import { ThemeService } from './services/theme';
import { KpiCards } from './components/kpi-cards';
import { DashboardCharts } from './components/charts';
import { Filters } from './components/filters';
import { DataTable } from './components/data-table';
import { InsightsBanner } from './components/insights-banner';
import { AddTransactionModal } from './components/add-transaction-modal';
import { RevenueForecast } from './components/revenue-forecast';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    KpiCards,
    DashboardCharts,
    Filters,
    DataTable,
    InsightsBanner,
    AddTransactionModal,
    RevenueForecast
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-[#f4f7fb] to-[#eaf0f8] dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <!-- Top Navigation Bar -->
      <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <!-- Branding -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm">
                <mat-icon class="text-2xl">analytics</mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-[#14265c] dark:text-white tracking-tight">
                    Sales Dashboard
                  </h1>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Live
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Upload your Excel sales data and explore interactive business insights
                </p>
              </div>
            </div>

            <!-- Actions Bar -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Dark Mode Toggle Button -->
              <button
                type="button"
                (click)="themeService.toggleTheme()"
                class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
                [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
                <mat-icon class="text-lg">
                  {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
                </mat-icon>
              </button>

              <!-- Add Transaction Record -->
              <button
                type="button"
                (click)="showAddModal.set(true)"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Add new sales transaction">
                <mat-icon class="text-sm">add_circle</mat-icon>
                <span>New Sale</span>
              </button>

              <!-- Upload Excel input -->
              <label class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14265c] dark:bg-blue-600 hover:bg-[#1f377d] dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                <mat-icon class="text-sm">upload_file</mat-icon>
                <span>Upload Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  (change)="onFileSelected($event)"
                  class="hidden"
                />
              </label>

              <!-- Reset to Sample Dataset -->
              @if (!salesService.isSampleData()) {
                <button
                  type="button"
                  (click)="salesService.loadSampleData()"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Switch back to default demo dataset">
                  <mat-icon class="text-sm text-slate-500 dark:text-slate-400">history</mat-icon>
                  Load Sample
                </button>
              }

              <!-- Export Excel (.xlsx) & Format Dropdown -->
              <div class="relative inline-flex items-center">
                <button
                  type="button"
                  (click)="salesService.downloadFilteredExcel()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#107c41] hover:bg-[#0b5d30] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Download filtered sales data in Excel (.xlsx) format">
                  <mat-icon class="text-sm">table_view</mat-icon>
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  (click)="toggleExportMenu()"
                  class="ml-1 p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                  [title]="showExportMenu() ? 'Close export options' : 'More download options (.xlsx, .csv)'">
                  <mat-icon class="text-xs">arrow_drop_down</mat-icon>
                </button>

                <!-- Export format dropdown -->
                @if (showExportMenu()) {
                  <div class="fixed inset-0 z-30" (click)="showExportMenu.set(false)"></div>
                  <div class="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-40 text-xs animate-in fade-in">
                    <button
                      type="button"
                      (click)="salesService.downloadFilteredExcel(); showExportMenu.set(false)"
                      class="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 cursor-pointer">
                      <mat-icon class="text-base text-[#107c41]">table_view</mat-icon>
                      <div class="flex-1">
                        <div class="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                          Excel (.xlsx)
                          <span class="text-[9px] uppercase px-1 py-0.2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded font-bold">Standard</span>
                        </div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400">Transactions, KPIs & summaries</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      (click)="salesService.downloadFilteredCsv(); showExportMenu.set(false)"
                      class="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer">
                      <mat-icon class="text-base text-slate-500">description</mat-icon>
                      <div>
                        <div class="font-bold">CSV File (.csv)</div>
                        <div class="text-[10px] text-slate-400">Plain comma-delimited rows</div>
                      </div>
                    </button>

                    <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>

                    <button
                      type="button"
                      (click)="salesService.downloadExcelTemplate(); showExportMenu.set(false)"
                      class="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer">
                      <mat-icon class="text-base text-blue-500">file_download</mat-icon>
                      <div>
                        <div class="font-bold">Blank Template (.xlsx)</div>
                        <div class="text-[10px] text-slate-400">Template formatted for upload</div>
                      </div>
                    </button>
                  </div>
                }
              </div>

              <!-- Mobile Filters Toggle -->
              <button
                type="button"
                (click)="toggleMobileFilters()"
                class="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer">
                <mat-icon class="text-sm">filter_list</mat-icon>
                Filters
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Layout -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Active Dataset Banner & Notification -->
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <div class="flex items-center gap-2">
            <mat-icon class="text-sm text-blue-600 dark:text-blue-400">dataset</mat-icon>
            <span class="font-medium text-slate-700 dark:text-slate-300">Dataset:</span>
            <span class="font-semibold text-[#14265c] dark:text-white">{{ salesService.datasetName() }}</span>
            <span class="text-slate-400">•</span>
            <span>{{ salesService.filteredData().length }} matching records</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium border border-emerald-200 dark:border-emerald-800">
              <mat-icon class="text-xs">check_circle</mat-icon>
              Columns Verified: Date, Product, Category, Region, Sales, Quantity, Profit
            </span>
            <button
              type="button"
              (click)="salesService.downloadExcelTemplate()"
              class="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium underline underline-offset-2 cursor-pointer"
              title="Download empty Excel template (.xlsx)">
              <mat-icon class="text-xs">download</mat-icon>
              Excel Template
            </button>
          </div>
        </div>

        <!-- Executive Highlights Banner -->
        <app-insights-banner></app-insights-banner>

        <!-- Upload Feedback Banner -->
        @if (salesService.uploadFeedback(); as fb) {
          <div
            class="mb-6 p-4 rounded-xl border text-xs flex items-start justify-between gap-3"
            [class.bg-emerald-50]="fb.type === 'success'"
            [class.dark:bg-emerald-950/60]="fb.type === 'success'"
            [class.border-emerald-200]="fb.type === 'success'"
            [class.dark:border-emerald-800]="fb.type === 'success'"
            [class.text-emerald-800]="fb.type === 'success'"
            [class.dark:text-emerald-200]="fb.type === 'success'"
            [class.bg-amber-50]="fb.type === 'warning'"
            [class.dark:bg-amber-950/60]="fb.type === 'warning'"
            [class.border-amber-200]="fb.type === 'warning'"
            [class.dark:border-amber-800]="fb.type === 'warning'"
            [class.text-amber-800]="fb.type === 'warning'"
            [class.dark:text-amber-200]="fb.type === 'warning'"
            [class.bg-rose-50]="fb.type === 'error'"
            [class.dark:bg-rose-950/60]="fb.type === 'error'"
            [class.border-rose-200]="fb.type === 'error'"
            [class.dark:border-rose-800]="fb.type === 'error'"
            [class.text-rose-800]="fb.type === 'error'"
            [class.dark:text-rose-200]="fb.type === 'error'">
            <div class="flex items-start gap-2.5">
              <mat-icon class="text-base mt-0.5">
                {{ fb.type === 'success' ? 'check_circle' : fb.type === 'warning' ? 'warning' : 'error' }}
              </mat-icon>
              <div>
                <p class="font-bold">{{ fb.message }}</p>
                @if (fb.sheets && fb.sheets.length > 0) {
                  <ul class="mt-1 list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                    @for (s of fb.sheets; track s.sheetName) {
                      <li>
                        Sheet "{{ s.sheetName }}":
                        @if (s.skipped) {
                          <span class="font-medium text-rose-600 dark:text-rose-400">Skipped (missing columns: {{ s.missingColumns?.join(', ') || 'no rows' }})</span>
                        } @else {
                          <span class="font-medium text-emerald-600 dark:text-emerald-400">Loaded {{ s.rowCount }} rows</span>
                        }
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
            <button
              type="button"
              (click)="salesService.uploadFeedback.set(null)"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>
        }

        <!-- Interactive Cross-Filter / Drill-down Active Banner -->
        @if (salesService.chartFilter(); as cf) {
          <div class="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              <span class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <mat-icon class="text-base text-white">filter_alt</mat-icon>
              </span>
              <span>
                Cross-filtering active:
                <strong class="underline decoration-white/40 underline-offset-2">{{ cf.dimension }} = {{ cf.value }}</strong>
              </span>
            </div>
            <button
              type="button"
              (click)="salesService.clearChartFilter()"
              class="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs">
              <mat-icon class="text-xs">close</mat-icon>
              Clear Drill-Down
            </button>
          </div>
        }

        <!-- 2 Column Responsive Layout: Sidebar Filters + Main Dashboard -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <!-- Left Sidebar Filter Column -->
          <aside [class.hidden]="!showMobileFilters()" class="lg:block lg:col-span-1 sticky top-20 z-10">
            <app-filters></app-filters>
          </aside>

          <!-- Right Content Column: KPI Cards, Charts, Table -->
          <div class="lg:col-span-3 space-y-6">
            <!-- 4 KPI Summary Cards -->
            <app-kpi-cards></app-kpi-cards>

            <!-- Revenue Forecast Component for Next Quarter -->
            <app-revenue-forecast></app-revenue-forecast>

            <!-- 6 Interactive Visualizations -->
            <app-dashboard-charts></app-dashboard-charts>

            <!-- Recent Sales Data Table -->
            <app-data-table (addRecordRequested)="showAddModal.set(true)"></app-data-table>
          </div>
        </div>
      </main>

      <!-- Add Transaction Modal -->
      @if (showAddModal()) {
        <app-add-transaction-modal (close)="showAddModal.set(false)"></app-add-transaction-modal>
      }

      <!-- Footer -->
      <footer class="mt-12 py-6 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>Sales Analytics Dashboard • Interactive data visualization built with Angular 21, TypeScript & Chart.js</p>
      </footer>
    </div>
  `
})
export class App {
  readonly salesService = inject(SalesService);
  readonly themeService = inject(ThemeService);
  readonly showMobileFilters = signal<boolean>(false);
  readonly showAddModal = signal<boolean>(false);
  readonly showExportMenu = signal<boolean>(false);

  toggleMobileFilters(): void {
    this.showMobileFilters.update(v => !v);
  }

  toggleExportMenu(): void {
    this.showExportMenu.update(v => !v);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.salesService.parseAndLoadFile(file);
      input.value = ''; // Reset input to allow re-uploading same file
    }
  }
}

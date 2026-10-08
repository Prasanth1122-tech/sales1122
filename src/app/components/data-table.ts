import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../services/sales';
import { SaleRecord } from '../data/sample-sales';

type SortField = keyof SaleRecord;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      <!-- Table Header & Controls -->
      <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-[#14265c] dark:text-white flex items-center gap-2">
            <mat-icon class="text-blue-600 dark:text-blue-400">table_chart</mat-icon>
            Recent Sales Transactions
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Showing {{ displayedRecords().length }} of {{ salesService.filteredData().length }} matching records
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Quick search -->
          <div class="relative w-full sm:w-56">
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Search transactions..."
              class="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
            <mat-icon class="absolute left-2.5 top-2 text-slate-400 text-sm">search</mat-icon>
          </div>

          <!-- Add Record -->
          <button
            type="button"
            (click)="addRecordRequested.emit()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            title="Add a new sales transaction">
            <mat-icon class="text-sm">add</mat-icon>
            Add Record
          </button>

          <!-- Download CSV -->
          <button
            type="button"
            (click)="salesService.downloadFilteredCsv()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs shadow-xs transition-colors cursor-pointer"
            title="Download current filtered data as CSV">
            <mat-icon class="text-sm">download</mat-icon>
            Export CSV
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th scope="col" (click)="setSort('Date')" class="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center gap-1">
                  <span>Date</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Date') }}</mat-icon>
                </div>
              </th>
              <th scope="col" (click)="setSort('Product')" class="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center gap-1">
                  <span>Product</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Product') }}</mat-icon>
                </div>
              </th>
              <th scope="col" (click)="setSort('Category')" class="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center gap-1">
                  <span>Category</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Category') }}</mat-icon>
                </div>
              </th>
              <th scope="col" (click)="setSort('Region')" class="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center gap-1">
                  <span>Region</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Region') }}</mat-icon>
                </div>
              </th>
              <th scope="col" (click)="setSort('Sales')" class="py-3 px-4 text-right cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center justify-end gap-1">
                  <span>Sales</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Sales') }}</mat-icon>
                </div>
              </th>
              <th scope="col" (click)="setSort('Quantity')" class="py-3 px-4 text-right cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center justify-end gap-1">
                  <span>Qty</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Quantity') }}</mat-icon>
                </div>
              </th>
              <th scope="col" (click)="setSort('Profit')" class="py-3 px-4 text-right cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none">
                <div class="flex items-center justify-end gap-1">
                  <span>Profit</span>
                  <mat-icon class="text-xs">{{ getSortIcon('Profit') }}</mat-icon>
                </div>
              </th>
              <th scope="col" class="py-3 px-3 text-center text-slate-400 font-normal">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            @for (row of paginatedRecords(); track $index) {
              <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group">
                <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{{ row.Date }}</td>
                <td class="py-3 px-4 font-semibold text-slate-900 dark:text-white">{{ row.Product }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {{ row.Category }}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-400">{{ row.Region }}</td>
                <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">{{ formatCurrency(row.Sales) }}</td>
                <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{{ row.Quantity }}</td>
                <td class="py-3 px-4 text-right font-semibold" [class.text-emerald-600]="row.Profit >= 0" [class.text-rose-600]="row.Profit < 0" [class.dark:text-emerald-400]="row.Profit >= 0" [class.dark:text-rose-400]="row.Profit < 0">
                  {{ formatCurrency(row.Profit) }}
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    type="button"
                    (click)="salesService.deleteTransaction(row)"
                    class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all cursor-pointer"
                    title="Delete record">
                    <mat-icon class="text-sm">delete_outline</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="py-8 text-center text-slate-400 dark:text-slate-500">
                  No records match the current filter criteria
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div class="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            [value]="pageSize()"
            (change)="onPageSizeChange($event)"
            class="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            <option [value]="10">10</option>
            <option [value]="15">15</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
          </select>
          <span class="text-slate-400">|</span>
          <span>
            Page {{ currentPage() }} of {{ totalPages() || 1 }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() <= 1"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            <mat-icon class="text-sm">chevron_left</mat-icon>
          </button>
          <button
            type="button"
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() >= totalPages()"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            <mat-icon class="text-sm">chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataTable {
  readonly salesService = inject(SalesService);
  readonly addRecordRequested = output<void>();

  readonly searchControl = new FormControl<string>('', { nonNullable: true });
  readonly searchQuery = signal<string>('');

  readonly sortField = signal<SortField>('Date');
  readonly sortDirection = signal<SortDirection>('desc');

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);

  constructor() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
      this.currentPage.set(1);
    });
  }

  readonly displayedRecords = computed(() => {
    let list = [...this.salesService.filteredData()];
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      list = list.filter(r =>
        r.Product.toLowerCase().includes(query) ||
        r.Category.toLowerCase().includes(query) ||
        r.Region.toLowerCase().includes(query) ||
        r.Date.includes(query)
      );
    }

    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    return list;
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.displayedRecords().length / this.pageSize()) || 1;
  });

  readonly paginatedRecords = computed(() => {
    const list = this.displayedRecords();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  setSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
  }

  getSortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(val || 15);
    this.currentPage.set(1);
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(val);
  }
}

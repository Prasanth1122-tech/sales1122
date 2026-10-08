import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../services/sales';

@Component({
  selector: 'app-filters',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6 transition-all">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <mat-icon class="text-lg">tune</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-[#14265c] dark:text-white">Filters & Segment</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Refine dataset metrics in real-time</p>
          </div>
        </div>
        <button
          type="button"
          (click)="onResetAll()"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          title="Reset all filters to defaults">
          <mat-icon class="text-sm">restart_alt</mat-icon>
          Reset
        </button>
      </div>

      <!-- Date Range Filter -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <mat-icon class="text-sm text-slate-400">calendar_today</mat-icon>
            Date Range
          </label>
        </div>

        <form [formGroup]="dateForm" class="grid grid-cols-2 gap-2">
          <div>
            <span class="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">From</span>
            <input
              type="date"
              formControlName="startDate"
              (change)="onDateChange()"
              class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <span class="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">To</span>
            <input
              type="date"
              formControlName="endDate"
              (change)="onDateChange()"
              class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>
        </form>

        <!-- Quick date range presets -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            (click)="setDatePreset('all')"
            class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">
            All Time
          </button>
          <button
            type="button"
            (click)="setDatePreset('q1')"
            class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">
            Q1
          </button>
          <button
            type="button"
            (click)="setDatePreset('q2')"
            class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">
            Q2
          </button>
          <button
            type="button"
            (click)="setDatePreset('q3')"
            class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">
            Q3
          </button>
          <button
            type="button"
            (click)="setDatePreset('q4')"
            class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">
            Q4
          </button>
        </div>
      </div>

      <!-- Region Filter -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <mat-icon class="text-sm text-slate-400">place</mat-icon>
            Region
          </label>
          <button
            type="button"
            (click)="toggleAllRegions()"
            class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer">
            {{ isAllRegionsSelected() ? 'Deselect all' : 'Select all' }}
          </button>
        </div>

        <div class="space-y-1 bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 max-h-36 overflow-y-auto">
          @for (reg of salesService.allRegions(); track reg) {
            <label class="flex items-center gap-2 p-1 rounded-md hover:bg-white dark:hover:bg-slate-700/60 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                [checked]="isRegionSelected(reg)"
                (change)="toggleRegion(reg)"
                class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{{ reg }}</span>
            </label>
          }
        </div>
      </div>

      <!-- Category Filter -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <mat-icon class="text-sm text-slate-400">category</mat-icon>
            Category
          </label>
          <button
            type="button"
            (click)="toggleAllCategories()"
            class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer">
            {{ isAllCategoriesSelected() ? 'Deselect all' : 'Select all' }}
          </button>
        </div>

        <div class="space-y-1 bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 max-h-36 overflow-y-auto">
          @for (cat of salesService.allCategories(); track cat) {
            <label class="flex items-center gap-2 p-1 rounded-md hover:bg-white dark:hover:bg-slate-700/60 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                [checked]="isCategorySelected(cat)"
                (change)="toggleCategory(cat)"
                class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{{ cat }}</span>
            </label>
          }
        </div>
      </div>

      <!-- Product Filter with Search -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <mat-icon class="text-sm text-slate-400">inventory_2</mat-icon>
            Product
          </label>
          <button
            type="button"
            (click)="toggleAllProducts()"
            class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer">
            {{ isAllProductsSelected() ? 'Deselect all' : 'Select all' }}
          </button>
        </div>

        <!-- Product Search Box -->
        <div class="relative">
          <input
            type="text"
            [formControl]="productSearchControl"
            placeholder="Search products..."
            class="w-full text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
          <mat-icon class="absolute left-2 top-2 text-slate-400 text-xs">search</mat-icon>
        </div>

        <div class="space-y-1 bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 max-h-48 overflow-y-auto">
          @for (prod of filteredProductsList(); track prod) {
            <label class="flex items-center gap-2 p-1 rounded-md hover:bg-white dark:hover:bg-slate-700/60 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 truncate">
              <input
                type="checkbox"
                [checked]="isProductSelected(prod)"
                (change)="toggleProduct(prod)"
                class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span class="truncate" [title]="prod">{{ prod }}</span>
            </label>
          } @empty {
            <div class="text-[11px] text-slate-400 dark:text-slate-500 p-2 text-center">No products found</div>
          }
        </div>
      </div>

      <!-- Action Button -->
      <button
        type="button"
        (click)="onResetAll()"
        class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-xs transition-colors cursor-pointer">
        <mat-icon class="text-sm text-slate-500 dark:text-slate-400">replay</mat-icon>
        Clear All Filters
      </button>
    </div>
  `
})
export class Filters {
  readonly salesService = inject(SalesService);

  readonly productSearchControl = new FormControl<string>('', { nonNullable: true });

  readonly dateForm = new FormGroup({
    startDate: new FormControl<string>('', { nonNullable: true }),
    endDate: new FormControl<string>('', { nonNullable: true })
  });

  readonly searchTerm = signal<string>('');

  readonly filteredProductsList = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.salesService.allProducts();
    if (!term) return all;
    return all.filter(p => p.toLowerCase().includes(term));
  });

  constructor() {
    this.productSearchControl.valueChanges.subscribe(val => {
      this.searchTerm.set(val || '');
    });

    effect(() => {
      const s = this.salesService.startDate();
      const e = this.salesService.endDate();
      this.dateForm.patchValue({ startDate: s, endDate: e }, { emitEvent: false });
    });
  }

  onDateChange(): void {
    const s = this.dateForm.controls.startDate.value;
    const e = this.dateForm.controls.endDate.value;
    if (s) this.salesService.startDate.set(s);
    if (e) this.salesService.endDate.set(e);
  }

  setDatePreset(preset: 'all' | 'q1' | 'q2' | 'q3' | 'q4'): void {
    const minD = this.salesService.minDataDate();
    const maxD = this.salesService.maxDataDate();
    const year = minD.substring(0, 4) || '2026';

    switch (preset) {
      case 'all':
        this.salesService.startDate.set(minD);
        this.salesService.endDate.set(maxD);
        break;
      case 'q1':
        this.salesService.startDate.set(`${year}-01-01`);
        this.salesService.endDate.set(`${year}-03-31`);
        break;
      case 'q2':
        this.salesService.startDate.set(`${year}-04-01`);
        this.salesService.endDate.set(`${year}-06-30`);
        break;
      case 'q3':
        this.salesService.startDate.set(`${year}-07-01`);
        this.salesService.endDate.set(`${year}-09-30`);
        break;
      case 'q4':
        this.salesService.startDate.set(`${year}-10-01`);
        this.salesService.endDate.set(`${year}-12-31`);
        break;
    }
  }

  // Region helpers
  isRegionSelected(region: string): boolean {
    return this.salesService.selectedRegions().includes(region);
  }

  isAllRegionsSelected(): boolean {
    return this.salesService.selectedRegions().length === this.salesService.allRegions().length;
  }

  toggleRegion(region: string): void {
    const cur = this.salesService.selectedRegions();
    if (cur.includes(region)) {
      this.salesService.selectedRegions.set(cur.filter(r => r !== region));
    } else {
      this.salesService.selectedRegions.set([...cur, region]);
    }
  }

  toggleAllRegions(): void {
    if (this.isAllRegionsSelected()) {
      this.salesService.selectedRegions.set([]);
    } else {
      this.salesService.selectedRegions.set([...this.salesService.allRegions()]);
    }
  }

  // Category helpers
  isCategorySelected(cat: string): boolean {
    return this.salesService.selectedCategories().includes(cat);
  }

  isAllCategoriesSelected(): boolean {
    return this.salesService.selectedCategories().length === this.salesService.allCategories().length;
  }

  toggleCategory(cat: string): void {
    const cur = this.salesService.selectedCategories();
    if (cur.includes(cat)) {
      this.salesService.selectedCategories.set(cur.filter(c => c !== cat));
    } else {
      this.salesService.selectedCategories.set([...cur, cat]);
    }
  }

  toggleAllCategories(): void {
    if (this.isAllCategoriesSelected()) {
      this.salesService.selectedCategories.set([]);
    } else {
      this.salesService.selectedCategories.set([...this.salesService.allCategories()]);
    }
  }

  // Product helpers
  isProductSelected(prod: string): boolean {
    return this.salesService.selectedProducts().includes(prod);
  }

  isAllProductsSelected(): boolean {
    return this.salesService.selectedProducts().length === this.salesService.allProducts().length;
  }

  toggleProduct(prod: string): void {
    const cur = this.salesService.selectedProducts();
    if (cur.includes(prod)) {
      this.salesService.selectedProducts.set(cur.filter(p => p !== prod));
    } else {
      this.salesService.selectedProducts.set([...cur, prod]);
    }
  }

  toggleAllProducts(): void {
    if (this.isAllProductsSelected()) {
      this.salesService.selectedProducts.set([]);
    } else {
      this.salesService.selectedProducts.set([...this.salesService.allProducts()]);
    }
  }

  onResetAll(): void {
    this.productSearchControl.setValue('');
    this.salesService.resetFiltersToAll();
  }
}

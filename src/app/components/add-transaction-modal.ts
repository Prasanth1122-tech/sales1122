import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../services/sales';
import { SaleRecord } from '../data/sample-sales';

@Component({
  selector: 'app-add-transaction-modal',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden transition-all">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <mat-icon class="text-lg">add_chart</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#14265c] dark:text-white">Add New Sales Transaction</h3>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Record a new sales entry directly into the live dataset</p>
            </div>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer">
            <mat-icon class="text-sm">close</mat-icon>
          </button>
        </div>

        <!-- Modal Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Date -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                formControlName="date"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
              @if (form.controls.date.touched && form.controls.date.invalid) {
                <span class="text-rose-500 text-[10px]">Date is required</span>
              }
            </div>

            <!-- Product -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                formControlName="product"
                placeholder="e.g. Wireless Mouse"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
              @if (form.controls.product.touched && form.controls.product.invalid) {
                <span class="text-rose-500 text-[10px]">Product name is required</span>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Category -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <input
                type="text"
                formControlName="category"
                list="categoryList"
                placeholder="e.g. Electronics"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
              <datalist id="categoryList">
                @for (cat of salesService.allCategories(); track cat) {
                  <option [value]="cat"></option>
                }
              </datalist>
            </div>

            <!-- Region -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Region *</label>
              <input
                type="text"
                formControlName="region"
                list="regionList"
                placeholder="e.g. West"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
              <datalist id="regionList">
                @for (reg of salesService.allRegions(); track reg) {
                  <option [value]="reg"></option>
                }
              </datalist>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Sales -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sales ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                formControlName="sales"
                placeholder="0.00"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <!-- Quantity -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
              <input
                type="number"
                step="1"
                min="1"
                formControlName="quantity"
                placeholder="1"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <!-- Profit -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Profit ($) *</label>
              <input
                type="number"
                step="0.01"
                formControlName="profit"
                placeholder="0.00"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <!-- Profit Margin Live Preview -->
          <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
            <span>Estimated Profit Margin:</span>
            <span class="font-bold font-mono" [class.text-emerald-600]="getEstimatedMargin() >= 0" [class.text-rose-600]="getEstimatedMargin() < 0" [class.dark:text-emerald-400]="getEstimatedMargin() >= 0" [class.dark:text-rose-400]="getEstimatedMargin() < 0">
              {{ getEstimatedMargin().toFixed(1) }}%
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="form.invalid"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-xs transition-colors cursor-pointer">
              <mat-icon class="text-sm">save</mat-icon>
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddTransactionModal {
  readonly salesService = inject(SalesService);
  readonly close = output<void>();

  readonly form = new FormGroup({
    date: new FormControl<string>(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: [Validators.required] }),
    product: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<string>('Electronics', { nonNullable: true, validators: [Validators.required] }),
    region: new FormControl<string>('West', { nonNullable: true, validators: [Validators.required] }),
    sales: new FormControl<number>(100, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    quantity: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    profit: new FormControl<number>(25, { nonNullable: true, validators: [Validators.required] }),
  });

  getEstimatedMargin(): number {
    const s = this.form.controls.sales.value || 0;
    const p = this.form.controls.profit.value || 0;
    return s > 0 ? (p / s) * 100 : 0;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const newRecord: SaleRecord = {
      Date: val.date,
      Product: val.product.trim(),
      Category: val.category.trim(),
      Region: val.region.trim(),
      Sales: Math.round(val.sales * 100) / 100,
      Quantity: Math.round(val.quantity),
      Profit: Math.round(val.profit * 100) / 100,
    };

    this.salesService.addTransaction(newRecord);
    this.close.emit();
  }
}

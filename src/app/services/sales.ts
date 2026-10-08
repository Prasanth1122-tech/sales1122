import { Injectable, signal, computed } from '@angular/core';
import { SAMPLE_SALES_DATA, SaleRecord } from '../data/sample-sales';
import * as XLSX from 'xlsx';

export interface ChartFilter {
  dimension: 'Category' | 'Region' | 'Product' | 'Month' | 'Date';
  value: string;
}

export interface ForecastMonth {
  month: string;
  label: string;
  predictedSales: number;
  upperBound: number;
  lowerBound: number;
}

export interface RevenueForecastData {
  quarterLabel: string;
  totalForecast: number;
  priorQuarterTotal: number;
  growthPercentage: number;
  monthlyAverage: number;
  trendSlope: number;
  trendDirection: 'growth' | 'steady' | 'decline';
  historicalMonths: Array<{ month: string; label: string; sales: number }>;
  forecastMonths: ForecastMonth[];
}

export interface SheetParseResult {
  sheetName: string;
  rowCount: number;
  skipped: boolean;
  missingColumns?: string[];
}

export interface UploadFeedback {
  type: 'success' | 'warning' | 'error';
  message: string;
  sheets?: SheetParseResult[];
}

const REQUIRED_COLUMNS = ['Date', 'Product', 'Category', 'Region', 'Sales', 'Quantity', 'Profit'];

const COLUMN_ALIASES: Record<string, string> = {
  'Order Date': 'Date',
  'OrderDate': 'Date',
  'order_date': 'Date',
  'Product Name': 'Product',
  'Product_Name': 'Product',
  'product_name': 'Product',
  'Sub-Category': 'Category',
  'Sub Category': 'Category',
  'sub_category': 'Category',
  'Region Name': 'Region',
  'region_name': 'Region',
  'Amount': 'Sales',
  'Revenue': 'Sales',
  'revenue': 'Sales',
  'Units': 'Quantity',
  'Qty': 'Quantity',
  'qty': 'Quantity',
  'Cost Profit': 'Profit',
  'cost_profit': 'Profit',
};

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  // Raw records
  private readonly rawData = signal<SaleRecord[]>(SAMPLE_SALES_DATA);
  readonly datasetName = signal<string>('Default Sample Dataset');
  readonly isSampleData = signal<boolean>(true);
  readonly uploadFeedback = signal<UploadFeedback | null>(null);

  // Filters
  readonly startDate = signal<string>('2026-01-01');
  readonly endDate = signal<string>('2026-12-31');
  readonly selectedRegions = signal<string[]>([]);
  readonly selectedCategories = signal<string[]>([]);
  readonly selectedProducts = signal<string[]>([]);
  readonly chartFilter = signal<ChartFilter | null>(null);
  readonly forecastScenario = signal<'conservative' | 'baseline' | 'optimistic'>('baseline');

  // Distinct options from raw data
  readonly allRegions = computed(() => {
    const list = Array.from(new Set(this.rawData().map(d => d.Region))).filter(Boolean).sort();
    return list;
  });

  readonly allCategories = computed(() => {
    const list = Array.from(new Set(this.rawData().map(d => d.Category))).filter(Boolean).sort();
    return list;
  });

  readonly allProducts = computed(() => {
    const list = Array.from(new Set(this.rawData().map(d => d.Product))).filter(Boolean).sort();
    return list;
  });

  readonly minDataDate = computed(() => {
    const dates = this.rawData().map(d => d.Date).filter(Boolean);
    if (!dates.length) return '2026-01-01';
    return dates.reduce((min, cur) => cur < min ? cur : min, dates[0]);
  });

  readonly maxDataDate = computed(() => {
    const dates = this.rawData().map(d => d.Date).filter(Boolean);
    if (!dates.length) return '2026-12-31';
    return dates.reduce((max, cur) => cur > max ? cur : max, dates[0]);
  });

  constructor() {
    this.resetFiltersToAll();
  }

  resetFiltersToAll(): void {
    const data = this.rawData();
    const dates = data.map(d => d.Date).filter(Boolean);
    const minD = dates.length ? dates.reduce((m, c) => c < m ? c : m, dates[0]) : '2026-01-01';
    const maxD = dates.length ? dates.reduce((m, c) => c > m ? c : m, dates[0]) : '2026-12-31';

    this.startDate.set(minD);
    this.endDate.set(maxD);
    this.selectedRegions.set([...this.allRegions()]);
    this.selectedCategories.set([...this.allCategories()]);
    this.selectedProducts.set([...this.allProducts()]);
    this.chartFilter.set(null);
  }

  clearChartFilter(): void {
    this.chartFilter.set(null);
  }

  setChartFilter(filter: ChartFilter): void {
    const cur = this.chartFilter();
    if (cur && cur.dimension === filter.dimension && cur.value === filter.value) {
      this.chartFilter.set(null);
    } else {
      this.chartFilter.set(filter);
    }
  }

  loadSampleData(): void {
    this.rawData.set(SAMPLE_SALES_DATA);
    this.datasetName.set('Default Sample Dataset');
    this.isSampleData.set(true);
    this.uploadFeedback.set(null);
    this.resetFiltersToAll();
  }

  // Filtered dataset
  readonly filteredData = computed<SaleRecord[]>(() => {
    const data = this.rawData();
    const start = this.startDate();
    const end = this.endDate();
    const regions = new Set(this.selectedRegions());
    const categories = new Set(this.selectedCategories());
    const products = new Set(this.selectedProducts());
    const cf = this.chartFilter();

    return data.filter(item => {
      // Date filter
      if (start && item.Date < start) return false;
      if (end && item.Date > end) return false;

      // Dropdown filters
      if (regions.size > 0 && !regions.has(item.Region)) return false;
      if (categories.size > 0 && !categories.has(item.Category)) return false;
      if (products.size > 0 && !products.has(item.Product)) return false;

      // Cross-chart interactive filter
      if (cf) {
        if (cf.dimension === 'Category' && item.Category !== cf.value) return false;
        if (cf.dimension === 'Region' && item.Region !== cf.value) return false;
        if (cf.dimension === 'Product' && item.Product !== cf.value) return false;
        if (cf.dimension === 'Month') {
          const itemMonth = item.Date.substring(0, 7); // YYYY-MM
          if (itemMonth !== cf.value) return false;
        }
        if (cf.dimension === 'Date' && item.Date !== cf.value) return false;
      }

      return true;
    });
  });

  // KPI Metrics
  readonly kpis = computed(() => {
    const list = this.filteredData();
    const totalOrders = list.length;
    let totalSales = 0;
    let totalProfit = 0;
    let totalQuantity = 0;

    for (const r of list) {
      totalSales += r.Sales;
      totalProfit += r.Profit;
      totalQuantity += r.Quantity;
    }

    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalOrders,
      totalQuantity,
      profitMargin: Math.round(profitMargin * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    };
  });

  // Monthly Sales Trend
  readonly monthlyTrend = computed(() => {
    const list = this.filteredData();
    const map = new Map<string, { sales: number; profit: number; count: number }>();

    for (const r of list) {
      const month = r.Date.substring(0, 7); // YYYY-MM
      if (!month) continue;
      const cur = map.get(month) || { sales: 0, profit: 0, count: 0 };
      cur.sales += r.Sales;
      cur.profit += r.Profit;
      cur.count += 1;
      map.set(month, cur);
    }

    const sortedMonths = Array.from(map.keys()).sort();
    return sortedMonths.map(month => {
      const val = map.get(month)!;
      // Convert "2026-03" to readable "Mar 2026"
      const [year, m] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${monthNames[parseInt(m, 10) - 1] || m} ${year}`;

      return {
        month,
        label,
        sales: Math.round(val.sales * 100) / 100,
        profit: Math.round(val.profit * 100) / 100,
        count: val.count,
      };
    });
  });

  // Revenue Forecast for Next Quarter based on Linear Trend Analysis
  readonly revenueForecast = computed<RevenueForecastData | null>(() => {
    const historical = this.monthlyTrend();
    if (historical.length < 2) return null;

    const n = historical.length;
    const yVals = historical.map(h => h.sales);

    // Linear regression: y = m * x + b
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += yVals[i];
      sumXY += i * yVals[i];
      sumX2 += i * i;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;
    const denominator = sumX2 - sumX * meanX;
    const slope = denominator !== 0 ? (sumXY - sumX * meanY) / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Estimate residual variance for confidence interval
    let sumResidualSq = 0;
    for (let i = 0; i < n; i++) {
      const pred = slope * i + intercept;
      sumResidualSq += Math.pow(yVals[i] - pred, 2);
    }
    const stdError = Math.sqrt(sumResidualSq / Math.max(1, n - 2));
    const marginOfError = Math.max(stdError * 1.25, meanY * 0.08);

    // Scenario multiplier
    const scenario = this.forecastScenario();
    const scenarioMultiplier = scenario === 'optimistic' ? 1.08 : scenario === 'conservative' ? 0.92 : 1.0;

    // Find last historical month and generate next 3 months (next quarter)
    const last = historical[n - 1];
    const [lastYearStr, lastMonthStr] = last.month.split('-');
    const lastYear = parseInt(lastYearStr, 10) || 2026;
    const lastMonth = parseInt(lastMonthStr, 10) || 12;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const forecastMonths: ForecastMonth[] = [];
    let totalForecast = 0;

    for (let step = 1; step <= 3; step++) {
      const futureMonthNum = ((lastMonth - 1 + step) % 12) + 1;
      const futureYear = lastYear + Math.floor((lastMonth - 1 + step) / 12);
      const monthKey = `${futureYear}-${String(futureMonthNum).padStart(2, '0')}`;
      const monthLabel = `${monthNames[futureMonthNum - 1]} ${futureYear}`;

      const xFuture = n - 1 + step;
      const baseTrend = Math.max(500, slope * xFuture + intercept);
      const predictedSales = Math.round(baseTrend * scenarioMultiplier * 100) / 100;
      const upperBound = Math.round((predictedSales + marginOfError) * 100) / 100;
      const lowerBound = Math.round(Math.max(100, predictedSales - marginOfError) * 100) / 100;

      forecastMonths.push({
        month: monthKey,
        label: monthLabel,
        predictedSales,
        upperBound,
        lowerBound
      });
      totalForecast += predictedSales;
    }

    // Determine quarter label for the next 3 months
    const firstForecastMonth = (lastMonth % 12) + 1;
    const firstForecastYear = lastYear + Math.floor(lastMonth / 12);
    const quarterNumber = Math.ceil(firstForecastMonth / 3);
    const quarterLabel = `Q${quarterNumber} ${firstForecastYear}`;

    // Prior quarter comparison: sum of last 3 historical months
    const prior3 = historical.slice(-3);
    const priorQuarterTotal = prior3.reduce((sum, h) => sum + h.sales, 0);
    const growthPercentage = priorQuarterTotal > 0
      ? Math.round(((totalForecast - priorQuarterTotal) / priorQuarterTotal) * 1000) / 10
      : 0;

    const trendDirection = slope > 30 ? 'growth' : slope < -30 ? 'decline' : 'steady';

    return {
      quarterLabel,
      totalForecast: Math.round(totalForecast * 100) / 100,
      priorQuarterTotal: Math.round(priorQuarterTotal * 100) / 100,
      growthPercentage,
      monthlyAverage: Math.round((totalForecast / 3) * 100) / 100,
      trendSlope: Math.round(slope * 100) / 100,
      trendDirection,
      historicalMonths: historical.map(h => ({ month: h.month, label: h.label, sales: h.sales })),
      forecastMonths
    };
  });

  // Category Sales (Donut)
  readonly categorySales = computed(() => {
    const list = this.filteredData();
    const map = new Map<string, number>();
    let total = 0;

    for (const r of list) {
      const cat = r.Category || 'Other';
      map.set(cat, (map.get(cat) || 0) + r.Sales);
      total += r.Sales;
    }

    return Array.from(map.entries())
      .map(([category, sales]) => ({
        category,
        sales: Math.round(sales * 100) / 100,
        percentage: total > 0 ? Math.round((sales / total) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.sales - a.sales);
  });

  // Sales & Profit by Region
  readonly regionPerformance = computed(() => {
    const list = this.filteredData();
    const map = new Map<string, { sales: number; profit: number }>();

    for (const r of list) {
      const reg = r.Region || 'Unknown';
      const cur = map.get(reg) || { sales: 0, profit: 0 };
      cur.sales += r.Sales;
      cur.profit += r.Profit;
      map.set(reg, cur);
    }

    return Array.from(map.entries())
      .map(([region, val]) => ({
        region,
        sales: Math.round(val.sales * 100) / 100,
        profit: Math.round(val.profit * 100) / 100,
      }))
      .sort((a, b) => b.sales - a.sales);
  });

  // Profit by Category
  readonly categoryProfit = computed(() => {
    const list = this.filteredData();
    const map = new Map<string, number>();

    for (const r of list) {
      const cat = r.Category || 'Other';
      map.set(cat, (map.get(cat) || 0) + r.Profit);
    }

    return Array.from(map.entries())
      .map(([category, profit]) => ({
        category,
        profit: Math.round(profit * 100) / 100
      }))
      .sort((a, b) => b.profit - a.profit);
  });

  // Top 10 Products by Sales
  readonly topProducts = computed(() => {
    const list = this.filteredData();
    const map = new Map<string, { sales: number; quantity: number }>();

    for (const r of list) {
      const prod = r.Product || 'Unknown';
      const cur = map.get(prod) || { sales: 0, quantity: 0 };
      cur.sales += r.Sales;
      cur.quantity += r.Quantity;
      map.set(prod, cur);
    }

    return Array.from(map.entries())
      .map(([product, val]) => ({
        product,
        sales: Math.round(val.sales * 100) / 100,
        quantity: val.quantity
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  });

  // Scatter Data (Quantity vs Sales, sized by profit)
  readonly scatterData = computed(() => {
    const list = this.filteredData();
    // Cap at 150 points for chart performance if large dataset
    const sample = list.slice(0, 150);
    return sample.map(item => ({
      product: item.Product,
      category: item.Category,
      region: item.Region,
      date: item.Date,
      quantity: item.Quantity,
      sales: item.Sales,
      profit: item.Profit,
      bubbleSize: Math.max(4, Math.min(22, Math.sqrt(Math.abs(item.Profit)) * 1.5))
    }));
  });

  // Excel / CSV File Parsing
  async parseAndLoadFile(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      
      const parsedRecords: SaleRecord[] = [];
      const sheetsFeedback: SheetParseResult[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Convert sheet to json rows
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        if (!rawRows.length) {
          sheetsFeedback.push({ sheetName, rowCount: 0, skipped: true });
          continue;
        }

        // Clean columns and match aliases
        const cleanedRows: SaleRecord[] = [];
        let missingCols: string[] = [];

        for (const rawRow of rawRows) {
          const rowNorm: Record<string, unknown> = {};
          for (const key of Object.keys(rawRow)) {
            const trimmed = key.trim();
            const alias = COLUMN_ALIASES[trimmed] || trimmed;
            rowNorm[alias] = rawRow[key];
          }

          // Check required columns once on first row
          if (cleanedRows.length === 0) {
            missingCols = REQUIRED_COLUMNS.filter(c => !(c in rowNorm));
            if (missingCols.length > 0) {
              break;
            }
          }

          // Parse values
          const rawDate = rowNorm['Date'];
          let dateStr = '';
          if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
            dateStr = rawDate.toISOString().substring(0, 10);
          } else if (typeof rawDate === 'number') {
            // Excel serial date
            const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : String(rawDate);
          } else {
            const parsed = new Date(String(rawDate));
            dateStr = !isNaN(parsed.getTime()) ? parsed.toISOString().substring(0, 10) : String(rawDate);
          }

          const sales = Number(rowNorm['Sales']);
          const quantity = Number(rowNorm['Quantity']);
          const profit = Number(rowNorm['Profit']);

          if (!dateStr || isNaN(sales) || isNaN(quantity) || isNaN(profit)) {
            continue;
          }

          cleanedRows.push({
            Date: dateStr,
            Product: String(rowNorm['Product'] || 'Unknown').trim(),
            Category: String(rowNorm['Category'] || 'Unknown').trim(),
            Region: String(rowNorm['Region'] || 'Unknown').trim(),
            Sales: Math.round(sales * 100) / 100,
            Quantity: Math.round(quantity),
            Profit: Math.round(profit * 100) / 100,
          });
        }

        if (missingCols.length > 0) {
          sheetsFeedback.push({
            sheetName,
            rowCount: 0,
            skipped: true,
            missingColumns: missingCols
          });
        } else if (cleanedRows.length > 0) {
          sheetsFeedback.push({
            sheetName,
            rowCount: cleanedRows.length,
            skipped: false
          });
          parsedRecords.push(...cleanedRows);
        }
      }

      if (parsedRecords.length === 0) {
        this.uploadFeedback.set({
          type: 'error',
          message: 'No valid sales records found in workbook. Ensure required columns exist: Date, Product, Category, Region, Sales, Quantity, Profit.',
          sheets: sheetsFeedback
        });
        return;
      }

      this.rawData.set(parsedRecords);
      this.datasetName.set(file.name);
      this.isSampleData.set(false);
      this.resetFiltersToAll();

      const skippedCount = sheetsFeedback.filter(s => s.skipped).length;
      if (skippedCount > 0) {
        this.uploadFeedback.set({
          type: 'warning',
          message: `Loaded ${parsedRecords.length.toLocaleString()} records from ${file.name}. (${skippedCount} worksheet(s) skipped without sales columns).`,
          sheets: sheetsFeedback
        });
      } else {
        this.uploadFeedback.set({
          type: 'success',
          message: `Successfully loaded ${parsedRecords.length.toLocaleString()} sales records from ${file.name}.`,
          sheets: sheetsFeedback
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown parsing error';
      this.uploadFeedback.set({
        type: 'error',
        message: `Failed to parse file: ${msg}`
      });
    }
  }

  // Smart Insights computed from filtered data
  readonly smartInsights = computed(() => {
    const list = this.filteredData();
    const kpis = this.kpis();
    if (!list.length) return null;

    // Top Product
    const topProd = this.topProducts()[0];
    const topProdPct = topProd && kpis.totalSales > 0 ? Math.round((topProd.sales / kpis.totalSales) * 100) : 0;

    // Top Category
    const topCat = this.categorySales()[0];

    // Best Month
    const trend = [...this.monthlyTrend()].sort((a, b) => b.sales - a.sales);
    const bestMonth = trend[0];

    // Top Region
    const topReg = this.regionPerformance()[0];

    // Loss-making transactions
    const lossOrders = list.filter(r => r.Profit < 0);
    const totalLoss = lossOrders.reduce((sum, r) => sum + Math.abs(r.Profit), 0);

    return {
      topProduct: topProd ? { name: topProd.product, sales: topProd.sales, pct: topProdPct } : null,
      topCategory: topCat ? { name: topCat.category, sales: topCat.sales, pct: topCat.percentage } : null,
      bestMonth: bestMonth ? { label: bestMonth.label, sales: bestMonth.sales } : null,
      topRegion: topReg ? { region: topReg.region, sales: topReg.sales, profit: topReg.profit } : null,
      lossCount: lossOrders.length,
      totalLoss: Math.round(totalLoss * 100) / 100,
    };
  });

  // Add new transaction record
  addTransaction(record: SaleRecord): void {
    const current = this.rawData();
    this.rawData.set([record, ...current]);
    
    // Auto-select if new category or region
    if (!this.selectedRegions().includes(record.Region)) {
      this.selectedRegions.update(list => [...list, record.Region]);
    }
    if (!this.selectedCategories().includes(record.Category)) {
      this.selectedCategories.update(list => [...list, record.Category]);
    }
    if (!this.selectedProducts().includes(record.Product)) {
      this.selectedProducts.update(list => [...list, record.Product]);
    }

    this.uploadFeedback.set({
      type: 'success',
      message: `Transaction for "${record.Product}" ($${record.Sales.toLocaleString()}) added successfully!`
    });
  }

  // Delete transaction record
  deleteTransaction(record: SaleRecord): void {
    const current = this.rawData();
    const idx = current.indexOf(record);
    if (idx !== -1) {
      const updated = [...current];
      updated.splice(idx, 1);
      this.rawData.set(updated);
    }
  }

  // Download filtered data as Excel (.xlsx) format
  downloadFilteredExcel(): void {
    const list = this.filteredData();
    if (!list.length) {
      this.uploadFeedback.set({
        type: 'warning',
        message: 'No matching records to export under current filters.'
      });
      return;
    }

    // 1. Transactions Sheet
    const dataRows = list.map(item => ({
      'Date': item.Date,
      'Product': item.Product,
      'Category': item.Category,
      'Region': item.Region,
      'Sales': item.Sales,
      'Quantity': item.Quantity,
      'Profit': item.Profit
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);

    // Set readable column widths
    worksheet['!cols'] = [
      { wch: 14 }, // Date
      { wch: 28 }, // Product
      { wch: 20 }, // Category
      { wch: 16 }, // Region
      { wch: 14 }, // Sales
      { wch: 10 }, // Quantity
      { wch: 14 }  // Profit
    ];

    // Enable Excel autofilter on all data columns
    if (dataRows.length > 0) {
      worksheet['!autofilter'] = { ref: `A1:G${dataRows.length + 1}` };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    // 2. Executive Summary Sheet
    const kpis = this.kpis();
    const summaryRows = [
      { 'Metric': 'Report Name', 'Value': 'Filtered Sales Analytics Report' },
      { 'Metric': 'Export Date', 'Value': new Date().toISOString().substring(0, 10) },
      { 'Metric': 'Total Revenue ($)', 'Value': kpis.totalSales },
      { 'Metric': 'Total Gross Profit ($)', 'Value': kpis.totalProfit },
      { 'Metric': 'Overall Profit Margin (%)', 'Value': `${kpis.profitMargin}%` },
      { 'Metric': 'Total Orders / Transactions', 'Value': kpis.totalOrders },
      { 'Metric': 'Total Units Sold', 'Value': kpis.totalQuantity },
      { 'Metric': 'Average Order Value ($)', 'Value': kpis.avgOrderValue },
      { 'Metric': 'Active Date Range', 'Value': `${this.startDate()} to ${this.endDate()}` },
      { 'Metric': 'Regions Filtered', 'Value': this.selectedRegions().join(', ') || 'All Regions' },
      { 'Metric': 'Categories Filtered', 'Value': this.selectedCategories().join(', ') || 'All Categories' },
      { 'Metric': 'Source Dataset', 'Value': this.datasetName() }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // 3. Category Breakdown Sheet
    const catData = this.categorySales().map(c => ({
      'Category': c.category,
      'Sales ($)': c.sales,
      'Share (%)': `${c.percentage}%`
    }));
    if (catData.length) {
      const catSheet = XLSX.utils.json_to_sheet(catData);
      catSheet['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, catSheet, 'Category Performance');
    }

    // 4. Regional Performance Sheet
    const regData = this.regionPerformance().map(r => ({
      'Region': r.region,
      'Sales ($)': r.sales,
      'Profit ($)': r.profit
    }));
    if (regData.length) {
      const regSheet = XLSX.utils.json_to_sheet(regData);
      regSheet['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(workbook, regSheet, 'Regional Performance');
    }

    const dateStr = new Date().toISOString().substring(0, 10);
    const filename = `sales_report_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, filename);

    this.uploadFeedback.set({
      type: 'success',
      message: `Downloaded Excel report (${filename}) with ${list.length.toLocaleString()} records and executive summaries.`
    });
  }

  // Download template for Excel / CSV upload
  downloadTemplate(): void {
    this.downloadExcelTemplate();
  }

  // Download template specifically as Excel (.xlsx)
  downloadExcelTemplate(): void {
    const sampleRows = [
      { Date: '2026-01-15', Product: 'Wireless Earbuds', Category: 'Electronics', Region: 'West', Sales: 249.99, Quantity: 2, Profit: 65.50 },
      { Date: '2026-02-04', Product: 'Running Shoes', Category: 'Sports', Region: 'North', Sales: 135.00, Quantity: 1, Profit: 42.20 },
      { Date: '2026-02-18', Product: 'Coffee Maker', Category: 'Home & Kitchen', Region: 'East', Sales: 89.50, Quantity: 3, Profit: 28.00 },
      { Date: '2026-03-10', Product: 'Denim Jacket', Category: 'Clothing', Region: 'South', Sales: 110.00, Quantity: 2, Profit: 35.00 },
      { Date: '2026-03-22', Product: 'Yoga Mat', Category: 'Sports', Region: 'West', Sales: 45.00, Quantity: 5, Profit: 18.75 }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data Template');
    XLSX.writeFile(wb, 'sales_upload_template.xlsx');
  }

  // Download filtered data as CSV
  downloadFilteredCsv(): void {
    const list = this.filteredData();
    if (!list.length) return;

    const headers = ['Date', 'Product', 'Category', 'Region', 'Sales', 'Quantity', 'Profit'];
    const rows = list.map(item => [
      item.Date,
      `"${item.Product.replace(/"/g, '""')}"`,
      `"${item.Category.replace(/"/g, '""')}"`,
      `"${item.Region.replace(/"/g, '""')}"`,
      item.Sales,
      item.Quantity,
      item.Profit
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_sales_data_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

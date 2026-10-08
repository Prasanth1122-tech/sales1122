import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.initTheme();

    effect(() => {
      const dark = this.isDark();
      if (typeof document !== 'undefined') {
        if (dark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('sales_dashboard_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('sales_dashboard_theme', 'light');
        }
      }
    });
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('sales_dashboard_theme');
    if (saved) {
      this.isDark.set(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }
  }

  toggleTheme(): void {
    this.isDark.update(v => !v);
  }
}

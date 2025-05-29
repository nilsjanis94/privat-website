import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'inventory-theme';
  private readonly themeSubject = new BehaviorSubject<Theme>('auto');

  constructor() {
    this.initializeTheme();
    this.watchSystemTheme();
  }

  /**
   * Observable für das aktuelle Theme
   */
  get currentTheme$(): Observable<Theme> {
    return this.themeSubject.asObservable();
  }

  /**
   * Aktuelles Theme abrufen
   */
  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Prüft ob aktuell Dark Mode aktiv ist
   */
  get isDarkMode(): boolean {
    const theme = this.currentTheme;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // Auto: System-Präferenz prüfen
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Theme setzen und anwenden
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Zwischen Light/Dark togglen (auto wird zu dark)
   */
  toggleTheme(): void {
    const current = this.currentTheme;
    if (current === 'light') {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  /**
   * Theme initialisieren (aus Storage oder System)
   */
  private initializeTheme(): void {
    const savedTheme = this.loadTheme();
    this.applyTheme(savedTheme);
    this.themeSubject.next(savedTheme);
  }

  /**
   * Theme auf DOM anwenden
   */
  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Alte Theme-Klassen entfernen
    body.classList.remove('light-theme', 'dark-theme');
    
    // Neues Theme anwenden
    if (theme === 'light') {
      body.classList.add('light-theme');
    } else if (theme === 'dark') {
      body.classList.add('dark-theme');
    } else {
      // Auto: System-Präferenz verwenden
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    }
  }

  /**
   * System Theme Changes überwachen
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', () => {
      // Nur reagieren wenn 'auto' aktiv ist
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  /**
   * Theme aus LocalStorage laden
   */
  private loadTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme;
      return ['light', 'dark', 'auto'].includes(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  }

  /**
   * Theme in LocalStorage speichern
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      // LocalStorage nicht verfügbar (z.B. private mode)
      console.warn('Could not save theme preference');
    }
  }

  /**
   * Theme-Icons für UI
   */
  getThemeIcon(theme?: Theme): string {
    const currentTheme = theme || this.currentTheme;
    switch (currentTheme) {
      case 'light': return 'light_mode';
      case 'dark': return 'dark_mode';
      case 'auto': return 'brightness_auto';
      default: return 'brightness_auto';
    }
  }

  /**
   * Theme-Labels für UI
   */
  getThemeLabel(theme?: Theme): string {
    const currentTheme = theme || this.currentTheme;
    switch (currentTheme) {
      case 'light': return 'Hell';
      case 'dark': return 'Dunkel';
      case 'auto': return 'Automatisch';
      default: return 'Automatisch';
    }
  }
}

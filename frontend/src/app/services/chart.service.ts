import { Injectable } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { MonthlyExpense } from '../interfaces/inventory.interface';

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: any;
  scales?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() { }

  /**
   * Erstellt Standard-Chart-Optionen mit einheitlichem Design
   */
  createDefaultChartOptions(title: string, yAxisLabel: string = '€'): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = Number(context.parsed.y);
              return `${label}: ${this.formatCurrency(value)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              return this.formatCurrency(Number(value));
            }
          }
        }
      }
    };
  }

  /**
   * Erstellt Pie-Chart-Optionen
   */
  createPieChartOptions(title: string): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: title
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = Number(context.parsed);
              const total = (context.dataset.data as number[]).reduce((a, b) => Number(a) + Number(b), 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  /**
   * Erstellt Bar-Chart-Optionen (horizontal)
   */
  createHorizontalBarChartOptions(title: string, xAxisLabel: string = '%'): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: title
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = Number(context.parsed.x);
              return `${label}: ${this.formatPercentage(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          max: 100,
          ticks: {
            callback: (value) => {
              return this.formatPercentage(Number(value));
            }
          }
        }
      }
    };
  }

  /**
   * Konvertiert monatliche Ausgaben in Chart-Daten
   */
  convertMonthlyExpensesToChartData(monthlyExpenses: MonthlyExpense[]): ChartConfiguration['data'] {
    const labels = monthlyExpenses.map(expense => 
      expense.month_name.split(' ')[0] // Nur Monat, nicht Jahr
    );
    const values = monthlyExpenses.map(expense => Math.round(expense.total_expenses));

    return {
      labels: labels,
      datasets: [{
        label: 'Ausgaben',
        data: values,
        backgroundColor: 'rgba(124, 77, 255, 0.2)',
        borderColor: '#7C4DFF',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  }

  /**
   * Berechnet optimale Chart-Höhe basierend auf Datenanzahl
   */
  calculateChartHeight(dataPointsCount: number, minHeight: number = 300, maxHeight: number = 600): number {
    const heightPerPoint = 40;
    const calculatedHeight = Math.max(minHeight, dataPointsCount * heightPerPoint);
    return Math.min(calculatedHeight, maxHeight);
  }

  /**
   * Erstellt Farbpalette für Charts
   */
  generateColorPalette(count: number): string[] {
    const baseColors = [
      '#7C4DFF', '#FF4081', '#4CAF50', '#FFC107', 
      '#FF5722', '#2196F3', '#9C27B0', '#00BCD4',
      '#8BC34A', '#FFEB3B', '#795548', '#607D8B'
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generiere zusätzliche Farben wenn mehr benötigt
    const additionalColors = [];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle für gleichmäßige Verteilung
      additionalColors.push(`hsl(${hue}, 70%, 50%)`);
    }

    return [...baseColors, ...additionalColors];
  }

  /**
   * Formatiert Chart-Daten für bessere Performance
   */
  optimizeChartData<T>(data: T[], maxPoints: number = 50): T[] {
    if (data.length <= maxPoints) {
      return data;
    }

    // Nimm jeden n-ten Datenpunkt um die Anzahl zu reduzieren
    const step = Math.ceil(data.length / maxPoints);
    const optimized: T[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      optimized.push(data[i]);
    }

    // Stelle sicher, dass der letzte Datenpunkt enthalten ist
    if (optimized[optimized.length - 1] !== data[data.length - 1]) {
      optimized.push(data[data.length - 1]);
    }

    return optimized;
  }

  /**
   * Berechnet Suggested Max für Y-Achse mit Puffer
   */
  calculateSuggestedMax(values: number[], bufferPercent: number = 20): number {
    if (values.length === 0) return 100;
    
    const maxValue = Math.max(...values);
    return maxValue * (1 + bufferPercent / 100);
  }

  /**
   * Formatiert Labels für bessere Lesbarkeit
   */
  formatLabelsForDisplay(labels: string[], maxLength: number = 10): string[] {
    return labels.map(label => {
      if (label.length <= maxLength) return label;
      return label.substring(0, maxLength - 3) + '...';
    });
  }

  /**
   * Formatiert Währungswerte für Anzeige
   */
  formatCurrency(value: number, decimals: number = 0): string {
    return value.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Formatiert Prozent-Werte für Anzeige
   */
  formatPercentage(value: number, decimals: number = 0): string {
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + '%';
  }

  /**
   * Rundet Werte für Charts basierend auf der Größe
   */
  roundValueForChart(value: number): number {
    if (value === 0) return 0;
    
    // Für sehr kleine Werte (< 1): 2 Dezimalstellen
    if (Math.abs(value) < 1) {
      return Math.round(value * 100) / 100;
    }
    
    // Für kleine Werte (< 100): 1 Dezimalstelle
    if (Math.abs(value) < 100) {
      return Math.round(value * 10) / 10;
    }
    
    // Für größere Werte: keine Dezimalstellen
    return Math.round(value);
  }

  /**
   * Rundet Arrays von Werten für Charts
   */
  roundValuesForChart(values: number[]): number[] {
    return values.map(value => this.roundValueForChart(value));
  }

  /**
   * Formatiert große Zahlen kompakt (1K, 1M, etc.)
   */
  formatCompactNumber(value: number): string {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M€';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K€';
    }
    return this.formatCurrency(value);
  }
} 
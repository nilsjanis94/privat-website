import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardStats } from '../../../interfaces/inventory.interface';
import { ExpensesChartComponent } from '../expenses-chart/expenses-chart.component';
import { ThemeService } from '../../../services/theme.service';
import { ChartService } from '../../../services/chart.service';
import { Subscription } from 'rxjs';

// Chart.js registrieren
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard-charts',
  imports: [
    CommonModule,
    MatCardModule,
    BaseChartDirective,
    ExpensesChartComponent
  ],
  templateUrl: './dashboard-charts.component.html',
  styleUrl: './dashboard-charts.component.scss'
})
export class DashboardChartsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stats: DashboardStats | null = null;

  private themeSubscription?: Subscription;
  private isDarkMode = false;

  // Chart Data
  categoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBorderWidth: 4,
      hoverBackgroundColor: []
    }]
  };

  expensesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Ausgaben (€)',
      data: [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: '#7c3aed',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(124, 58, 237, 0.9)',
      hoverBorderColor: '#6d28d9',
      hoverBorderWidth: 3
    }]
  };

  // Chart Options
  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  expensesChartOptions: ChartConfiguration<'bar'>['options'] = {};

  constructor(
    private themeService: ThemeService,
    private chartService: ChartService
  ) {}

  ngOnInit(): void {
    this.initializeChartOptions();
    this.subscribeToThemeChanges();
    
    if (this.stats) {
      this.updateCharts();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.updateCharts();
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  private initializeChartOptions(): void {
    // Kategorien Donut Chart Optionen - vereinfacht
    this.categoryChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 24,
            usePointStyle: true,
            font: {
              size: 14,
              family: 'Inter, system-ui, sans-serif',
              weight: 500
            },
            color: this.isDarkMode ? '#e5e7eb' : '#374151',
            boxWidth: 12,
            boxHeight: 12
          }
        },
        title: {
          display: true,
          text: 'Kategorien-Verteilung'
        },
        datalabels: {
          display: true,
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 13,
            family: 'Inter, system-ui, sans-serif'
          },
          formatter: (value: number, context: any) => {
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return parseFloat(percentage) >= 5 ? percentage + '%' : '';
          },
          anchor: 'center',
          align: 'center'
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1200,
        easing: 'easeOutQuart'
      }
    };

    // Ausgaben Bar Chart Optionen - vereinfacht
    this.expensesChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Monatliche Ausgaben'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + ' €';
            }
          }
        }
      },
      layout: {
        padding: {
          top: 30,
          bottom: 10,
          left: 10,
          right: 10
        }
      }
    };
  }

  private subscribeToThemeChanges(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(() => {
      this.isDarkMode = this.themeService.isDarkMode;
      this.updateChartsForTheme();
    });
  }

  private updateCharts(): void {
    this.updateCategoryChart();
    this.updateExpensesChart();
  }

  private updateCategoryChart(): void {
    if (!this.stats?.items_by_category) return;

    const categories = Object.keys(this.stats.items_by_category);
    const values = Object.values(this.stats.items_by_category);
    
    // Verwende ChartService für Farbpalette
    const colors = this.chartService.generateColorPalette(categories.length);

    this.categoryChartData = {
      ...this.categoryChartData,
      labels: categories,
      datasets: [{
        ...this.categoryChartData.datasets[0],
        data: values,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(color => 
          color.replace('50%)', '40%)') // Darker on hover
        )
      }]
    };
  }

  private updateExpensesChart(): void {
    if (!this.stats?.monthly_expenses) return;

    // Verwende ChartService für Datenkonvertierung
    const chartData = this.chartService.convertMonthlyExpensesToChartData(this.stats.monthly_expenses);
    
    this.expensesChartData = {
      ...this.expensesChartData,
      labels: chartData.labels,
      datasets: [{
        ...this.expensesChartData.datasets[0],
        data: chartData.datasets[0].data as number[]
      }]
    };

    // Dynamische Y-Achsen-Anpassung
    const values = this.stats.monthly_expenses.map(m => m.total_expenses);
    const suggestedMax = this.chartService.calculateSuggestedMax(values);
    
    if (this.expensesChartOptions?.scales?.['y']) {
      this.expensesChartOptions.scales['y'].suggestedMax = suggestedMax;
    }
  }

  private updateChartsForTheme(): void {
    // Update chart colors based on theme
    const textColor = this.isDarkMode ? '#e5e7eb' : '#374151';
    
    if (this.categoryChartOptions?.plugins?.legend?.labels) {
      this.categoryChartOptions.plugins.legend.labels.color = textColor;
    }
    
    this.updateCharts();
  }

  // Utility methods for template
  hasCategoryData(): boolean {
    return !!(this.stats?.items_by_category && 
           Object.keys(this.stats.items_by_category).length > 0);
  }

  hasExpensesData(): boolean {
    return !!(this.stats?.monthly_expenses && 
           this.stats.monthly_expenses.length > 0);
  }
}

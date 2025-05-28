import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardStats } from '../../../interfaces/inventory.interface';

// Chart.js registrieren
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard-charts',
  imports: [
    CommonModule,
    MatCardModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard-charts.component.html',
  styleUrl: './dashboard-charts.component.scss'
})
export class DashboardChartsComponent implements OnInit, OnChanges {
  @Input() stats: DashboardStats | null = null;

  // Kategorien Donut Chart
  categoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#3f51b5', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
        '#2196f3', '#795548', '#607d8b', '#e91e63', '#00bcd4'
      ],
      borderWidth: 3,
      borderColor: '#fff',
      hoverBorderWidth: 4
    }]
  };

  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Macht es zu einem modernen Donut
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} Items (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14,
          family: 'Inter, system-ui, sans-serif'
        },
        formatter: (value: number, context: any) => {
          const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          
          // Nur Prozente über 6% anzeigen für optimale Lesbarkeit
          if (parseFloat(percentage) >= 6) {
            return percentage + '%';
          }
          return '';
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        textAlign: 'center',
        textStrokeColor: 'rgba(0, 0, 0, 0.3)',
        textStrokeWidth: 1
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  // Monatliche Ausgaben Bar Chart - MODERNISIERT
  expensesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Ausgaben (€)',
      data: [],
      backgroundColor: 'rgba(244, 67, 54, 0.8)',
      borderColor: '#d32f2f',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(244, 67, 54, 0.9)',
      hoverBorderColor: '#b71c1c',
      hoverBorderWidth: 3
    }]
  };

  expensesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            return `Ausgaben: ${context.parsed.y.toFixed(2)}€`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#374151',
        font: {
          weight: 'bold',
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        },
        formatter: (value: number) => {
          // Nur Werte über 10€ anzeigen für bessere Lesbarkeit
          if (value >= 10) {
            return value.toFixed(0) + '€';
          }
          return '';
        },
        anchor: 'end',
        align: 'top',
        offset: 8,
        textAlign: 'center',
        clip: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        suggestedMax: undefined,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value) {
            return value + '€';
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  ngOnInit(): void {
    this.updateCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.updateCharts();
    }
  }

  hasCategoryData(): boolean {
    return !!(this.stats?.items_by_category && 
           Object.keys(this.stats.items_by_category).length > 0);
  }

  hasExpensesData(): boolean {
    return !!(this.stats?.monthly_expenses && 
           this.stats.monthly_expenses.length > 0);
  }

  private updateCharts(): void {
    if (!this.stats) return;

    this.updateCategoryChart();
    this.updateExpensesChart();
  }

  private updateCategoryChart(): void {
    if (!this.stats?.items_by_category) return;

    const categories = Object.keys(this.stats.items_by_category);
    const values = Object.values(this.stats.items_by_category);

    this.categoryChartData = {
      ...this.categoryChartData,
      labels: categories,
      datasets: [{
        ...this.categoryChartData.datasets[0],
        data: values
      }]
    };
  }

  private updateExpensesChart(): void {
    if (!this.stats?.monthly_expenses) return;

    const labels = this.stats.monthly_expenses.map(expense => 
      expense.month_name.split(' ')[0] // Nur Monat, nicht Jahr
    );
    const values = this.stats.monthly_expenses.map(expense => expense.total_expenses);

    // Maximalen Wert finden und 20% Puffer hinzufügen
    const maxValue = Math.max(...values);
    const suggestedMax = maxValue * 1.2; // 20% mehr Platz für Labels

    this.expensesChartData = {
      ...this.expensesChartData,
      labels: labels,
      datasets: [{
        ...this.expensesChartData.datasets[0],
        data: values
      }]
    };

    // Y-Achse dynamisch anpassen - FIX
    if (this.expensesChartOptions?.scales?.['y']) {
      this.expensesChartOptions.scales['y'].suggestedMax = suggestedMax;
    }
  }
}

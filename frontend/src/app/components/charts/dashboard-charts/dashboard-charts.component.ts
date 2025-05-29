import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardStats } from '../../../interfaces/inventory.interface';
import { ExpensesChartComponent } from '../expenses-chart/expenses-chart.component';

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
export class DashboardChartsComponent implements OnInit, OnChanges {
  @Input() stats: DashboardStats | null = null;

  // Kategorien Donut Chart - MODERN PURPLE DESIGN
  categoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        // Lila-Pink Gradient Palette
        '#8b5cf6', // Primary Purple
        '#c026d3', // Accent Pink-Purple  
        '#7c3aed', // Primary 600
        '#a855f7', // Primary 500
        '#d946ef', // Accent 500
        '#f0abfc', // Accent 300
        '#ddd6fe', // Primary 200
        '#e879f9', // Accent 400
        '#9333ea', // Primary 700
        '#be185d', // Rose 700 for contrast
      ],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBorderWidth: 4,
      hoverBackgroundColor: [
        '#7c3aed', // Darker versions on hover
        '#a21caf',
        '#6d28d9',
        '#9333ea',
        '#c026d3',
        '#e879f9',
        '#c4b5fd',
        '#f0abfc',
        '#7e22ce',
        '#9f1239',
      ]
    }]
  };

  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // Moderner Donut-Stil
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
          color: '#374151',
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b5cf6',
        borderWidth: 2,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif',
          weight: 600
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
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
        color: '#ffffff',
        font: {
          weight: 'bold',
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        formatter: (value: number, context: any) => {
          const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          
          // Nur Prozente über 5% anzeigen für optimale Lesbarkeit
          if (parseFloat(percentage) >= 5) {
            return percentage + '%';
          }
          return '';
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        textAlign: 'center',
        textStrokeColor: 'rgba(0, 0, 0, 0.4)',
        textStrokeWidth: 2
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };

  // Monatliche Ausgaben Bar Chart - MODERN PURPLE DESIGN
  expensesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Ausgaben (€)',
      data: [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)', // Primary Purple
      borderColor: '#7c3aed', // Primary 600
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(124, 58, 237, 0.9)', // Primary 600 with opacity
      hoverBorderColor: '#6d28d9', // Primary 700
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
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b5cf6',
        borderWidth: 2,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif',
          weight: 600
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
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
          // Nur Werte über 5€ anzeigen für bessere Lesbarkeit
          if (value >= 5) {
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
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
            weight: 500
          }
        }
      },
      y: {
        beginAtZero: true,
        suggestedMax: undefined,
        grid: {
          color: 'rgba(139, 92, 246, 0.1)', // Purple grid lines
          lineWidth: 1
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
            weight: 500
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
      duration: 1200,
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

    // Y-Achse dynamisch anpassen
    if (this.expensesChartOptions?.scales?.['y']) {
      this.expensesChartOptions.scales['y'].suggestedMax = suggestedMax;
    }
  }
}

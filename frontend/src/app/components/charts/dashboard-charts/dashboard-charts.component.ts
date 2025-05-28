import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { DashboardStats } from '../../../interfaces/inventory.interface';

// Chart.js registrieren
Chart.register(...registerables);

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
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Monatliche Ausgaben Bar Chart
  expensesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Ausgaben (€)',
      data: [],
      backgroundColor: '#f44336',
      borderColor: '#d32f2f',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  expensesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Ausgaben: ${context.parsed.y.toFixed(2)}€`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + '€';
          }
        }
      }
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

    this.expensesChartData = {
      ...this.expensesChartData,
      labels: labels,
      datasets: [{
        ...this.expensesChartData.datasets[0],
        data: values
      }]
    };
  }
}

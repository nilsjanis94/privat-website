import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { BudgetService } from '../../services/budget.service';
import { InventoryService } from '../../services/inventory.service';
import { Budget } from '../../interfaces/inventory.interface';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

interface BudgetTrend {
  month: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface CategoryAnalysis {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  trend: string; // 'up', 'down', 'stable'
}

interface BudgetForecast {
  month: string;
  projectedSpending: number;
  budgetLimit: number;
  isOverBudget: boolean;
}

@Component({
  selector: 'app-budget-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    MatMenuModule,
    BaseChartDirective
  ],
  templateUrl: './budget-analytics.component.html',
  styleUrl: './budget-analytics.component.scss'
})
export class BudgetAnalyticsComponent implements OnInit, OnDestroy {
  // Make Math available in template
  Math = Math;
  
  isLoading = false;
  selectedPeriod = '6M';
  selectedComparison = 'budget-vs-actual';
  
  // Data
  budgets: Budget[] = [];
  budgetTrends: BudgetTrend[] = [];
  categoryAnalysis: CategoryAnalysis[] = [];
  budgetForecasts: BudgetForecast[] = [];
  
  // Summary Statistics
  totalBudgeted = 0;
  totalSpent = 0;
  totalVariance = 0;
  totalVariancePercent = 0;
  budgetsOverLimit = 0;
  averageUtilization = 0;
  
  // Chart Data
  trendChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };
  
  categoryChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };
  
  forecastChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };
  
  utilizationChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  // Chart Options
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Budget vs. Tatsächliche Ausgaben'
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
    }
  };

  categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Ausgaben nach Kategorien'
      }
    }
  };

  forecastChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Budget-Prognose'
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
    }
  };

  utilizationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Budget-Auslastung'
      }
    },
    scales: {
      x: {
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  private subscription = new Subscription();

  constructor(
    private budgetService: BudgetService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.budgetService.getBudgets().subscribe({
        next: (budgets) => {
          this.budgets = budgets;
          this.calculateStatistics();
          this.generateTrendData();
          this.generateCategoryAnalysis();
          this.generateForecastData();
          this.updateCharts();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Fehler beim Laden der Budget-Analytics:', error);
          this.isLoading = false;
        }
      })
    );
  }

  onPeriodChange(): void {
    this.loadAnalyticsData();
  }

  onComparisonChange(): void {
    this.updateCharts();
  }

  private calculateStatistics(): void {
    this.totalBudgeted = this.budgets.reduce((sum, budget) => sum + budget.amount, 0);
    this.totalSpent = this.budgets.reduce((sum, budget) => sum + budget.spent_this_period, 0);
    this.totalVariance = this.totalBudgeted - this.totalSpent;
    this.totalVariancePercent = this.totalBudgeted > 0 ? (this.totalVariance / this.totalBudgeted) * 100 : 0;
    this.budgetsOverLimit = this.budgets.filter(budget => budget.is_over_budget).length;
    
    // Calculate utilization percentage for each budget
    const budgetsWithUtilization = this.budgets.map(budget => ({
      ...budget,
      utilization_percentage: budget.amount > 0 ? (budget.spent_this_period / budget.amount) * 100 : 0
    }));
    
    this.averageUtilization = budgetsWithUtilization.length > 0 
      ? budgetsWithUtilization.reduce((sum, budget) => sum + budget.utilization_percentage, 0) / budgetsWithUtilization.length 
      : 0;
  }

  private generateTrendData(): void {
    // Simuliere monatliche Trend-Daten basierend auf dem gewählten Zeitraum
    const monthCount = this.selectedPeriod === '3M' ? 3 : this.selectedPeriod === '6M' ? 6 : 12;
    this.budgetTrends = [];
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('de-DE', { month: 'short', year: '2-digit' });
      
      // Simuliere Daten (in echter App würden diese vom Backend kommen)
      const planned = Math.random() * 1000 + 500;
      const actual = planned * (0.7 + Math.random() * 0.6); // 70%-130% des geplanten Budgets
      const variance = planned - actual;
      const variancePercent = (variance / planned) * 100;
      
      this.budgetTrends.push({
        month: monthName,
        planned,
        actual,
        variance,
        variancePercent
      });
    }
  }

  private generateCategoryAnalysis(): void {
    const categories = ['Lebensmittel', 'Haushalt', 'Elektronik', 'Kleidung', 'Sonstiges'];
    this.categoryAnalysis = [];
    
    categories.forEach(category => {
      const budgeted = Math.random() * 500 + 200;
      const spent = budgeted * (0.3 + Math.random() * 0.8);
      const remaining = budgeted - spent;
      const percentUsed = (spent / budgeted) * 100;
      const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
      
      this.categoryAnalysis.push({
        category,
        budgeted,
        spent,
        remaining,
        percentUsed,
        trend
      });
    });
  }

  private generateForecastData(): void {
    this.budgetForecasts = [];
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthName = date.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
      
      const budgetLimit = this.totalBudgeted;
      const projectedSpending = budgetLimit * (0.8 + Math.random() * 0.4); // 80%-120% des Budgets
      const isOverBudget = projectedSpending > budgetLimit;
      
      this.budgetForecasts.push({
        month: monthName,
        projectedSpending,
        budgetLimit,
        isOverBudget
      });
    }
  }

  private updateCharts(): void {
    this.updateTrendChart();
    this.updateCategoryChart();
    this.updateForecastChart();
    this.updateUtilizationChart();
  }

  private updateTrendChart(): void {
    this.trendChartData = {
      labels: this.budgetTrends.map(trend => trend.month),
      datasets: [
        {
          label: 'Geplant',
          data: this.budgetTrends.map(trend => trend.planned),
          borderColor: '#7C4DFF',
          backgroundColor: 'rgba(124, 77, 255, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Tatsächlich',
          data: this.budgetTrends.map(trend => trend.actual),
          borderColor: '#FF4081',
          backgroundColor: 'rgba(255, 64, 129, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  private updateCategoryChart(): void {
    this.categoryChartData = {
      labels: this.categoryAnalysis.map(cat => cat.category),
      datasets: [{
        data: this.categoryAnalysis.map(cat => cat.spent),
        backgroundColor: [
          '#7C4DFF',
          '#FF4081',
          '#4CAF50',
          '#FF9800',
          '#2196F3'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }

  private updateForecastChart(): void {
    this.forecastChartData = {
      labels: this.budgetForecasts.map(forecast => forecast.month),
      datasets: [
        {
          label: 'Budget-Limit',
          data: this.budgetForecasts.map(forecast => forecast.budgetLimit),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: false,
          borderDash: [5, 5]
        },
        {
          label: 'Prognostizierte Ausgaben',
          data: this.budgetForecasts.map(forecast => forecast.projectedSpending),
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  private updateUtilizationChart(): void {
    // Calculate utilization for chart
    const budgetsWithUtilization = this.budgets.map(budget => ({
      ...budget,
      utilization_percentage: budget.amount > 0 ? (budget.spent_this_period / budget.amount) * 100 : 0
    }));

    this.utilizationChartData = {
      labels: budgetsWithUtilization.map(budget => budget.name),
      datasets: [{
        label: 'Auslastung %',
        data: budgetsWithUtilization.map(budget => budget.utilization_percentage),
        backgroundColor: budgetsWithUtilization.map(budget => 
          budget.is_over_budget ? '#f44336' : 
          budget.utilization_percentage > 80 ? '#ff9800' : '#4caf50'
        ),
        borderColor: budgetsWithUtilization.map(budget => 
          budget.is_over_budget ? '#d32f2f' : 
          budget.utilization_percentage > 80 ? '#f57c00' : '#388e3c'
        ),
        borderWidth: 1
      }]
    };
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return 'warn';
      case 'down': return 'primary';
      default: return 'accent';
    }
  }

  exportData(): void {
    const data = {
      summary: {
        totalBudgeted: this.totalBudgeted,
        totalSpent: this.totalSpent,
        totalVariance: this.totalVariance,
        averageUtilization: this.averageUtilization
      },
      trends: this.budgetTrends,
      categories: this.categoryAnalysis,
      forecasts: this.budgetForecasts
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
} 
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
import { BudgetService, BudgetAnalyticsData, TrendDataPoint, CategoryAnalysis } from '../../services/budget.service';
import { InventoryService } from '../../services/inventory.service';
import { StatisticsService, BudgetStatistics } from '../../services/statistics.service';
import { ChartService } from '../../services/chart.service';
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
  selectedPeriod = '1M';
  selectedComparison = 'budget-vs-actual';
  
  // Data
  budgets: Budget[] = [];
  budgetTrends: BudgetTrend[] = [];
  categoryAnalysis: CategoryAnalysis[] = [];
  budgetForecasts: BudgetForecast[] = [];
  
  // Analytics-Daten aus der neuen API
  analyticsData: BudgetAnalyticsData | null = null;
  
  // Berechnete Budget-Statistiken
  budgetStats: BudgetStatistics | null = null;
  
  // Legacy fields (werden aus budgetStats abgeleitet)
  get totalBudgeted(): number { return this.budgetStats?.totalBudgeted || 0; }
  get totalSpent(): number { return this.budgetStats?.totalSpent || 0; }
  get totalVariance(): number { return this.budgetStats?.totalVariance || 0; }
  get totalVariancePercent(): number { return this.budgetStats?.totalVariancePercent || 0; }
  get budgetsOverLimit(): number { return this.budgetStats?.budgetsOverLimit || 0; }
  get averageUtilization(): number { return this.budgetStats?.averageUtilization || 0; }
  
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
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = Number(context.parsed.y);
            return `${label}: ${value.toFixed(0)}€`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number(value).toFixed(0) + '€';
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
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = Number(context.parsed);
            const total = (context.dataset.data as number[]).reduce((a, b) => Number(a) + Number(b), 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(0)}€ (${percentage}%)`;
          }
        }
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
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = Number(context.parsed.y);
            return `${label}: ${value.toFixed(0)}€`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number(value).toFixed(0) + '€';
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
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = Number(context.parsed.x);
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        max: 100,
        ticks: {
          callback: function(value) {
            return Number(value).toFixed(0) + '%';
          }
        }
      }
    }
  };

  private subscription = new Subscription();

  constructor(
    private budgetService: BudgetService,
    private inventoryService: InventoryService,
    private statisticsService: StatisticsService,
    private chartService: ChartService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    
    // Budgets laden (für Summary-Statistiken)
    this.subscription.add(
      this.budgetService.getBudgets().subscribe({
        next: (budgets) => {
          this.budgets = budgets;
          this.calculateStatistics();
        },
        error: (error) => {
          console.error('Fehler beim Laden der Budgets:', error);
        }
      })
    );
    
    // Analytics-Daten laden (echte Daten!)
    this.subscription.add(
      this.budgetService.getBudgetAnalytics(this.selectedPeriod).subscribe({
        next: (analyticsData) => {
          this.analyticsData = analyticsData;
          this.processAnalyticsData();
          this.generateForecastData(); // Forecast bleibt simuliert für jetzt
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

  private processAnalyticsData(): void {
    if (!this.analyticsData) return;
    
    // Trend-Daten von API in lokales Format konvertieren
    this.budgetTrends = this.analyticsData.trend_data.map(item => ({
      month: item.period_label,
      planned: item.planned,
      actual: item.actual,
      variance: item.variance,
      variancePercent: item.planned > 0 ? (item.variance / item.planned) * 100 : 0
    }));
    
    // Kategorie-Daten direkt von API verwenden
    this.categoryAnalysis = this.analyticsData.categories_analysis;
  }

  onPeriodChange(): void {
    this.loadAnalyticsData();
  }

  onComparisonChange(): void {
    this.updateCharts();
  }

  private calculateStatistics(): void {
    this.budgetStats = this.statisticsService.calculateBudgetStatistics(this.budgets);
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
    this.updateChartOptions();
    this.updateTrendChart();
    this.updateCategoryChart();
    this.updateForecastChart();
    this.updateUtilizationChart();
  }

  private updateChartOptions(): void {
    // Update trend chart options with dynamic title
    this.trendChartOptions = {
      ...this.trendChartOptions,
      plugins: {
        ...this.trendChartOptions?.plugins,
        title: {
          display: true,
          text: this.getChartTitle()
        }
      }
    };
  }

  private updateTrendChart(): void {
    this.trendChartData = {
      labels: this.budgetTrends.map(trend => trend.month),
      datasets: [
        {
          label: 'Geplant',
          data: this.chartService.roundValuesForChart(this.budgetTrends.map(trend => trend.planned)),
          borderColor: '#7C4DFF',
          backgroundColor: 'rgba(124, 77, 255, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Tatsächlich',
          data: this.chartService.roundValuesForChart(this.budgetTrends.map(trend => trend.actual)),
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
        data: this.chartService.roundValuesForChart(this.categoryAnalysis.map(cat => cat.spent)),
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
          data: this.chartService.roundValuesForChart(this.budgetForecasts.map(forecast => forecast.budgetLimit)),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: false,
          borderDash: [5, 5]
        },
        {
          label: 'Prognostizierte Ausgaben',
          data: this.chartService.roundValuesForChart(this.budgetForecasts.map(forecast => forecast.projectedSpending)),
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
      utilization_percentage: budget.amount > 0 ? 
        this.chartService.roundValueForChart((budget.spent_this_period / budget.amount) * 100) : 0
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

  // Hilfsmethode um Chart-Titel basierend auf Zeitraum zu generieren
  private getChartTitle(): string {
    switch (this.selectedPeriod) {
      case '1D': return 'Budget vs. Tatsächliche Ausgaben (24 Stunden)';
      case '1W': return 'Budget vs. Tatsächliche Ausgaben (7 Tage)';
      case '1M': return 'Budget vs. Tatsächliche Ausgaben (4 Wochen)';
      case '3M': return 'Budget vs. Tatsächliche Ausgaben (3 Monate)';
      case '6M': return 'Budget vs. Tatsächliche Ausgaben (6 Monate)';
      case '12M': return 'Budget vs. Tatsächliche Ausgaben (12 Monate)';
      default: return 'Budget vs. Tatsächliche Ausgaben';
    }
  }

  // Hilfsmethode um Zeitraum-spezifische Labels zu generieren
  public getTimeUnitLabel(): string {
    switch (this.selectedPeriod) {
      case '1D': return 'Stunde';
      case '1W': return 'Tag';
      case '1M': return 'Woche';
      case '3M':
      case '6M':
      case '12M': return 'Monat';
      default: return 'Zeitraum';
    }
  }
} 
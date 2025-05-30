import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Budget, BudgetDashboard } from '../interfaces/inventory.interface';
import { environment } from '../../environments/environment';

export interface BudgetAnalyticsData {
  period: string;
  trend_data: TrendDataPoint[];
  categories_analysis: CategoryAnalysis[];
  summary: {
    total_planned: number;
    total_actual: number;
    total_variance: number;
    total_items: number;
  };
}

export interface TrendDataPoint {
  period_label: string;
  planned: number;
  actual: number;
  variance: number;
  items_count: number;
}

export interface CategoryAnalysis {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percent_used: number;
  trend: 'up' | 'down' | 'stable';
  items_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.apiUrl}/budgets/`);
  }

  getBudget(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/budgets/${id}/`);
  }

  createBudget(budget: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/budgets/`, budget);
  }

  updateBudget(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/budgets/${id}/`, budget);
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/budgets/${id}/`);
  }

  getBudgetDashboard(): Observable<BudgetDashboard> {
    return this.http.get<BudgetDashboard>(`${this.apiUrl}/budget-dashboard/`);
  }

  getBudgetAnalytics(period: string = '1M'): Observable<BudgetAnalyticsData> {
    return this.http.get<BudgetAnalyticsData>(`${this.apiUrl}/budget-analytics/`, {
      params: { period }
    });
  }
}

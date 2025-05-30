import { Injectable } from '@angular/core';
import { MonthlyExpense, Budget } from '../interfaces/inventory.interface';

export interface StatisticsCalculations {
  totalExpenses: number;
  averageExpenses: number;
  maxExpenses: number;
  monthsWithExpensesCount: number;
  variance: number;
  variancePercent: number;
}

export interface BudgetStatistics {
  totalBudgeted: number;
  totalSpent: number;
  totalVariance: number;
  totalVariancePercent: number;
  budgetsOverLimit: number;
  averageUtilization: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  constructor() { }

  /**
   * Berechnet Ausgaben-Statistiken basierend auf monatlichen Ausgaben
   */
  calculateExpenseStatistics(monthlyExpenses: MonthlyExpense[]): StatisticsCalculations {
    if (!monthlyExpenses || monthlyExpenses.length === 0) {
      return {
        totalExpenses: 0,
        averageExpenses: 0,
        maxExpenses: 0,
        monthsWithExpensesCount: 0,
        variance: 0,
        variancePercent: 0
      };
    }

    const monthsWithExpenses = monthlyExpenses.filter(month => month.total_expenses > 0);
    const totalExpenses = monthlyExpenses.reduce((sum, month) => sum + month.total_expenses, 0);
    const maxExpenses = monthlyExpenses.reduce((max, month) => 
      month.total_expenses > max ? month.total_expenses : max, 0);
    
    const averageExpenses = monthsWithExpenses.length > 0 
      ? monthsWithExpenses.reduce((sum, month) => sum + month.total_expenses, 0) / monthsWithExpenses.length 
      : 0;

    // Berechne Varianz (Standard-Abweichung)
    const variance = monthsWithExpenses.length > 1 
      ? this.calculateVariance(monthsWithExpenses.map(m => m.total_expenses), averageExpenses)
      : 0;

    const variancePercent = averageExpenses > 0 ? (variance / averageExpenses) * 100 : 0;

    return {
      totalExpenses,
      averageExpenses,
      maxExpenses,
      monthsWithExpensesCount: monthsWithExpenses.length,
      variance,
      variancePercent
    };
  }

  /**
   * Berechnet Budget-Statistiken
   */
  calculateBudgetStatistics(budgets: Budget[]): BudgetStatistics {
    if (!budgets || budgets.length === 0) {
      return {
        totalBudgeted: 0,
        totalSpent: 0,
        totalVariance: 0,
        totalVariancePercent: 0,
        budgetsOverLimit: 0,
        averageUtilization: 0
      };
    }

    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent_this_period, 0);
    const totalVariance = totalBudgeted - totalSpent;
    const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
    const budgetsOverLimit = budgets.filter(budget => budget.is_over_budget).length;

    // Berechne durchschnittliche Auslastung
    const budgetsWithUtilization = budgets.map(budget => ({
      ...budget,
      utilization_percentage: budget.amount > 0 ? (budget.spent_this_period / budget.amount) * 100 : 0
    }));

    const averageUtilization = budgetsWithUtilization.length > 0 
      ? budgetsWithUtilization.reduce((sum, budget) => sum + budget.utilization_percentage, 0) / budgetsWithUtilization.length 
      : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalVariance,
      totalVariancePercent,
      budgetsOverLimit,
      averageUtilization
    };
  }

  /**
   * Berechnet Durchschnitt aus einer Array von Zahlen (nur nicht-null Werte)
   */
  calculateAverage(values: number[]): number {
    const nonZeroValues = values.filter(value => value > 0);
    if (nonZeroValues.length === 0) return 0;
    return nonZeroValues.reduce((sum, value) => sum + value, 0) / nonZeroValues.length;
  }

  /**
   * Findet den maximalen Wert in einem Array
   */
  calculateMax(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  /**
   * Berechnet die Varianz (für Standardabweichung)
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((sum, value) => sum + value, 0) / (values.length - 1);
  }

  /**
   * Berechnet Trends zwischen zwei Perioden
   */
  calculateTrend(currentValue: number, previousValue: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% Schwellenwert für "stable"
    const change = previousValue > 0 ? (currentValue - previousValue) / previousValue : 0;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  /**
   * Formatiert Prozent-Werte für Anzeige
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Berechnet Prognose basierend auf historischen Daten
   */
  calculateForecast(monthlyExpenses: MonthlyExpense[], monthsAhead: number = 3): number[] {
    if (!monthlyExpenses || monthlyExpenses.length < 2) {
      return Array(monthsAhead).fill(0);
    }

    // Einfache lineare Regression für Trend
    const recentMonths = monthlyExpenses.slice(-6); // Letzten 6 Monate für Trend
    const values = recentMonths.map(m => m.total_expenses);
    const trend = this.calculateLinearTrend(values);
    
    const lastValue = values[values.length - 1];
    const forecast: number[] = [];
    
    for (let i = 1; i <= monthsAhead; i++) {
      const projectedValue = Math.max(0, lastValue + (trend * i));
      forecast.push(projectedValue);
    }

    return forecast;
  }

  /**
   * Berechnet linearen Trend aus historischen Daten
   */
  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n + 1)) / 2; // Summe der x-Werte (1, 2, 3, ...)
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6; // Summe der x²-Werte

    // Lineare Regression: y = ax + b, hier berechnen wir nur 'a' (Steigung)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
} 
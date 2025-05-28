import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../services/inventory.service';
import { DashboardStats } from '../../interfaces/inventory.interface';
import { DashboardChartsComponent } from '../charts/dashboard-charts/dashboard-charts.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardChartsComponent
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit {
  stats: DashboardStats | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    console.log('Loading statistics...');
    this.isLoading = true;
    this.inventoryService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Statistics received:', stats);
        this.stats = stats;
        this.isLoading = false;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Statistiken:', error);
        this.error = 'Fehler beim Laden der Statistiken';
        this.isLoading = false;
      }
    });
  }

  getCategoryKeys(): string[] {
    return this.stats ? Object.keys(this.stats.items_by_category) : [];
  }

  hasData(): boolean {
    return !!(this.stats && this.stats.total_items > 0);
  }

  hasCategories(): boolean {
    return !!(this.stats && this.stats.categories_count > 0);
  }

  getTotalExpenses(): number {
    if (!this.stats?.monthly_expenses) return 0;
    return this.stats.monthly_expenses.reduce((sum, month) => sum + month.total_expenses, 0);
  }

  getAverageExpenses(): number {
    if (!this.stats?.monthly_expenses) return 0;
    
    // Nur Monate mit tatsächlichen Ausgaben berücksichtigen
    const monthsWithExpenses = this.stats.monthly_expenses.filter(month => month.total_expenses > 0);
    
    if (monthsWithExpenses.length === 0) return 0;
    
    const totalExpenses = monthsWithExpenses.reduce((sum, month) => sum + month.total_expenses, 0);
    return totalExpenses / monthsWithExpenses.length;
  }

  getMonthsWithExpensesCount(): number {
    if (!this.stats?.monthly_expenses) return 0;
    return this.stats.monthly_expenses.filter(month => month.total_expenses > 0).length;
  }

  getMaxExpenses(): number {
    if (!this.stats?.monthly_expenses) return 0;
    return this.stats.monthly_expenses.reduce((max, month) => 
      month.total_expenses > max ? month.total_expenses : max, 0);
  }

  getMaxExpensesForProgress(): number {
    const max = this.getMaxExpenses();
    return max > 0 ? max : 1; // Verhindert Division durch 0
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';
import { BudgetService } from '../../services/budget.service';
import { DashboardStats, Item, Budget, BudgetDashboard } from '../../interfaces/inventory.interface';
import { User } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';
import { BalanceUpdateComponent } from '../balance-update/balance-update.component';
import { ItemFormComponent } from '../item-form/item-form.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatGridListModule,
    MatTableModule,
    MatPaginatorModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  budgetDashboard: BudgetDashboard | null = null;
  items: Item[] = [];
  currentUser$: Observable<User | null>;
  isLoading = true;
  isLoadingBudgets = true;
  isLoadingItems = true;
  error: string | null = null;
  budgetError: string | null = null;
  
  // Tabellen-Konfiguration
  displayedColumns: string[] = ['name', 'category', 'location', 'purchase_price', 'created_at'];

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private budgetService: BudgetService,
    private dialog: MatDialog
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadBudgetDashboard();
  }

  loadDashboardStats(): void {
    console.log('Loading dashboard stats...');
    this.inventoryService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Dashboard Stats received:', stats);
        this.stats = stats;
        this.isLoading = false;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Dashboard-Statistiken:', error);
        this.error = 'Fehler beim Laden der Dashboard-Daten';
        this.isLoading = false;
        
        // Fallback-Daten für Demo-Zwecke - MIT today_expenses
        this.stats = {
          total_items: 0,
          consumed_items: 0,
          total_value: 0,
          total_purchase_price: 0,
          current_month_expenses: 0,
          today_expenses: 0,
          monthly_expenses: [],
          items_without_purchase_date: 0,
          categories_count: 0,
          balance: 0,
          items_by_category: {},
          recent_items: []
        };
      }
    });
  }

  loadBudgetDashboard(): void {
    this.budgetService.getBudgetDashboard().subscribe({
      next: (budgetData) => {
        this.budgetDashboard = budgetData;
        this.isLoadingBudgets = false;
        this.budgetError = null;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Budget-Daten:', error);
        this.budgetError = 'Budget-Daten konnten nicht geladen werden';
        this.isLoadingBudgets = false;
      }
    });
  }

  openBalanceUpdateDialog(): void {
    const dialogRef = this.dialog.open(BalanceUpdateComponent, {
      width: '500px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Dashboard-Statistiken neu laden nach Balance-Update
        this.loadDashboardStats();
      }
    });
  }

  openAddItemDialog(): void {
    // Kategorien laden für das Formular
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        const dialogRef = this.dialog.open(ItemFormComponent, {
          width: '90vw',
          maxWidth: '700px',
          maxHeight: '90vh',
          panelClass: 'item-dialog-container',
          data: { 
            item: null, // Neues Item
            categories: Array.isArray(categories) ? categories : []
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Dashboard-Daten neu laden nach erfolgreichem Hinzufügen
            this.loadDashboardStats();
          }
        });
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Kategorien für Dialog:', error);
        // Dialog trotzdem öffnen, aber ohne Kategorien
        const dialogRef = this.dialog.open(ItemFormComponent, {
          width: '90vw',
          maxWidth: '700px',
          maxHeight: '90vh',
          panelClass: 'item-dialog-container',
          data: { 
            item: null,
            categories: []
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadDashboardStats();
          }
        });
      }
    });
  }

  getCategoryKeys(): string[] {
    if (!this.stats?.items_by_category) return [];
    
    // KORRIGIERT: Sortiere Kategorien nach Anzahl der Items (absteigend)
    return Object.entries(this.stats.items_by_category)
      .sort(([,a], [,b]) => b - a) // Sortiere nach Werten absteigend
      .map(([key,]) => key); // Nur die Kategorienamen zurückgeben
  }

  // Hilfsmethoden für bessere UX
  hasData(): boolean {
    return !!(this.stats && this.stats.total_items > 0);
  }

  hasCategories(): boolean {
    return !!(this.stats && this.stats.categories_count > 0);
  }

  hasRecentItems(): boolean {
    return !!(this.stats && this.stats.recent_items && this.stats.recent_items.length > 0);
  }

  getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'Elektronik': 'devices',
      'Möbel': 'chair',
      'Kleidung': 'checkroom',
      'Bücher': 'book',
      'Küche': 'kitchen',
      'Sport': 'fitness_center',
      'Werkzeug': 'build',
      'Garten': 'yard',
      'Spielzeug': 'toys',
      'Schmuck': 'diamond',
      'Fahrzeug': 'directions_car',
      'Haushalt': 'home'
    };
    
    return iconMap[categoryName] || 'category';
  }

  getRecentItems(): Item[] {
    return this.stats?.recent_items || [];
  }

  // Budget-spezifische Hilfsmethoden
  getBudgetsOverLimit(): Budget[] {
    return this.budgetDashboard?.budgets?.filter(budget => budget.is_over_budget) || [];
  }

  getTotalBudgetUtilization(): number {
    if (!this.budgetDashboard?.summary.total_budget || this.budgetDashboard.summary.total_budget === 0) {
      return 0;
    }
    return (this.budgetDashboard.summary.total_spent / this.budgetDashboard.summary.total_budget) * 100;
  }

  getBudgetStatus(): 'good' | 'warning' | 'danger' {
    const utilization = this.getTotalBudgetUtilization();
    if (utilization < 80) return 'good';
    if (utilization < 100) return 'warning';
    return 'danger';
  }

  getBudgetStatusColor(): string {
    const status = this.getBudgetStatus();
    switch (status) {
      case 'good': return 'primary';
      case 'warning': return 'accent';
      case 'danger': return 'warn';
      default: return 'primary';
    }
  }

  getBudgetStatusIcon(): string {
    const status = this.getBudgetStatus();
    switch (status) {
      case 'good': return 'check_circle';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'help';
    }
  }

  // Navigation Hilfsmethoden
  navigateToBudgets(): void {
    // Wird im Template mit routerLink verwendet
  }

  hasBudgets(): boolean {
    return !!(this.budgetDashboard?.budgets?.length);
  }
}

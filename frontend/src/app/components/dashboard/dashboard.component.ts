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
import { DashboardStats, Item } from '../../interfaces/inventory.interface';
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
  items: Item[] = [];
  currentUser$: Observable<User | null>;
  isLoading = true;
  isLoadingItems = true;
  error: string | null = null;
  
  // Tabellen-Konfiguration
  displayedColumns: string[] = ['name', 'category', 'location', 'purchase_price', 'created_at'];

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadRecentItems();
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
        
        // Fallback-Daten für Demo-Zwecke
        this.stats = {
          total_items: 0,
          consumed_items: 0,
          total_value: 0,
          total_purchase_price: 0,
          current_month_expenses: 0,
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

  loadRecentItems(): void {
    console.log('Loading recent items...');
    this.inventoryService.getItems().subscribe({
      next: (items) => {
        console.log('Items received:', items);
        // Nur die letzten 5 Items anzeigen
        this.items = items.slice(0, 5);
        this.isLoadingItems = false;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Items:', error);
        this.isLoadingItems = false;
        this.items = [];
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
          data: { 
            item: null, // Neues Item
            categories: Array.isArray(categories) ? categories : []
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Dashboard-Daten neu laden nach erfolgreichem Hinzufügen
            this.loadDashboardStats();
            this.loadRecentItems();
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
          data: { 
            item: null,
            categories: []
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadDashboardStats();
            this.loadRecentItems();
          }
        });
      }
    });
  }

  getCategoryKeys(): string[] {
    return this.stats ? Object.keys(this.stats.items_by_category) : [];
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
}

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
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats, Item } from '../../interfaces/inventory.interface';
import { User } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';

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
  
  // Tabellen-Konfiguration
  displayedColumns: string[] = ['name', 'category', 'condition', 'current_value', 'created_at'];

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadRecentItems();
  }

  loadDashboardStats(): void {
    this.inventoryService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Dashboard-Statistiken:', error);
        this.isLoading = false;
      }
    });
  }

  loadRecentItems(): void {
    this.inventoryService.getItems().subscribe({
      next: (items) => {
        // Nur die letzten 5 Items anzeigen
        this.items = items.slice(0, 5);
        this.isLoadingItems = false;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Items:', error);
        this.isLoadingItems = false;
      }
    });
  }

  getConditionKeys(): string[] {
    return this.stats ? Object.keys(this.stats.items_by_condition) : [];
  }

  getCategoryKeys(): string[] {
    return this.stats ? Object.keys(this.stats.items_by_category) : [];
  }

  getConditionLabel(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      'neu': 'Neu',
      'sehr_gut': 'Sehr gut',
      'gut': 'Gut',
      'befriedigend': 'Befriedigend',
      'schlecht': 'Schlecht'
    };
    return conditionMap[condition] || condition;
  }

  getConditionColor(condition: string): string {
    switch (condition) {
      case 'neu': return '#4caf50';
      case 'sehr_gut': return '#8bc34a';
      case 'gut': return '#ffeb3b';
      case 'befriedigend': return '#ff9800';
      case 'schlecht': return '#f44336';
      default: return '#9e9e9e';
    }
  }
}

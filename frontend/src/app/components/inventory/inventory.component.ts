import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { ToastrService } from 'ngx-toastr';
import { InventoryService } from '../../services/inventory.service';
import { Category, Item } from '../../interfaces/inventory.interface';
import { ItemFormComponent } from '../item-form/item-form.component';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  items: Item[] = [];
  categories: Category[] = [];
  filteredItems: Item[] = [];
  
  // Filter-Eigenschaften mit automatischer Anwendung
  private _searchTerm = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(value: string) {
    this._searchTerm = value;
    this.applyFilters();
  }

  private _selectedCategory: number | null = null;
  get selectedCategory(): number | null {
    return this._selectedCategory;
  }
  set selectedCategory(value: number | null) {
    this._selectedCategory = value;
    this.applyFilters();
  }

  private _selectedCondition = '';
  get selectedCondition(): string {
    return this._selectedCondition;
  }
  set selectedCondition(value: string) {
    this._selectedCondition = value;
    this.applyFilters();
  }
  
  // Tabellen-Eigenschaften
  displayedColumns: string[] = ['name', 'category', 'condition', 'location', 'current_value', 'created_at', 'actions'];
  
  // Loading-States
  isLoading = true;
  isLoadingCategories = true;
  
  // Condition-Optionen
  conditionOptions = [
    { value: 'neu', label: 'Neu' },
    { value: 'sehr_gut', label: 'Sehr gut' },
    { value: 'gut', label: 'Gut' },
    { value: 'befriedigend', label: 'Befriedigend' },
    { value: 'schlecht', label: 'Schlecht' }
  ];

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadItems();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = Array.isArray(categories) ? categories : [];
        this.isLoadingCategories = false;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Kategorien:', error);
        this.categories = [];
        this.isLoadingCategories = false;
      }
    });
  }

  loadItems(): void {
    this.isLoading = true;
    this.inventoryService.getItems().subscribe({
      next: (response) => {
        this.items = Array.isArray(response) ? response : [];
        this.filteredItems = [...this.items]; // Gefilterte Items initialisieren
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Items:', error);
        this.items = [];
        this.filteredItems = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredItems = this.items.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesCategory = !this.selectedCategory || 
        item.category === this.selectedCategory;
      
      const matchesCondition = !this.selectedCondition || 
        item.condition === this.selectedCondition;
      
      return matchesSearch && matchesCategory && matchesCondition;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.selectedCondition = '';
    this.filteredItems = [...this.items];
  }

  openItemDialog(item?: Item): void {
    // Kategorien explizit neu laden vor Dialog-Öffnung
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = Array.isArray(categories) ? categories : [];
        
        // Dialog öffnen mit frischen Kategorien
        const dialogRef = this.dialog.open(ItemFormComponent, {
          width: '90vw',
          maxWidth: '700px',
          maxHeight: '90vh',
          data: { 
            item: item || null, 
            categories: this.categories
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadItems();
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
            item: item || null, 
            categories: []
          }
        });
      }
    });
  }

  openCategoryDialog(category?: Category): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      data: { category: category || null },
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  deleteItem(item: Item): void {
    if (confirm(`Möchten Sie "${item.name}" wirklich löschen?`)) {
      this.inventoryService.deleteItem(item.id).subscribe({
        next: () => {
          this.loadItems();
          this.toastr.success('Gegenstand gelöscht!');
        },
        error: (error: any) => {
          console.error('Fehler beim Löschen:', error);
          this.toastr.error('Fehler beim Löschen des Gegenstands');
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (category.items_count > 0) {
      this.toastr.warning('Kategorie kann nicht gelöscht werden, da sie noch Gegenstände enthält.');
      return;
    }

    if (confirm(`Möchten Sie die Kategorie "${category.name}" wirklich löschen?`)) {
      this.inventoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
          this.toastr.success('Kategorie gelöscht!');
        },
        error: (error: any) => {
          console.error('Fehler beim Löschen der Kategorie:', error);
          this.toastr.error('Fehler beim Löschen der Kategorie');
        }
      });
    }
  }

  getConditionLabel(condition: string): string {
    const option = this.conditionOptions.find(opt => opt.value === condition);
    return option ? option.label : condition;
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

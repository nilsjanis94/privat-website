import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { InventoryService } from '../../services/inventory.service';
import { Item, Category } from '../../interfaces/inventory.interface';
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
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSlideToggleModule
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  items: Item[] = [];
  categories: Category[] = [];
  filteredItems: Item[] = [];

  // Filter-Properties
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

  // Tabellen-Konfiguration (condition und current_value entfernt)
  displayedColumns: string[] = ['name', 'quantity', 'category', 'location', 'purchase_price', 'created_at', 'actions'];

  // Loading States
  isLoading = true;
  isLoadingCategories = true;

  // Toggle für verbrauchte Items
  showConsumedItems = false;

  // Toggle für Kategorie-Anzeige
  showAllCategories = false;

  // Paginierung
  pageSize = 25;
  currentPage = 0;
  paginatedItems: Item[] = [];

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadItems();
    this.setResponsivePageSize();
    
    // Listen für Fenster-Resize-Events
    window.addEventListener('resize', () => {
      this.setResponsivePageSize();
    });
  }

  // Responsive Page Size basierend auf Bildschirmgröße
  setResponsivePageSize(): void {
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 480) {
      // Mobile: Weniger Items pro Seite
      this.pageSize = 5;
    } else if (screenWidth <= 768) {
      // Tablet: Mittlere Anzahl
      this.pageSize = 8;
    } else {
      // Desktop: Normale Anzahl
      this.pageSize = 25;
    }
    
    // Pagination neu berechnen bei Änderung
    this.updatePaginatedItems();
  }

  // Getter für responsive Pagination-Optionen
  get responsivePaginationOptions(): number[] {
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 480) {
      return [5, 10, 15];
    } else if (screenWidth <= 768) {
      return [8, 15, 25];
    } else {
      return [10, 25, 50, 100];
    }
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
    this.inventoryService.getItems(this.showConsumedItems).subscribe({
      next: (response) => {
        this.items = Array.isArray(response) ? response : [];
        
        // Filter verbrauchte Items basierend auf showConsumedItems
        if (!this.showConsumedItems) {
          this.items = this.items.filter(item => !item.consumed);
        }
        
        this.filteredItems = [...this.items];
        this.applyFilters(); // Filter nach dem Laden anwenden (inkl. Paginierung)
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Items:', error);
        this.items = [];
        this.filteredItems = [];
        this.paginatedItems = [];
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
      
      return matchesSearch && matchesCategory;
    });
    
    // Reset auf erste Seite bei neuen Filtern
    this.currentPage = 0;
    this.updatePaginatedItems();
  }

  updatePaginatedItems(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.filteredItems.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedItems();
    
    // Auf mobilen Geräten nach oben scrollen für bessere UX
    if (window.innerWidth <= 768) {
      // Scroll zur Items-Card oder zum oberen Paginator
      const itemsCard = document.querySelector('.items-card');
      if (itemsCard) {
        itemsCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = null;
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
          panelClass: 'item-dialog-container',
          data: { 
            item: item || null, 
            categories: this.categories
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Items UND Kategorien neu laden (falls neue Kategorie erstellt wurde)
            this.loadItems();
            this.loadCategories();
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
            item: item || null, 
            categories: []
          }
        });

        // WICHTIG: Auch hier das Dialog-Ergebnis abfangen!
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadItems();
            this.loadCategories();
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

  onShowConsumedToggle(): void {
    this.loadItems();
  }

  markAsConsumed(item: Item): void {
    this.inventoryService.markItemConsumed(item.id).subscribe({
      next: (response) => {
        this.toastr.success(`${item.name} wurde als verbraucht markiert`);
        this.loadItems();
      },
      error: (error) => {
        console.error('Fehler beim Markieren als verbraucht:', error);
        this.toastr.error('Fehler beim Markieren als verbraucht');
      }
    });
  }

  unmarkAsConsumed(item: Item): void {
    this.inventoryService.unmarkItemConsumed(item.id).subscribe({
      next: (response) => {
        this.toastr.success(`${item.name} ist wieder verfügbar`);
        this.loadItems();
      },
      error: (error) => {
        console.error('Fehler beim Rückgängigmachen:', error);
        this.toastr.error('Fehler beim Rückgängigmachen');
      }
    });
  }

  filterByCategory(categoryId: number): void {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  clearCategoryFilter(): void {
    this.selectedCategory = null;
    this.applyFilters();
  }

  clearSearchFilter(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  toggleConsumedFilter(): void {
    this.showConsumedItems = !this.showConsumedItems;
    this.onShowConsumedToggle();
  }

  clearAllFilters(): void {
    this.selectedCategory = null;
    this.searchTerm = '';
    this.showConsumedItems = false;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.searchTerm || this.showConsumedItems);
  }

  hasSearchOrCategoryFilters(): boolean {
    return !!(this.selectedCategory || this.searchTerm);
  }

  clearSearchAndCategoryFilters(): void {
    this.selectedCategory = null;
    this.searchTerm = '';
    this.applyFilters();
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  }

  onSearchInput(): void {
    // Debounced search - optional für bessere Performance
    this.applyFilters();
  }

  getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'elektronik': 'devices',
      'möbel': 'chair', 
      'kleidung': 'checkroom',
      'küche': 'kitchen',
      'bücher': 'book',
      'medien': 'movie',
      'sport': 'sports_soccer',
      'freizeit': 'sports_esports',
      'werkzeug': 'build',
      'garten': 'yard',
      'auto': 'directions_car',
      'lebensmittel': 'restaurant',
      'getränke': 'local_drink',
      'hygiene': 'soap',
      'reinigung': 'cleaning_services',
      'büro': 'business_center',
      'spielzeug': 'toys',
      'haustier': 'pets',
      'medizin': 'medical_services',
      'sonstiges': 'category'
    };
    
    const normalizedName = categoryName.toLowerCase().trim();
    
    // Suche nach Teilübereinstimmungen
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedName.includes(key)) {
        return icon;
      }
    }
    
    return 'category'; // Standard-Icon für unbekannte Kategorien
  }

  // Fehlerbehandlung für Produktbilder
  onImageError(event: any): void {
    // Verstecke das Bild wenn es nicht geladen werden kann
    const img = event.target as HTMLImageElement;
    if (img && img.parentElement) {
      img.parentElement.style.display = 'none';
    }
  }
}

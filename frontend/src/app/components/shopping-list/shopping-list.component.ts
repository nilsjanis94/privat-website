import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ThemeService } from '../../services/theme.service';
import { Item } from '../../interfaces/inventory.interface';
import { Observable } from 'rxjs';

interface ShoppingListItem {
  id?: number;
  name: string;
  category: string;
  last_consumed_date: string;
  days_since_consumed: number;
  purchase_frequency: number;
  total_consumed_quantity: number;
  average_consumption_quantity: number;
  last_purchase_price: number;
  priority_score: number;
  barcode?: string;
  image_url?: string;
  quantity_needed: number;
  is_selected: boolean;
  suggestion_reason: string;
}

interface ManualShoppingItem {
  name: string;
  category: string;
  quantity: number;
  notes?: string;
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  smartSuggestions: ShoppingListItem[] = [];
  manualItems: ManualShoppingItem[] = [];
  selectedItems: ShoppingListItem[] = [];
  
  loading = false;
  newItemName = '';
  newItemCategory = '';
  newItemQuantity = 1;
  newItemNotes = '';

  // Statistics
  totalItems = 0;
  estimatedCost = 0;
  highPriorityCount = 0;

  // Theme
  currentTheme$: Observable<string>;

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.currentTheme$ = this.themeService.currentTheme$;
  }

  ngOnInit(): void {
    this.loadSmartSuggestions();
    this.loadManualItems();
  }

  async loadSmartSuggestions(): Promise<void> {
    this.loading = true;
    try {
      // Hole alle verbrauchten Items der letzten 90 Tage
      const consumedItems = await this.inventoryService.getConsumedItems(90).toPromise();
      
      if (consumedItems && consumedItems.length > 0) {
        this.smartSuggestions = this.analyzeConsumptionPatterns(consumedItems);
        this.calculateStatistics();
      }
    } catch (error) {
      console.error('Fehler beim Laden der Smart Suggestions:', error);
      this.snackBar.open('Fehler beim Laden der Vorschläge', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private analyzeConsumptionPatterns(consumedItems: Item[]): ShoppingListItem[] {
    const itemMap = new Map<string, ShoppingListItem>();

    // Gruppiere Items nach Name
    consumedItems.forEach(item => {
      const key = item.name.toLowerCase();
      
      if (!itemMap.has(key)) {
        const daysSinceConsumed = this.calculateDaysSince(item.updated_at || item.created_at);
        
        // Sicherheitscheck für purchase_price
        const safePrice = this.ensureValidPrice(item.purchase_price);
        const safeQuantity = Math.max(1, item.quantity || 1); // Mindestens 1
        
        const priorityScore = this.calculatePriorityScore(item, daysSinceConsumed, 1, safeQuantity);
        
        itemMap.set(key, {
          id: item.id,
          name: item.name,
          category: item.category_name || 'Sonstiges',
          last_consumed_date: item.updated_at || item.created_at,
          days_since_consumed: daysSinceConsumed,
          purchase_frequency: 1,
          total_consumed_quantity: safeQuantity,
          average_consumption_quantity: safeQuantity,
          last_purchase_price: safePrice,
          priority_score: priorityScore,
          barcode: item.barcode || '',
          image_url: item.image_url || '',
          quantity_needed: this.calculateQuantityNeeded(safeQuantity, daysSinceConsumed, 1),
          is_selected: false,
          suggestion_reason: this.generateSuggestionReason(daysSinceConsumed, priorityScore, safeQuantity)
        });
      } else {
        // Update Frequenz und Preis mit sicherer Berechnung
        const existing = itemMap.get(key)!;
        existing.purchase_frequency++;
        
        const currentPrice = this.ensureValidPrice(item.purchase_price);
        const averagePrice = (existing.last_purchase_price + currentPrice) / 2;
        existing.last_purchase_price = this.ensureValidPrice(averagePrice);
        
        const safeQuantity = Math.max(1, item.quantity || 1);
        existing.total_consumed_quantity += safeQuantity;
        existing.average_consumption_quantity = existing.total_consumed_quantity / existing.purchase_frequency;
        
        existing.priority_score = this.calculatePriorityScore(item, existing.days_since_consumed, existing.purchase_frequency, existing.average_consumption_quantity);
        
        // Update quantity_needed basierend auf neuen Daten
        existing.quantity_needed = this.calculateQuantityNeeded(
          existing.average_consumption_quantity, 
          existing.days_since_consumed, 
          existing.purchase_frequency
        );
        
        // Update suggestion reason
        existing.suggestion_reason = this.generateSuggestionReason(
          existing.days_since_consumed, 
          existing.priority_score, 
          existing.average_consumption_quantity
        );
      }
    });

    // Sortiere nach Priorität (höchste zuerst)
    return Array.from(itemMap.values())
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 20); // Max 20 Vorschläge
  }

  private ensureValidPrice(price: any): number {
    // Konvertiere zu Number und prüfe auf Gültigkeit
    let numPrice = Number(price);
    
    // Wenn ungültig, setze auf 0
    if (isNaN(numPrice) || !isFinite(numPrice) || numPrice < 0) {
      numPrice = 0;
    }
    
    // Runde auf 2 Dezimalstellen um Floating-Point-Fehler zu vermeiden
    return Math.round(numPrice * 100) / 100;
  }

  private calculateDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculatePriorityScore(item: Item, daysSinceConsumed: number, frequency = 1, averageQuantity = 1): number {
    let score = 0;
    
    // Basis-Score basierend auf Tagen seit Verbrauch
    if (daysSinceConsumed < 7) score += 100;
    else if (daysSinceConsumed < 14) score += 80;
    else if (daysSinceConsumed < 30) score += 60;
    else if (daysSinceConsumed < 60) score += 40;
    else score += 20;
    
    // Frequenz-Bonus
    score += frequency * 10;
    
    // NEU: Quantitäts-Bonus - höhere Mengen = höhere Priorität
    if (averageQuantity >= 5) score += 25;
    else if (averageQuantity >= 3) score += 15;
    else if (averageQuantity >= 2) score += 10;
    else if (averageQuantity > 1) score += 5;
    
    // Preis-Faktor (günstigere Items bekommen höhere Priorität)
    if (item.purchase_price && item.purchase_price < 5) score += 20;
    else if (item.purchase_price && item.purchase_price < 15) score += 10;
    
    // Kategorie-Priorität
    const highPriorityCategories = ['Lebensmittel', 'Drogerie', 'Haushalt'];
    if (highPriorityCategories.includes(item.category_name || '')) {
      score += 15;
    }

    return Math.min(score, 250); // Max 250 Punkte (erhöht wegen Quantitäts-Bonus)
  }

  private calculateQuantityNeeded(averageQuantity: number, daysSince: number, frequency: number): number {
    // Basis: Durchschnittliche Verbrauchsmenge
    let neededQuantity = Math.ceil(averageQuantity);
    
    // Faktor basierend auf Zeit seit letztem Verbrauch
    if (daysSince < 7) {
      // Sehr aktuell - normale Menge
      neededQuantity = Math.ceil(averageQuantity);
    } else if (daysSince < 14) {
      // Etwas länger her - etwas mehr
      neededQuantity = Math.ceil(averageQuantity * 1.2);
    } else if (daysSince < 30) {
      // Länger her - mehr
      neededQuantity = Math.ceil(averageQuantity * 1.5);
    } else {
      // Sehr lange her - viel mehr
      neededQuantity = Math.ceil(averageQuantity * 2);
    }
    
    // Frequenz-Faktor: Häufig gekaufte Items brauchen mehr
    if (frequency >= 5) {
      neededQuantity = Math.ceil(neededQuantity * 1.3);
    } else if (frequency >= 3) {
      neededQuantity = Math.ceil(neededQuantity * 1.2);
    }
    
    // Minimum 1, Maximum 20 (um übertriebene Vorschläge zu vermeiden)
    return Math.max(1, Math.min(neededQuantity, 20));
  }

  private generateSuggestionReason(days: number, score: number, quantity: number): string {
    const quantityText = quantity > 1 ? ` (⌀ ${quantity.toFixed(1)}x pro Kauf)` : '';
    
    if (days < 7) return `Vor ${days} Tagen verbraucht - Sehr aktuell!${quantityText}`;
    if (days < 14) return `Vor ${days} Tagen verbraucht - Könnte nötig sein${quantityText}`;
    if (days < 30) return `Vor ${days} Tagen verbraucht${quantityText}`;
    if (score > 80) return `Häufig gekauft - Wahrscheinlich wieder nötig${quantityText}`;
    return `Letzter Verbrauch vor ${days} Tagen${quantityText}`;
  }

  private calculateStatistics(): void {
    this.totalItems = this.smartSuggestions.length;
    
    // Sichere Berechnung der Gesamtkosten
    this.estimatedCost = this.smartSuggestions.reduce((sum, item) => {
      const safePrice = this.ensureValidPrice(item.last_purchase_price);
      return sum + safePrice;
    }, 0);
    
    // Runde das Endergebnis zur Sicherheit
    this.estimatedCost = this.ensureValidPrice(this.estimatedCost);
    
    this.highPriorityCount = this.smartSuggestions.filter(item => item.priority_score > 80).length;
  }

  toggleItemSelection(item: ShoppingListItem): void {
    item.is_selected = !item.is_selected;
    this.updateSelectedItems();
  }

  private updateSelectedItems(): void {
    this.selectedItems = this.smartSuggestions.filter(item => item.is_selected);
  }

  addManualItem(): void {
    if (!this.newItemName.trim()) {
      this.snackBar.open('Bitte einen Artikel-Namen eingeben', 'OK', { duration: 3000 });
      return;
    }

    const newItem: ManualShoppingItem = {
      name: this.newItemName.trim(),
      category: this.newItemCategory.trim() || 'Sonstiges',
      quantity: this.newItemQuantity,
      notes: this.newItemNotes.trim()
    };

    this.manualItems.push(newItem);
    this.resetManualForm();
    this.snackBar.open('Artikel zur Liste hinzugefügt', 'OK', { duration: 2000 });
  }

  removeManualItem(index: number): void {
    this.manualItems.splice(index, 1);
    this.snackBar.open('Artikel entfernt', 'OK', { duration: 2000 });
  }

  private resetManualForm(): void {
    this.newItemName = '';
    this.newItemCategory = '';
    this.newItemQuantity = 1;
    this.newItemNotes = '';
  }

  getPriorityIcon(score: number): string {
    if (score > 120) return 'priority_high';
    if (score > 80) return 'trending_up';
    if (score > 40) return 'schedule';
    return 'low_priority';
  }

  getPriorityColor(score: number): string {
    if (score > 120) return 'warn';
    if (score > 80) return 'accent';
    return 'primary';
  }

  startShopping(): void {
    if (this.selectedItems.length === 0 && this.manualItems.length === 0) {
      this.snackBar.open('Bitte mindestens einen Artikel auswählen', 'OK', { duration: 3000 });
      return;
    }

    // Für später: Einkaufsmodus starten
    this.snackBar.open('Einkaufsmodus wird in einer späteren Version verfügbar sein', 'OK', { duration: 3000 });
  }

  loadManualItems(): void {
    // Später: Aus LocalStorage oder API laden
    const saved = localStorage.getItem('manual_shopping_items');
    if (saved) {
      this.manualItems = JSON.parse(saved);
    }
  }

  saveManualItems(): void {
    localStorage.setItem('manual_shopping_items', JSON.stringify(this.manualItems));
  }

  ngOnDestroy(): void {
    this.saveManualItems();
  }
} 
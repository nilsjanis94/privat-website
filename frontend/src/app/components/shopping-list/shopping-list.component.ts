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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
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
  store?: string;
}

interface ManualShoppingItem {
  name: string;
  category: string;
  quantity: number;
  notes?: string;
  store?: string;
}

interface ShoppingSessionItem {
  id: string;
  name: string;
  category: string;
  planned_quantity: number;
  purchased_quantity: number;
  planned_price?: number;
  actual_price?: number;
  is_purchased: boolean;
  source: 'smart' | 'manual';
  original_item?: ShoppingListItem | ManualShoppingItem;
  notes?: string;
  store?: string;
}

interface ShoppingSession {
  id: string;
  start_time: Date;
  end_time?: Date;
  items: ShoppingSessionItem[];
  total_planned_cost: number;
  total_actual_cost: number;
  status: 'active' | 'completed' | 'cancelled';
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
    MatAutocompleteModule,
    MatOptionModule,
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
  
  // Shopping Session
  currentShoppingSession: ShoppingSession | null = null;
  isShoppingActive = false;
  shoppingItems: ShoppingSessionItem[] = [];
  
  loading = false;
  newItemName = '';
  newItemCategory = '';
  newItemQuantity = 1;
  newItemNotes = '';
  newItemStore = '';

  // NEU: Häufige deutsche Läden
  commonStores = [
    'REWE',
    'EDEKA', 
    'LIDL',
    'ALDI',
    'dm',
    'Rossmann',
    'Kaufland',
    'Real',
    'PENNY',
    'Netto',
    'Müller',
    'MediaMarkt',
    'Saturn',
    'Bauhaus',
    'OBI',
    'Apotheke',
    'Bäckerei',
    'Metzgerei'
  ];

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
    this.loadActiveShoppingSession();
  }

  async loadSmartSuggestions(): Promise<void> {
    this.loading = true;
    try {
      // Hole alle verbrauchten Items der letzten 90 Tage
      const consumedItems = await this.inventoryService.getConsumedItems(90).toPromise();
      
      // Hole aktuelle Inventar-Items um fast aufgebrauchte Items zu finden
      const currentInventory = await this.inventoryService.getItems(false).toPromise();
      
      let allSuggestions: ShoppingListItem[] = [];
      
      // 1. Analyse verbrauchter Items (HÖCHSTE Priorität)
      if (consumedItems && consumedItems.length > 0) {
        const consumedSuggestions = this.analyzeConsumptionPatterns(consumedItems, 'consumed');
        allSuggestions.push(...consumedSuggestions);
      }
      
      // 2. Analyse fast aufgebrauchter Items (MITTLERE Priorität)
      if (currentInventory && currentInventory.length > 0) {
        const lowStockSuggestions = this.analyzeLowStockItems(currentInventory);
        allSuggestions.push(...lowStockSuggestions);
      }
      
      // 3. Filtere Duplikate und Items die heute gekauft wurden
      this.smartSuggestions = this.filterAndDeduplicateSuggestions(allSuggestions, currentInventory || []);
      
      this.calculateStatistics();
    } catch (error) {
      console.error('Fehler beim Laden der Smart Suggestions:', error);
      this.snackBar.open('Fehler beim Laden der Vorschläge', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private analyzeLowStockItems(currentInventory: Item[]): ShoppingListItem[] {
    const lowStockItems: ShoppingListItem[] = [];
    
    currentInventory.forEach(item => {
      // Berechne intelligenten Schwellenwert basierend auf ursprünglicher Kaufmenge
      const threshold = this.calculateStockThreshold(item.quantity, item);
      
      if (item.quantity <= threshold && item.quantity > 0 && !item.consumed) {
        console.log(`✅ LOW STOCK DETECTED: ${item.name} (${item.quantity} <= ${threshold})`);
        
        const daysSincePurchase = item.purchase_date ? this.calculateDaysSince(item.purchase_date) : 0;
        const safePrice = this.ensureValidPrice(item.purchase_price);
        
        // Priorität: MITTLERE Priorität für fast aufgebrauchte Items
        const priorityScore = this.calculatePriorityScore(item, daysSincePurchase, 1, item.quantity, 'low_stock');
        
        lowStockItems.push({
          id: item.id,
          name: item.name,
          category: item.category_name || 'Sonstiges',
          last_consumed_date: item.updated_at || item.created_at,
          days_since_consumed: daysSincePurchase,
          purchase_frequency: 1, // Unbekannt für aktive Items
          total_consumed_quantity: item.quantity,
          average_consumption_quantity: item.quantity,
          last_purchase_price: safePrice,
          priority_score: priorityScore,
          barcode: item.barcode || '',
          image_url: item.image_url || '',
          quantity_needed: this.calculateQuantityNeeded(item.quantity, daysSincePurchase, 1),
          is_selected: false,
          suggestion_reason: `Nur noch ${item.quantity} Stück - Fast aufgebraucht! 🟡`,
          store: item.location
        });
      }
    });
    
    return lowStockItems;
  }

  private calculateStockThreshold(currentQuantity: number, item: Item): number {
    // VERWENDUNG der ursprünglichen Kaufmenge für intelligente Schwellenwerte!
    const originalQuantity = item.initial_quantity || currentQuantity;
    
    console.log(`Threshold calculation for ${item.name}: current=${currentQuantity}, original=${originalQuantity}, initial_quantity=${item.initial_quantity}`);
    
    // Schwellenwerte basierend auf ursprünglicher Kaufmenge
    if (originalQuantity >= 20) {
      return 5; // Bei ursprünglich 20+ Stück → Vorschlag ab 5 oder weniger
    } else if (originalQuantity >= 15) {
      return 4; // Bei ursprünglich 15-19 Stück → Vorschlag ab 4 oder weniger  
    } else if (originalQuantity >= 10) {
      return 3; // Bei ursprünglich 10-14 Stück → Vorschlag ab 3 oder weniger
    } else if (originalQuantity >= 6) {
      return 2; // Bei ursprünglich 6-9 Stück → Vorschlag ab 2 oder weniger
    } else if (originalQuantity >= 3) {
      return 1; // Bei ursprünglich 3-5 Stück → Vorschlag ab 1 oder weniger
    } else {
      return 0; // Bei ursprünglich 1-2 Stück → erst bei komplett verbraucht
    }
  }

  private filterAndDeduplicateSuggestions(allSuggestions: ShoppingListItem[], currentInventory: Item[]): ShoppingListItem[] {
    const suggestionMap = new Map<string, ShoppingListItem>();
    
    // Gruppiere nach Namen und behalte nur die beste Suggestion
    allSuggestions.forEach(suggestion => {
      const key = suggestion.name.toLowerCase();
      
      if (!suggestionMap.has(key)) {
        suggestionMap.set(key, suggestion);
      } else {
        // Wenn bereits vorhanden, behalte die mit höherer Priorität
        const existing = suggestionMap.get(key)!;
        if (suggestion.priority_score > existing.priority_score) {
          suggestionMap.set(key, suggestion);
        }
      }
    });
    
    // Filtere Items aus, die heute gekauft wurden oder bereits ausreichend vorrätig sind
    return Array.from(suggestionMap.values()).filter(suggestion => {
      // Prüfe ob das Item heute gekauft wurde
      const boughtToday = currentInventory.some(inventoryItem =>
        inventoryItem.name.toLowerCase() === suggestion.name.toLowerCase() &&
        inventoryItem.purchase_date === new Date().toISOString().split('T')[0]
      );
      
      // Prüfe ob bereits ausreichend vorrätig (für verbrauchte Items)
      const sufficientStock = currentInventory.some(inventoryItem => 
        inventoryItem.name.toLowerCase() === suggestion.name.toLowerCase() &&
        inventoryItem.quantity > this.calculateStockThreshold(inventoryItem.quantity, inventoryItem) &&
        !inventoryItem.consumed
      );
      
      if (boughtToday) {
        return false;
      }
      
      if (sufficientStock) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => b.priority_score - a.priority_score) // Sortiere nach Priorität
    .slice(0, 25); // Max 25 Vorschläge (erhöht wegen zwei Quellen)
  }

  private analyzeConsumptionPatterns(consumedItems: Item[], source: 'consumed' | 'low_stock' = 'consumed'): ShoppingListItem[] {
    const itemMap = new Map<string, ShoppingListItem>();

    // Gruppiere Items nach Name
    consumedItems.forEach(item => {
      const key = item.name.toLowerCase();
      
      if (!itemMap.has(key)) {
        const daysSinceConsumed = this.calculateDaysSince(item.updated_at || item.created_at);
        
        // Sicherheitscheck für purchase_price
        const safePrice = this.ensureValidPrice(item.purchase_price);
        const safeQuantity = Math.max(1, item.quantity || 1); // Mindestens 1
        
        const priorityScore = this.calculatePriorityScore(item, daysSinceConsumed, 1, safeQuantity, source);
        
        // Angepasste suggestion_reason basierend auf source
        let suggestionReason: string;
        if (source === 'consumed') {
          suggestionReason = this.generateSuggestionReason(daysSinceConsumed, priorityScore, safeQuantity) + ' 🔴';
        } else {
          suggestionReason = `Nur noch ${safeQuantity} Stück - Fast aufgebraucht! 🟡`;
        }
        
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
          suggestion_reason: suggestionReason,
          store: item.location
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
        
        existing.priority_score = this.calculatePriorityScore(item, existing.days_since_consumed, existing.purchase_frequency, existing.average_consumption_quantity, source);
        
        // Update quantity_needed basierend auf neuen Daten
        existing.quantity_needed = this.calculateQuantityNeeded(
          existing.average_consumption_quantity, 
          existing.days_since_consumed, 
          existing.purchase_frequency
        );
        
        // Update suggestion reason mit korrektem Emoji
        if (source === 'consumed') {
          existing.suggestion_reason = this.generateSuggestionReason(
            existing.days_since_consumed, 
            existing.priority_score, 
            existing.average_consumption_quantity
          ) + ' 🔴';
        }
      }
    });

    // Sortiere nach Priorität (höchste zuerst) - keine Begrenzung hier, da wir später filtern
    return Array.from(itemMap.values())
      .sort((a, b) => b.priority_score - a.priority_score);
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

  private calculatePriorityScore(item: Item, daysSinceConsumed: number, frequency = 1, averageQuantity = 1, source: 'consumed' | 'low_stock' = 'consumed'): number {
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

    // NEU: Quelle-basierte Gewichtung
    if (source === 'consumed') {
      // Komplett verbrauchte Items: HÖCHSTE Priorität
      score += 100;
    } else if (source === 'low_stock') {
      // Fast aufgebrauchte Items: MITTLERE Priorität
      score += 50;
    }

    return Math.min(score, 400); // Max 400 Punkte (erhöht wegen neuer Gewichtung)
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
      notes: this.newItemNotes.trim(),
      store: this.newItemStore.trim()
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
    this.newItemStore = '';
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

    // Erstelle neue Shopping Session
    this.currentShoppingSession = {
      id: this.generateShoppingSessionId(),
      start_time: new Date(),
      items: [],
      total_planned_cost: 0,
      total_actual_cost: 0,
      status: 'active'
    };

    // Konvertiere ausgewählte Smart Suggestions
    this.selectedItems.forEach(item => {
      const shoppingItem: ShoppingSessionItem = {
        id: `smart_${item.id || Date.now()}_${Math.random()}`,
        name: item.name,
        category: item.category,
        planned_quantity: item.quantity_needed,
        purchased_quantity: 0,
        planned_price: item.last_purchase_price,
        actual_price: 0,
        is_purchased: false,
        source: 'smart',
        original_item: item,
        notes: item.barcode ? `Barcode: ${item.barcode}` : '',
        store: item.store || this.getDefaultStoreForCategory(item.category)
      };
      this.currentShoppingSession!.items.push(shoppingItem);
    });

    // Konvertiere manuelle Items
    this.manualItems.forEach(item => {
      const shoppingItem: ShoppingSessionItem = {
        id: `manual_${Date.now()}_${Math.random()}`,
        name: item.name,
        category: item.category,
        planned_quantity: item.quantity,
        purchased_quantity: 0,
        planned_price: 0,
        actual_price: 0,
        is_purchased: false,
        source: 'manual',
        original_item: item,
        notes: item.notes || '',
        store: item.store || ''
      };
      this.currentShoppingSession!.items.push(shoppingItem);
    });

    this.shoppingItems = [...this.currentShoppingSession.items];
    this.calculateShoppingTotals();
    this.isShoppingActive = true;
    
    this.snackBar.open('🛒 Einkauf gestartet! Viel Erfolg!', 'OK', { 
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private generateShoppingSessionId(): string {
    return `shopping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toggleItemPurchased(item: ShoppingSessionItem): void {
    item.is_purchased = !item.is_purchased;
    
    if (item.is_purchased) {
      // Setze purchased_quantity auf planned_quantity falls nicht bereits gesetzt
      if (item.purchased_quantity === 0) {
        item.purchased_quantity = item.planned_quantity;
      }
      // Setze actual_price auf planned_price falls nicht bereits gesetzt
      if (item.actual_price === 0 && item.planned_price) {
        item.actual_price = item.planned_price;
      }
    } else {
      // Reset beim "un-checken"
      item.purchased_quantity = 0;
      item.actual_price = 0;
    }
    
    this.calculateShoppingTotals();
    this.updateShoppingSession();
  }

  updateItemQuantity(item: ShoppingSessionItem, quantity: number): void {
    item.purchased_quantity = Math.max(0, quantity);
    this.calculateShoppingTotals();
    this.updateShoppingSession();
  }

  updateItemPrice(item: ShoppingSessionItem, price: number): void {
    item.actual_price = Math.max(0, this.ensureValidPrice(price));
    this.calculateShoppingTotals();
    this.updateShoppingSession();
  }

  private calculateShoppingTotals(): void {
    if (!this.currentShoppingSession) return;

    this.currentShoppingSession.total_planned_cost = this.shoppingItems.reduce(
      (sum, item) => sum + ((item.planned_price || 0) * item.planned_quantity), 0
    );
    
    this.currentShoppingSession.total_actual_cost = this.shoppingItems.reduce(
      (sum, item) => sum + ((item.actual_price || 0) * item.purchased_quantity), 0
    );

    // Runde zur Sicherheit
    this.currentShoppingSession.total_planned_cost = this.ensureValidPrice(this.currentShoppingSession.total_planned_cost);
    this.currentShoppingSession.total_actual_cost = this.ensureValidPrice(this.currentShoppingSession.total_actual_cost);
  }

  private updateShoppingSession(): void {
    if (this.currentShoppingSession) {
      this.currentShoppingSession.items = [...this.shoppingItems];
      // Speichere Session in LocalStorage für Persistenz
      localStorage.setItem('current_shopping_session', JSON.stringify(this.currentShoppingSession));
    }
  }

  async completeShoppingSession(): Promise<void> {
    if (!this.currentShoppingSession) return;

    const purchasedItems = this.shoppingItems.filter(item => item.is_purchased);
    
    if (purchasedItems.length === 0) {
      this.snackBar.open('Keine Artikel als gekauft markiert', 'OK', { duration: 3000 });
      return;
    }

    try {
      this.loading = true;
      
      // Lade alle Kategorien um Namen zu IDs zu mappen
      const categories = await this.inventoryService.getCategories().toPromise();
      
      // Lade alle Items (inklusive verbrauchter) um Duplikate zu vermeiden
      const allItems = await this.inventoryService.getItems(true).toPromise();
      
      // Füge gekaufte Artikel zum Inventar hinzu
      for (const item of purchasedItems) {
        // Finde Kategorie ID basierend auf Namen
        let categoryId: number | undefined;
        if (categories && categories.length > 0) {
          const category = categories.find(cat => 
            cat.name && cat.name.toLowerCase() === item.category.toLowerCase()
          );
          categoryId = category?.id;
        }

        // Prüfe ob bereits ein verbrauchtes Item mit gleichem Namen existiert
        const existingConsumedItem = allItems?.find(existingItem => 
          existingItem.name.toLowerCase() === item.name.toLowerCase() && 
          existingItem.consumed === true
        );

        if (existingConsumedItem) {
          // Reaktiviere das bestehende Item
          const updateData = {
            consumed: false,
            quantity: item.purchased_quantity,
            purchase_price: item.actual_price || existingConsumedItem.purchase_price || 0,
            purchase_date: new Date().toISOString().split('T')[0],
            expiry_date: this.calculateDefaultExpiryDate(item.category),
            // NEU: Setze initial_quantity falls es null ist (ältere Items)
            initial_quantity: existingConsumedItem.initial_quantity || item.purchased_quantity,
            // Behalte bestehende Werte für Pflichtfelder
            name: existingConsumedItem.name,
            category: existingConsumedItem.category,
            description: existingConsumedItem.description || `Wiedergekauft am ${new Date().toLocaleDateString('de-DE')} bei ${item.store || 'unbekannt'}`,
            location: item.store || existingConsumedItem.location || this.getDefaultStoreForCategory(item.category), // NEU: Update Store
            notes: `Wiedergekauft am ${new Date().toLocaleDateString('de-DE')}${item.notes ? ` - ${item.notes}` : ''}`,
            // Behalte Barcode und Bild vom ursprünglichen Item oder update sie
            barcode: item.source === 'smart' && item.original_item ? 
              (item.original_item as ShoppingListItem).barcode || existingConsumedItem.barcode : 
              existingConsumedItem.barcode || '',
            image_url: item.source === 'smart' && item.original_item ? 
              (item.original_item as ShoppingListItem).image_url || existingConsumedItem.image_url : 
              existingConsumedItem.image_url || ''
          };

          try {
            const updateResponse = await this.inventoryService.updateItem(existingConsumedItem.id, updateData).toPromise();
            console.log('Item erfolgreich reaktiviert:', item.name);
            console.log('Backend Response:', updateResponse);
            console.log('Reaktiviertes Item sollte jetzt verfügbar sein mit:', {
              id: existingConsumedItem.id,
              name: updateData.name,
              quantity: updateData.quantity,
              consumed: updateData.consumed
            });
          } catch (itemError: any) {
            console.error('Fehler beim Reaktivieren von Item:', item.name, itemError);
            console.error('Update data war:', updateData);
            this.handleItemError(item.name, itemError);
            throw itemError;
          }
        } else {
          // Erstelle neues Item (wie bisher)
          const inventoryItem = {
            name: item.name,
            category: categoryId, // Verwende category ID statt category_name
            quantity: item.purchased_quantity,
            purchase_price: item.actual_price || 0,
            purchase_date: new Date().toISOString().split('T')[0],
            expiry_date: this.calculateDefaultExpiryDate(item.category),
            location: '', // Standort im Haus - leer lassen für spätere Zuordnung
            store: item.store || this.getDefaultStoreForCategory(item.category), // NEU: Verwende dediziertes store Feld
            description: `Einkauf vom ${new Date().toLocaleDateString('de-DE')} bei ${item.store || 'unbekannt'}`,
            barcode: item.source === 'smart' && item.original_item ? 
              (item.original_item as ShoppingListItem).barcode || '' : '',
            image_url: item.source === 'smart' && item.original_item ? 
              (item.original_item as ShoppingListItem).image_url || '' : '',
            notes: item.notes || ''
          };

          try {
            await this.inventoryService.addItem(inventoryItem).toPromise();
            console.log('Neues Item erfolgreich erstellt:', item.name);
          } catch (itemError: any) {
            console.error('Fehler beim Erstellen von Item:', item.name, itemError);
            this.handleItemError(item.name, itemError);
            throw itemError;
          }
        }
      }

      // Beende Shopping Session
      this.currentShoppingSession.status = 'completed';
      this.currentShoppingSession.end_time = new Date();
      
      // Speichere abgeschlossene Session in Historie
      this.saveCompletedShoppingSession();
      
      // Reset State
      this.resetShoppingState();
      
      this.snackBar.open(
        `🎉 Einkauf abgeschlossen! ${purchasedItems.length} Artikel zum Inventar hinzugefügt`, 
        'OK', 
        { duration: 5000 }
      );

      // Aktualisiere Smart Suggestions nach dem Einkauf
      console.log('Lade Smart Suggestions neu...');
      await this.loadSmartSuggestions();
      
    } catch (error) {
      console.error('Allgemeiner Fehler beim Abschließen des Einkaufs:', error);
      this.snackBar.open('Fehler beim Abschließen des Einkaufs - siehe Konsole für Details', 'OK', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  cancelShoppingSession(): void {
    if (!this.currentShoppingSession) return;

    this.currentShoppingSession.status = 'cancelled';
    this.resetShoppingState();
    
    this.snackBar.open('Einkauf abgebrochen', 'OK', { duration: 2000 });
  }

  private resetShoppingState(): void {
    this.currentShoppingSession = null;
    this.isShoppingActive = false;
    this.shoppingItems = [];
    
    // Lösche aktive Session aus LocalStorage
    localStorage.removeItem('current_shopping_session');
    
    // Reset selections
    this.selectedItems.forEach(item => item.is_selected = false);
    this.selectedItems = [];
    this.manualItems = [];
  }

  private saveCompletedShoppingSession(): void {
    if (!this.currentShoppingSession) return;

    const history = this.getShoppingHistory();
    history.push(this.currentShoppingSession);
    
    // Behalte nur die letzten 50 Sessions
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    localStorage.setItem('shopping_history', JSON.stringify(history));
  }

  private getShoppingHistory(): ShoppingSession[] {
    const history = localStorage.getItem('shopping_history');
    return history ? JSON.parse(history) : [];
  }

  private calculateDefaultExpiryDate(category: string): string {
    const today = new Date();
    let daysToAdd = 365; // Default: 1 Jahr
    
    // Kategorie-spezifische Standardwerte
    switch (category.toLowerCase()) {
      case 'lebensmittel':
      case 'frisch':
        daysToAdd = 7;
        break;
      case 'milchprodukte':
        daysToAdd = 14;
        break;
      case 'konserven':
        daysToAdd = 730; // 2 Jahre
        break;
      case 'drogerie':
      case 'kosmetik':
        daysToAdd = 365; // 1 Jahr
        break;
      case 'reinigung':
      case 'haushalt':
        daysToAdd = 1095; // 3 Jahre
        break;
    }
    
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + daysToAdd);
    return expiryDate.toISOString().split('T')[0];
  }

  getShoppingProgress(): { completed: number; total: number; percentage: number } {
    if (!this.isShoppingActive || this.shoppingItems.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const completed = this.shoppingItems.filter(item => item.is_purchased).length;
    const total = this.shoppingItems.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  }

  getItemImageUrl(item: ShoppingSessionItem): string | undefined {
    if (item.source === 'smart' && item.original_item) {
      const smartItem = item.original_item as ShoppingListItem;
      return smartItem.image_url;
    }
    return undefined;
  }

  // Beim Komponenten-Start prüfen ob eine aktive Session existiert
  private loadActiveShoppingSession(): void {
    const savedSession = localStorage.getItem('current_shopping_session');
    if (savedSession) {
      try {
        this.currentShoppingSession = JSON.parse(savedSession);
        this.shoppingItems = [...this.currentShoppingSession!.items];
        this.isShoppingActive = true;
        this.calculateShoppingTotals();
        
        this.snackBar.open('Aktive Einkaufssession wiederhergestellt', 'OK', { duration: 3000 });
      } catch (error) {
        console.error('Fehler beim Laden der Shopping Session:', error);
        localStorage.removeItem('current_shopping_session');
      }
    }
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

  private handleItemError(itemName: string, error: any): void {
    // Detaillierte Fehlermeldung
    let errorMessage = `Fehler bei "${itemName}": `;
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage += error.error;
      } else if (error.error.message) {
        errorMessage += error.error.message;
      } else {
        // Zeige alle Validierungsfehler
        const errors = [];
        for (const [field, fieldErrors] of Object.entries(error.error)) {
          if (Array.isArray(fieldErrors)) {
            errors.push(`${field}: ${fieldErrors.join(', ')}`);
          } else {
            errors.push(`${field}: ${fieldErrors}`);
          }
        }
        errorMessage += errors.join('; ');
      }
    } else {
      errorMessage += error.message || 'Unbekannter Fehler';
    }
    
    this.snackBar.open(errorMessage, 'OK', { duration: 10000 });
  }

  private getDefaultStoreForCategory(category: string): string {
    // Intelligente Laden-Zuordnung basierend auf Kategorie
    switch (category.toLowerCase()) {
      case 'lebensmittel':
      case 'frisch':
      case 'milchprodukte':
      case 'konserven':
      case 'getränke':
        return 'REWE';
      case 'drogerie':
      case 'kosmetik':
      case 'pflege':
      case 'hygiene':
        return 'dm';
      case 'elektronik':
      case 'technik':
        return 'MediaMarkt';
      case 'haushalt':
      case 'reinigung':
        return 'LIDL';
      case 'medizin':
      case 'gesundheit':
        return 'Apotheke';
      case 'baumarkt':
      case 'garten':
        return 'Bauhaus';
      default:
        return 'REWE'; // Standard für unbekannte Kategorien
    }
  }

  // NEU: Gruppiere Shopping Items nach Läden
  getItemsByStore(): { [store: string]: ShoppingSessionItem[] } {
    const itemsByStore: { [store: string]: ShoppingSessionItem[] } = {};
    
    this.shoppingItems.forEach(item => {
      const store = item.store || 'Unbekannt';
      if (!itemsByStore[store]) {
        itemsByStore[store] = [];
      }
      itemsByStore[store].push(item);
    });
    
    return itemsByStore;
  }

  // NEU: Hole sortierte Store-Namen
  getSortedStoreNames(): string[] {
    const stores = Object.keys(this.getItemsByStore());
    return stores.sort();
  }

  // NEU: Berechne Statistiken pro Store
  getStoreStats(store: string): { total: number; purchased: number; percentage: number } {
    const storeItems = this.getItemsByStore()[store] || [];
    const total = storeItems.length;
    const purchased = storeItems.filter(item => item.is_purchased).length;
    const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0;
    
    return { total, purchased, percentage };
  }
} 
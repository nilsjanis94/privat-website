import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { InventoryService } from '../../services/inventory.service';
import { ToastrService } from 'ngx-toastr';
import { ItemCondition, ItemLocation } from '../../interfaces/inventory.interface';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="dialog-container">
      <h2>{{ isEditMode ? 'Gegenstand bearbeiten' : 'Neuer Gegenstand' }}</h2>
      
      <!-- Grundinformationen -->
      <div class="section">
        <h3>Grundinformationen</h3>
        
        <div class="form-group">
          <label for="name">Name *</label>
          <input 
            id="name"
            type="text" 
            [(ngModel)]="item.name" 
            placeholder="z.B. Laptop, Kaffeemaschine"
            class="form-input"
            required>
        </div>
        
        <div class="form-group">
          <label for="description">Beschreibung</label>
          <input 
            id="description"
            type="text"
            [(ngModel)]="item.description" 
            placeholder="Kurze Beschreibung (max. 200 Zeichen)"
            maxlength="200"
            class="form-input">
          <small class="char-counter">{{ item.description?.length || 0 }}/200</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">Kategorie *</label>
            <select 
              id="category"
              [(ngModel)]="item.category" 
              class="form-input"
              required>
              <option value="">Kategorie wählen...</option>
              <option *ngFor="let category of getCategories()" [value]="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="location">Standort</label>
            <select 
              id="location"
              [(ngModel)]="item.location" 
              class="form-input">
              <option value="">Standort wählen...</option>
              <option value="wohnzimmer">Wohnzimmer</option>
              <option value="schlafzimmer">Schlafzimmer</option>
              <option value="kueche">Küche</option>
              <option value="bad">Bad</option>
              <option value="buero">Büro</option>
              <option value="keller">Keller</option>
              <option value="dachboden">Dachboden</option>
              <option value="garage">Garage</option>
              <option value="balkon">Balkon</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Kaufinformationen -->
      <div class="section">
        <h3>Kaufinformationen</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="purchase_date">Kaufdatum</label>
            <input 
              id="purchase_date"
              type="date" 
              [(ngModel)]="item.purchase_date" 
              class="form-input">
          </div>
          
          <div class="form-group">
            <label for="purchase_price">Kaufpreis (€)</label>
            <input 
              id="purchase_price"
              type="number" 
              [(ngModel)]="item.purchase_price" 
              step="0.01"
              min="0"
              placeholder="0.00"
              class="form-input">
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="dialog-actions">
        <button 
          type="button" 
          (click)="onCancel()" 
          class="btn btn-cancel">
          Abbrechen
        </button>
        
        <button 
          type="button"
          [disabled]="!isFormValid() || isLoading"
          (click)="onSubmit()"
          class="btn btn-submit">
          {{ isLoading ? 'Speichere...' : (isEditMode ? 'Aktualisieren' : 'Hinzufügen') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      width: 100%;
      max-width: 700px;
      min-width: 320px;
      max-height: 85vh;
      overflow-y: auto;
      box-sizing: border-box;
    }
    
    h2 {
      margin: 0 0 24px 0;
      color: #333;
      font-size: 1.5rem;
      text-align: center;
    }
    
    .section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .section:last-of-type {
      border-bottom: none;
    }
    
    h3 {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
    .form-group {
      margin-bottom: 16px;
      width: 100%;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #555;
      font-size: 14px;
    }
    
    .form-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
      background-color: white;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #3f51b5;
      box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.1);
    }
    
    select.form-input {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
      padding-right: 40px;
    }
    
    textarea.form-input {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      min-width: 120px;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    
    .btn-cancel {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-submit {
      background-color: #007bff;
      color: white;
    }
    
    .btn:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .dialog-container {
        padding: 16px;
        max-width: 95vw;
      }
      
      .form-row {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
    
    @media (max-width: 480px) {
      .dialog-container {
        padding: 12px;
        max-width: 100vw;
        max-height: 90vh;
      }
      
      .form-input {
        font-size: 16px;
      }
      
      .dialog-actions {
        flex-direction: column;
        gap: 8px;
      }
      
      .btn {
        width: 100%;
        padding: 14px;
        font-size: 16px;
      }
    }
    
    .char-counter {
      color: #666;
      font-size: 12px;
      margin-top: 4px;
      display: block;
    }
    
    .help-text {
      color: #666;
      font-size: 12px;
      margin-top: 4px;
      display: block;
      font-style: italic;
    }
  `]
})
export class ItemFormComponent {
  item: any = {
    name: '',
    description: '',
    category: '',
    location: '',
    purchase_date: '',
    purchase_price: null
  };
  
  isLoading = false;
  isEditMode = false;

  constructor(
    private inventoryService: InventoryService,
    private dialogRef: MatDialogRef<ItemFormComponent>,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.item;
    
    if (this.isEditMode && data.item) {
      this.item = { ...data.item };
      if (this.item.purchase_date) {
        this.item.purchase_date = this.item.purchase_date.split('T')[0];
      }
    }
  }

  getCategories() {
    return this.data?.categories || [];
  }

  isFormValid(): boolean {
    return !!(this.item.name?.trim() && this.item.category);
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isLoading = true;
      
      const itemData = {
        ...this.item,
        purchase_price: this.item.purchase_price ? parseFloat(this.item.purchase_price.toString().replace(',', '.')) : null,
        purchase_date: this.item.purchase_date || null
      };

      const operation = this.isEditMode
        ? this.inventoryService.updateItem(this.item.id, itemData)
        : this.inventoryService.createItem(itemData);

      operation.subscribe({
        next: (result) => {
          const successMessage = this.isEditMode 
            ? `"${this.item.name}" wurde erfolgreich aktualisiert!`
            : `"${this.item.name}" wurde erfolgreich erstellt!`;
          
          this.toastr.success(successMessage, 'Erfolg!');
          this.dialogRef.close(result);
        },
        error: (error: any) => {
          console.error('Fehler beim Speichern:', error);
          this.toastr.error('Fehler beim Speichern', 'Fehler!');
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

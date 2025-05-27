import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { InventoryService } from '../../services/inventory.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="dialog-container">
      <h2>{{ isEditMode ? 'Kategorie bearbeiten' : 'Neue Kategorie' }}</h2>
      
      <div class="form-group">
        <label for="name">Kategorie-Name *</label>
        <input 
          id="name"
          type="text" 
          [(ngModel)]="categoryName"
          placeholder="z.B. Elektronik, Möbel, Kleidung"
          class="form-input"
          required>
      </div>
      
      <div class="form-group">
        <label for="description">Beschreibung</label>
        <textarea 
          id="description"
          [(ngModel)]="categoryDescription"
          rows="3"
          placeholder="Beschreibung der Kategorie..."
          class="form-input"></textarea>
      </div>

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
      min-width: 400px;
      max-width: 500px;
    }
    
    h2 {
      margin: 0 0 24px 0;
      color: #333;
      font-size: 1.5rem;
      text-align: center;
    }
    
    .form-group {
      margin-bottom: 20px;
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
      font-family: inherit;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #3f51b5;
      box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.1);
    }
    
    textarea.form-input {
      resize: vertical;
      min-height: 80px;
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
  `]
})
export class CategoryFormComponent {
  categoryName = '';
  categoryDescription = '';
  isLoading = false;
  isEditMode = false;

  constructor(
    private inventoryService: InventoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.category;
    
    if (this.isEditMode && data.category) {
      this.categoryName = data.category.name || '';
      this.categoryDescription = data.category.description || '';
    }
  }

  isFormValid(): boolean {
    return !!(this.categoryName && this.categoryName.trim());
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;
    
    const categoryData = {
      name: this.categoryName.trim(),
      description: this.categoryDescription.trim()
    };

    this.inventoryService.createCategory(categoryData).subscribe({
      next: (result) => {
        this.toastr.success('Kategorie erfolgreich erstellt!');
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.toastr.error('Fehler beim Speichern der Kategorie');
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

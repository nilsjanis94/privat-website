import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../services/inventory.service';
import { ToastrService } from 'ngx-toastr';
import { ItemCondition, ItemLocation } from '../../interfaces/inventory.interface';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemFormComponent {
  itemForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private dialogRef: MatDialogRef<ItemFormComponent>,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.item;
    this.categories = data?.categories || [];
    
    if (this.isEditMode && data.item) {
      this.itemForm = this.fb.group({
        name: [data.item.name, Validators.required],
        description: [data.item.description],
        category: [data.item.category, Validators.required],
        quantity: [data.item.quantity || 1, [Validators.required, Validators.min(1)]],
        location: [data.item.location],
        purchase_date: [data.item.purchase_date ? data.item.purchase_date.split('T')[0] : ''],
        purchase_price: [data.item.purchase_price ? data.item.purchase_price.toString() : ''],
        barcode: [data.item.barcode || ''],
        image_url: [data.item.image_url || '']
      });
    } else {
      this.itemForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        category: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        location: [''],
        purchase_date: [''],
        purchase_price: [''],
        barcode: [''],
        image_url: ['']
      });
    }
    
    // Prüfen ob keine Kategorien vorhanden sind
    if (this.categories.length === 0) {
      this.showNoCategoriesDialog();
    }
  }

  getCategories() {
    return this.categories;
  }

  showNoCategoriesDialog(): void {
    this.toastr.info(
      'Du musst zuerst eine Kategorie erstellen, bevor du einen Gegenstand hinzufügen kannst.',
      'Keine Kategorien vorhanden',
      { timeOut: 5000 }
    );
  }

  openCategoryDialog(): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      position: { top: '2vh' },
      panelClass: 'category-dialog-container',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.id) {
        // Neue Kategorie zur lokalen Liste hinzufügen
        this.categories.push(result);
        this.data.categories = this.categories;
        
        // Neue Kategorie automatisch auswählen
        this.itemForm.patchValue({ category: result.id });
        
        this.toastr.success(`Kategorie "${result.name}" wurde erstellt und ausgewählt!`, 'Erfolg!');
      }
    });
  }

  loadCategories(): void {
    this.inventoryService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  getErrorMessage(field: string): string {
    const control = this.itemForm.get(field);
    if (control?.hasError('required')) {
      return `${field} ist erforderlich`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.isLoading = true;
      const formData = { ...this.itemForm.value };
      
      // Datum korrekt formatieren falls vorhanden - VERBESSERTES HANDLING
      if (formData.purchase_date) {
        const date = new Date(formData.purchase_date);
        if (!isNaN(date.getTime())) {
          // Lokales Datum verwenden (KEINE UTC-Konvertierung!)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formData.purchase_date = `${year}-${month}-${day}`;
        } else {
          formData.purchase_date = null;
        }
      }
      
      // Leere Strings zu null konvertieren
      if (formData.purchase_price === '') {
        formData.purchase_price = null;
      }
      if (formData.purchase_date === '') {
        formData.purchase_date = null;
      }
      
      console.log('Sending data:', formData); // Debug-Ausgabe
      
      const operation = this.isEditMode
        ? this.inventoryService.updateItem(this.data.item.id, formData)
        : this.inventoryService.createItem(formData);

      operation.subscribe({
        next: (result) => {
          console.log('Item saved successfully:', result);
          this.toastr.success('Erfolgreich gespeichert!', 'Erfolg!');
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error saving item:', error);
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

import { Component, Inject } from '@angular/core';
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
  styleUrls: ['./item-form.component.scss']
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
        location: [data.item.location],
        purchase_date: [data.item.purchase_date ? data.item.purchase_date.split('T')[0] : ''],
        purchase_price: [data.item.purchase_price ? data.item.purchase_price.toString() : '']
      });
    } else {
      this.itemForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        category: ['', Validators.required],
        location: [''],
        purchase_date: [''],
        purchase_price: ['']
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
      width: '400px',
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
      const formData = this.itemForm.value;
      
      const operation = this.isEditMode
        ? this.inventoryService.updateItem(this.data.item.id, formData)
        : this.inventoryService.createItem(formData);

      operation.subscribe({
        next: (result) => {
          this.toastr.success('Erfolgreich gespeichert!', 'Erfolg!');
          this.dialogRef.close(result);
        },
        error: (error) => {
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

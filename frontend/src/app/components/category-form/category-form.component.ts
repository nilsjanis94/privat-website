import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../services/inventory.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CategoryFormComponent {
  categoryForm: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!(data && data.category);
    
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });

    if (this.isEditMode && data.category) {
      this.categoryForm.patchValue({
        name: data.category.name,
        description: data.category.description || ''
      });
    }
  }

  getErrorMessage(field: string): string {
    const control = this.categoryForm.get(field);
    if (control?.hasError('required')) {
      return `${field === 'name' ? 'Name' : 'Beschreibung'} ist erforderlich`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Maximal ${maxLength} Zeichen erlaubt`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    this.isLoading = true;
    
    const categoryData = {
      name: this.categoryForm.value.name.trim(),
      description: this.categoryForm.value.description?.trim() || ''
    };

    if (this.isEditMode) {
      this.inventoryService.updateCategory(this.data.category.id, categoryData).subscribe({
        next: (result: any) => {
          this.toastr.success('Kategorie erfolgreich aktualisiert!');
          this.dialogRef.close(result);
        },
        error: (error: any) => {
          this.toastr.error('Fehler beim Aktualisieren der Kategorie');
          this.isLoading = false;
        }
      });
    } else {
      this.inventoryService.createCategory(categoryData).subscribe({
        next: (result: any) => {
          this.toastr.success('Kategorie erfolgreich erstellt!');
          this.dialogRef.close(result);
        },
        error: (error: any) => {
          this.toastr.error('Fehler beim Erstellen der Kategorie');
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

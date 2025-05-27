import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-balance-update',
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './balance-update.component.html',
  styleUrl: './balance-update.component.scss'
})
export class BalanceUpdateComponent {
  amount: number = 0;
  operation: 'add' | 'subtract' | 'set' = 'add';
  description: string = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<BalanceUpdateComponent>,
    private toastr: ToastrService
  ) {}

  isFormValid(): boolean {
    return this.amount > 0;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;

    this.authService.updateBalance(this.amount, this.operation, this.description).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        let message = '';
        switch (this.operation) {
          case 'add':
            message = `${this.amount}€ wurden zu Ihrem Kontostand hinzugefügt`;
            break;
          case 'subtract':
            message = `${this.amount}€ wurden von Ihrem Kontostand abgezogen`;
            break;
          case 'set':
            message = `Kontostand wurde auf ${this.amount}€ gesetzt`;
            break;
        }
        
        this.toastr.success(message, 'Kontostand aktualisiert');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Fehler beim Aktualisieren des Kontostands:', error);
        
        let errorMessage = 'Fehler beim Aktualisieren des Kontostands';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        this.toastr.error(errorMessage, 'Fehler');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hidePasswordConfirm = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const passwordConfirm = form.get('password_confirm');
    
    if (password && passwordConfirm && password.value !== passwordConfirm.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastr.success('Erfolgreich registriert!');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          
          if (error.error && typeof error.error === 'object') {
            // Spezifische Fehlermeldungen für jedes Feld
            Object.keys(error.error).forEach(key => {
              const messages = error.error[key];
              const fieldName = this.getFieldDisplayName(key);
              
              if (Array.isArray(messages)) {
                messages.forEach(message => {
                  this.toastr.error(`${fieldName}: ${message}`);
                });
              } else {
                this.toastr.error(`${fieldName}: ${messages}`);
              }
            });
          } else {
            this.toastr.error('Registrierung fehlgeschlagen. Versuchen Sie es erneut.');
          }
        }
      });
    }
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'email': 'E-Mail',
      'username': 'Benutzername',
      'password': 'Passwort',
      'first_name': 'Vorname',
      'last_name': 'Nachname'
    };
    return fieldNames[fieldName] || fieldName;
  }
}

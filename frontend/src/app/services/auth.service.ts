import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Auto-Login beim App-Start wenn Token vorhanden
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      // User-Daten vom Server holen
      this.http.get<any>(`${environment.apiUrl}/auth/profile/`).subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: () => {
          // Token ungültig - ausloggen
          this.logout();
        }
      });
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          this.currentUserSubject.next(response.user);
          
          // Benachrichtigung über erstellte Standard-Kategorien
          if (response.created_categories && response.created_categories.length > 0) {
            this.toastr.success(
              `${response.created_categories.length} Standard-Kategorien wurden für dich erstellt: ${response.created_categories.join(', ')}`,
              'Willkommen zurück!',
              { timeOut: 5000 }
            );
          }
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register/`, userData)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          this.currentUserSubject.next(response.user);
          
          // Benachrichtigung über erstellte Standard-Kategorien
          if (response.created_categories && response.created_categories.length > 0) {
            this.toastr.success(
              `Willkommen! ${response.created_categories.length} Standard-Kategorien wurden für dich erstellt: ${response.created_categories.join(', ')}`,
              'Registrierung erfolgreich!',
              { timeOut: 7000 }
            );
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  updateBalance(amount: number, operation: 'add' | 'subtract' | 'set', description?: string): Observable<any> {
    const payload = {
      amount: amount,
      operation: operation,
      description: description || ''
    };
    
    return this.http.post<any>(`${environment.apiUrl}/auth/update-balance/`, payload)
      .pipe(
        tap(response => {
          // User-Daten aktualisieren nach Balance-Update
          this.refreshUserData();
        })
      );
  }

  private refreshUserData(): void {
    this.http.get<any>(`${environment.apiUrl}/auth/profile/`).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        console.error('Fehler beim Aktualisieren der Benutzerdaten:', error);
      }
    });
  }
}

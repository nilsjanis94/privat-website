import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          this.currentUserSubject.next(response.user);
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
}

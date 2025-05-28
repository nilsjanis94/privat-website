import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <!-- Desktop/Mobile Toolbar -->
    <mat-toolbar color="primary" *ngIf="currentUser$ | async as user">
      <!-- Mobile Menu Button -->
      <button mat-icon-button class="mobile-menu-button" (click)="toggleMobileMenu()">
        <mat-icon>menu</mat-icon>
      </button>
      
      <span class="logo">📦 Inventar System</span>
      
      <!-- Desktop Navigation -->
      <div class="desktop-nav">
        <div class="nav-links">
          <a mat-button routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span class="nav-text">Dashboard</span>
          </a>
          <a mat-button routerLink="/inventory" routerLinkActive="active">
            <mat-icon>inventory</mat-icon>
            <span class="nav-text">Inventar</span>
          </a>
        </div>
      </div>

      <span class="spacer"></span>

      <!-- User Menu -->
      <button mat-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
        <span class="user-name">{{ user.first_name }} {{ user.last_name }}</span>
      </button>
      
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          Abmelden
        </button>
      </mat-menu>
    </mat-toolbar>

    <!-- Mobile Sidenav Overlay -->
    <div class="mobile-sidenav-overlay" 
         [class.open]="isMobileMenuOpen" 
         (click)="closeMobileMenu()"
         *ngIf="currentUser$ | async">
    </div>
    
    <div class="mobile-sidenav" 
         [class.open]="isMobileMenuOpen"
         *ngIf="currentUser$ | async">
      <div class="sidenav-content">
        <a class="nav-item" routerLink="/dashboard" (click)="closeMobileMenu()">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </a>
        <a class="nav-item" routerLink="/inventory" (click)="closeMobileMenu()">
          <mat-icon>inventory</mat-icon>
          <span>Inventar</span>
        </a>
        <div class="nav-divider"></div>
        <a class="nav-item" (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Abmelden</span>
        </a>
      </div>
    </div>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<User | null>;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }
}

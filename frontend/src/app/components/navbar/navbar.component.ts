import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
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
    MatMenuModule
  ],
  template: `
    <mat-toolbar color="primary" *ngIf="currentUser$ | async as user">
      <span class="logo">📦 Inventar System</span>
      
      <div class="nav-links">
        <a mat-button routerLink="/dashboard" routerLinkActive="active">
          <mat-icon>dashboard</mat-icon>
          Dashboard
        </a>
        <a mat-button routerLink="/inventory" routerLinkActive="active">
          <mat-icon>inventory</mat-icon>
          Inventar
        </a>
      </div>

      <span class="spacer"></span>

      <button mat-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
        {{ user.first_name }} {{ user.last_name }}
      </button>
      
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          Abmelden
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout();
  }
}

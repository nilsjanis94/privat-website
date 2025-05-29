import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MobileMenuService } from '../../services/mobile-menu.service';
import { ThemeService, Theme } from '../../services/theme.service';

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
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<any>;
  isMobileMenuOpen$: Observable<boolean>;
  currentTheme$: Observable<Theme>;
  
  // Theme options für das Dropdown
  themeOptions: Theme[] = ['light', 'dark', 'auto'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private mobileMenuService: MobileMenuService,
    private themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isMobileMenuOpen$ = this.mobileMenuService.isOpen$;
    this.currentTheme$ = this.themeService.currentTheme$;
  }

  ngOnInit(): void {}

  toggleMobileMenu(): void {
    this.mobileMenuService.toggle();
    console.log('Mobile menu toggled:', this.mobileMenuService.isOpen);
  }

  closeMobileMenu(): void {
    this.mobileMenuService.close();
    console.log('Mobile menu closed');
  }

  logout(): void {
    this.authService.logout();
  }

  getInitials(firstName: string, lastName: string): string {
    if (!firstName && !lastName) return 'U';
    
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    
    return firstInitial + lastInitial || 'U';
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
    // Mobile Menu schließen falls offen
    this.closeMobileMenu();
  }

  // Theme Management
  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  getThemeIcon(theme?: Theme): string {
    return this.themeService.getThemeIcon(theme);
  }

  getThemeLabel(theme?: Theme): string {
    return this.themeService.getThemeLabel(theme);
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }
}

import { Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Observable, map, filter, startWith } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MobileMenuService } from './services/mobile-menu.service';
import { AuthService } from './services/auth.service';
import { ThemeService, Theme } from './services/theme.service';
import { routeAnimations } from './animations/route-animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MatIconModule, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeAnimations]
})
export class AppComponent {
  @ViewChild(RouterOutlet) routerOutlet!: RouterOutlet;
  
  isMobileMenuOpen$: Observable<boolean>;
  currentUser$: Observable<any>;
  showNavbar$: Observable<boolean>;
  currentTheme$: Observable<Theme>;
  
  // Theme options für das Mobile Menu
  themeOptions: Theme[] = ['light', 'dark', 'auto'];

  constructor(
    private mobileMenuService: MobileMenuService,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.isMobileMenuOpen$ = this.mobileMenuService.isOpen$;
    this.currentUser$ = this.authService.currentUser$;
    this.currentTheme$ = this.themeService.currentTheme$;
    
    // Navbar nur anzeigen wenn nicht auf Auth-Seiten
    this.showNavbar$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        const authRoutes = ['/login', '/register'];
        return !authRoutes.includes(event.urlAfterRedirects || event.url);
      }),
      startWith(this.shouldShowNavbar(this.router.url))
    );
  }

  private shouldShowNavbar(url: string): boolean {
    const authRoutes = ['/login', '/register'];
    return !authRoutes.includes(url);
  }

  // Animation helper
  getRouteAnimation() {
    return this.routerOutlet?.activatedRouteData?.['animation'] || '';
  }

  closeMobileMenu(): void {
    this.mobileMenuService.close();
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  // Theme Management für Mobile Menu
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

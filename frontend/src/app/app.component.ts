import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Observable, map, filter, startWith } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MobileMenuService } from './services/mobile-menu.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MatIconModule, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isMobileMenuOpen$: Observable<boolean>;
  currentUser$: Observable<any>;
  showNavbar$: Observable<boolean>;

  constructor(
    private mobileMenuService: MobileMenuService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isMobileMenuOpen$ = this.mobileMenuService.isOpen$;
    this.currentUser$ = this.authService.currentUser$;
    
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

  closeMobileMenu(): void {
    this.mobileMenuService.close();
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}

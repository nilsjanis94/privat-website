import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
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

  constructor(
    private mobileMenuService: MobileMenuService,
    private authService: AuthService
  ) {
    this.isMobileMenuOpen$ = this.mobileMenuService.isOpen$;
    this.currentUser$ = this.authService.currentUser$;
  }

  closeMobileMenu(): void {
    this.mobileMenuService.close();
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}

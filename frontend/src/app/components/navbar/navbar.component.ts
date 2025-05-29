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

  constructor(
    private authService: AuthService,
    private router: Router,
    private mobileMenuService: MobileMenuService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isMobileMenuOpen$ = this.mobileMenuService.isOpen$;
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
    this.router.navigate(['/login']);
  }
}

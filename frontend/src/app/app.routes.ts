import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { animation: 'login' }
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
    data: { animation: 'register' }
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { animation: 'dashboard' }
  },
  { 
    path: 'inventory', 
    loadComponent: () => import('./components/inventory/inventory.component').then(m => m.InventoryComponent),
    canActivate: [authGuard],
    data: { animation: 'inventory' }
  },
  { 
    path: 'statistics', 
    loadComponent: () => import('./components/statistics/statistics.component').then(m => m.StatisticsComponent),
    canActivate: [authGuard],
    data: { animation: 'statistics' }
  },
  { path: '**', redirectTo: '/dashboard' }
];

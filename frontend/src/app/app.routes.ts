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
  { 
    path: 'budgets', 
    loadComponent: () => import('./components/budget-management/budget-management.component').then(m => m.BudgetManagementComponent),
    canActivate: [authGuard],
    data: { animation: 'budgets' }
  },
  { 
    path: 'budget-analytics', 
    loadComponent: () => import('./components/budget-analytics/budget-analytics.component').then(m => m.BudgetAnalyticsComponent),
    canActivate: [authGuard],
    data: { animation: 'budget-analytics' }
  },
  { 
    path: 'reminders', 
    loadComponent: () => import('./components/reminders/reminders.component').then(m => m.RemindersComponent),
    canActivate: [authGuard],
    data: { animation: 'reminders' }
  },
  { 
    path: 'scanner', 
    loadComponent: () => import('./components/barcode-scanner/barcode-scanner.component').then(m => m.BarcodeScannerComponent),
    canActivate: [authGuard],
    data: { animation: 'scanner' }
  },
  { 
    path: 'notifications', 
    loadComponent: () => import('./components/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
    canActivate: [authGuard],
    data: { animation: 'notifications' }
  },
  { path: '**', redirectTo: '/dashboard' }
];

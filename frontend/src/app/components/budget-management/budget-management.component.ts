import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Budget, BudgetDashboard, Category } from '../../interfaces/inventory.interface';
import { BudgetService } from '../../services/budget.service';
import { InventoryService } from '../../services/inventory.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './budget-management.component.html',
  styleUrl: './budget-management.component.scss'
})
export class BudgetManagementComponent implements OnInit, OnDestroy {
  // Make Math available in template
  Math = Math;
  
  budgetDashboard: BudgetDashboard | null = null;
  categories: Category[] = [];
  isLoading = false;
  isCreating = false;
  showCreateForm = false;
  hasError = false;
  errorMessage = '';

  newBudget: Partial<Budget> = {
    name: '',
    amount: 0,
    period: 'monthly',
    category: undefined,
    is_active: true
  };

  // Edit Budget Variablen
  editingBudget: Budget | null = null;
  editBudgetData: Partial<Budget> = {};
  isUpdating = false;

  private subscriptions = new Subscription();

  constructor(
    private budgetService: BudgetService,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Lade Budget-Dashboard und Kategorien parallel
    const budgetDashboard$ = this.budgetService.getBudgetDashboard().pipe(
      catchError(error => {
        console.error('Fehler beim Laden des Budget-Dashboards:', error);
        return of(null);
      })
    );

    const categories$ = this.inventoryService.getCategories().pipe(
      catchError(error => {
        console.error('Fehler beim Laden der Kategorien:', error);
        return of([]);
      })
    );

    const loadData$ = forkJoin({
      budgetDashboard: budgetDashboard$,
      categories: categories$
    }).pipe(
      tap(({ budgetDashboard, categories }) => {
        if (budgetDashboard) {
          this.budgetDashboard = budgetDashboard;
        } else {
          this.hasError = true;
          this.errorMessage = 'Budget-Daten konnten nicht geladen werden';
        }
        this.categories = categories;
      }),
      catchError(error => {
        console.error('Fehler beim Laden der Daten:', error);
        this.hasError = true;
        this.errorMessage = 'Es ist ein Fehler beim Laden der Daten aufgetreten';
        this.snackBar.open('Fehler beim Laden der Daten', 'Erneut versuchen', { 
          duration: 5000 
        }).onAction().subscribe(() => this.loadInitialData());
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    );

    this.subscriptions.add(loadData$.subscribe());
  }

  loadBudgetDashboard(): void {
    if (this.isLoading) return; // Verhindere mehrfache Aufrufe

    this.isLoading = true;
    this.hasError = false;

    const loadBudget$ = this.budgetService.getBudgetDashboard().pipe(
      tap(dashboard => {
        this.budgetDashboard = dashboard;
      }),
      catchError(error => {
        console.error('Fehler beim Laden des Budget-Dashboards:', error);
        this.hasError = true;
        this.errorMessage = 'Budget-Dashboard konnte nicht geladen werden';
        this.snackBar.open('Fehler beim Laden der Budgets', 'Erneut versuchen', { 
          duration: 5000 
        }).onAction().subscribe(() => this.loadBudgetDashboard());
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    );

    this.subscriptions.add(loadBudget$.subscribe());
  }

  createBudget(): void {
    if (!this.newBudget.name?.trim() || !this.newBudget.amount || this.newBudget.amount <= 0) {
      this.snackBar.open('Bitte füllen Sie alle Pflichtfelder korrekt aus', 'Schließen', { duration: 3000 });
      return;
    }

    if (this.isCreating) return; // Verhindere mehrfache Aufrufe

    this.isCreating = true;

    const createBudget$ = this.budgetService.createBudget(this.newBudget).pipe(
      tap(budget => {
        this.snackBar.open('Budget erfolgreich erstellt', 'Schließen', { duration: 3000 });
        this.resetForm();
        // Lade nur Budget-Dashboard neu, nicht alles
        this.loadBudgetDashboard();
      }),
      catchError(error => {
        console.error('Fehler beim Erstellen des Budgets:', error);
        let errorMsg = 'Fehler beim Erstellen des Budgets';
        
        if (error.status === 400) {
          errorMsg = 'Ungültige Budget-Daten. Bitte überprüfen Sie Ihre Eingaben.';
        } else if (error.status === 409) {
          errorMsg = 'Ein Budget mit diesem Namen existiert bereits.';
        }
        
        this.snackBar.open(errorMsg, 'Schließen', { duration: 5000 });
        return of(null);
      }),
      finalize(() => this.isCreating = false)
    );

    this.subscriptions.add(createBudget$.subscribe());
  }

  deleteBudget(budget: Budget): void {
    if (!budget?.id) return;

    const confirmation = confirm(`Möchten Sie das Budget "${budget.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`);
    
    if (!confirmation) return;

    const deleteBudget$ = this.budgetService.deleteBudget(budget.id).pipe(
      tap(() => {
        this.snackBar.open('Budget erfolgreich gelöscht', 'Schließen', { duration: 3000 });
        // Optimierung: Budget lokal entfernen und dann neu laden
        if (this.budgetDashboard) {
          this.budgetDashboard.budgets = this.budgetDashboard.budgets.filter(b => b.id !== budget.id);
        }
        // Vollständige Daten neu laden für korrekte Summen
        setTimeout(() => this.loadBudgetDashboard(), 500);
      }),
      catchError(error => {
        console.error('Fehler beim Löschen des Budgets:', error);
        let errorMsg = 'Fehler beim Löschen des Budgets';
        
        if (error.status === 404) {
          errorMsg = 'Budget nicht gefunden. Es wurde möglicherweise bereits gelöscht.';
        } else if (error.status === 403) {
          errorMsg = 'Sie haben keine Berechtigung, dieses Budget zu löschen.';
        }
        
        this.snackBar.open(errorMsg, 'Schließen', { duration: 5000 });
        return of(null);
      })
    );

    this.subscriptions.add(deleteBudget$.subscribe());
  }

  startEditBudget(budget: Budget): void {
    this.editingBudget = budget;
    this.editBudgetData = {
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      category: budget.category,
      is_active: budget.is_active
    };
    this.showCreateForm = false; // Verstecke Create-Form falls offen
  }

  cancelEditBudget(): void {
    this.editingBudget = null;
    this.editBudgetData = {};
  }

  updateBudget(): void {
    if (!this.editingBudget?.id || !this.editBudgetData.name?.trim() || !this.editBudgetData.amount || this.editBudgetData.amount <= 0) {
      this.snackBar.open('Bitte füllen Sie alle Pflichtfelder korrekt aus', 'Schließen', { duration: 3000 });
      return;
    }

    if (this.isUpdating) return; // Verhindere mehrfache Aufrufe

    this.isUpdating = true;

    const updateBudget$ = this.budgetService.updateBudget(this.editingBudget.id, this.editBudgetData).pipe(
      tap(updatedBudget => {
        this.snackBar.open('Budget erfolgreich aktualisiert', 'Schließen', { duration: 3000 });
        this.cancelEditBudget();
        // Budget-Dashboard neu laden
        this.loadBudgetDashboard();
      }),
      catchError(error => {
        console.error('Fehler beim Aktualisieren des Budgets:', error);
        let errorMsg = 'Fehler beim Aktualisieren des Budgets';
        
        if (error.status === 400) {
          errorMsg = 'Ungültige Budget-Daten. Bitte überprüfen Sie Ihre Eingaben.';
        } else if (error.status === 404) {
          errorMsg = 'Budget nicht gefunden. Es wurde möglicherweise bereits gelöscht.';
        }
        
        this.snackBar.open(errorMsg, 'Schließen', { duration: 5000 });
        return of(null);
      }),
      finalize(() => this.isUpdating = false)
    );

    this.subscriptions.add(updateBudget$.subscribe());
  }

  resetForm(): void {
    this.newBudget = {
      name: '',
      amount: 0,
      period: 'monthly',
      category: undefined,
      is_active: true
    };
    this.showCreateForm = false;
  }

  getProgressPercentage(budget: Budget): number {
    if (!budget || budget.amount === 0) return 0;
    return Math.min((budget.spent_this_period / budget.amount) * 100, 100);
  }

  getBudgetStatusColor(budget: Budget): string {
    if (!budget) return 'primary';
    if (budget.is_over_budget) return 'warn';
    if (budget.remaining_budget < budget.amount * 0.2) return 'accent';
    return 'primary';
  }

  getCategoryName(categoryId?: number): string {
    if (!categoryId) {
      return 'Alle Kategorien';
    }
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unbekannte Kategorie';
  }

  retryLoadData(): void {
    this.loadInitialData();
  }

  // TrackBy-Funktion für bessere Performance
  trackByBudgetId(index: number, budget: Budget): number {
    return budget.id;
  }

  // Hilfsmethoden für Template
  get hasValidBudgets(): boolean {
    return !!(this.budgetDashboard?.budgets?.length);
  }

  get isFormValid(): boolean {
    return !!(
      this.newBudget.name?.trim() && 
      this.newBudget.amount && 
      this.newBudget.amount > 0 &&
      this.newBudget.period
    );
  }

  get isEditFormValid(): boolean {
    return !!(
      this.editBudgetData.name?.trim() && 
      this.editBudgetData.amount && 
      this.editBudgetData.amount > 0 &&
      this.editBudgetData.period
    );
  }
}

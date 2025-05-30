import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Item, Reminder } from '../../interfaces/inventory.interface';
import { ReminderService } from '../../services/reminder.service';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTabsModule
  ],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss'
})
export class RemindersComponent implements OnInit {
  pendingItems: Item[] = [];
  reminders: Reminder[] = [];
  isLoading = false;

  constructor(
    private reminderService: ReminderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingReminders();
    this.loadReminders();
  }

  loadPendingReminders(): void {
    this.isLoading = true;
    this.reminderService.getPendingReminders().subscribe({
      next: (items) => {
        this.pendingItems = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der ausstehenden Erinnerungen:', error);
        this.snackBar.open('Fehler beim Laden der Erinnerungen', 'Schließen', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadReminders(): void {
    this.reminderService.getReminders().subscribe({
      next: (reminders) => {
        this.reminders = reminders;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Erinnerungen:', error);
      }
    });
  }

  dismissReminder(reminder: Reminder): void {
    this.reminderService.dismissReminder(reminder.id).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Schließen', { duration: 3000 });
        this.loadReminders();
      },
      error: (error) => {
        console.error('Fehler beim Verwerfen der Erinnerung:', error);
        this.snackBar.open('Fehler beim Verwerfen der Erinnerung', 'Schließen', { duration: 3000 });
      }
    });
  }

  getDaysUntilExpiry(item: Item): number {
    return item.days_until_expiry || 0;
  }

  getExpiryStatusColor(item: Item): string {
    const days = this.getDaysUntilExpiry(item);
    if (days < 0) return 'expired';
    if (days === 0) return 'today';
    if (days <= 2) return 'urgent';
    if (days <= 7) return 'warning';
    return 'normal';
  }

  getExpiryStatusText(item: Item): string {
    const days = this.getDaysUntilExpiry(item);
    if (days < 0) return `Abgelaufen vor ${Math.abs(days)} Tag(en)`;
    if (days === 0) return 'Läuft heute ab';
    if (days === 1) return 'Läuft morgen ab';
    return `Läuft in ${days} Tag(en) ab`;
  }

  getExpiryIcon(item: Item): string {
    const days = this.getDaysUntilExpiry(item);
    if (days < 0) return 'dangerous';
    if (days === 0) return 'warning';
    if (days <= 2) return 'schedule';
    return 'access_time';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getReminderTypeIcon(type: string): string {
    switch (type) {
      case 'expiry': return 'schedule';
      case 'maintenance': return 'build';
      case 'repurchase': return 'shopping_cart';
      default: return 'notifications';
    }
  }

  getReminderTypeText(type: string): string {
    switch (type) {
      case 'expiry': return 'Ablaufdatum';
      case 'maintenance': return 'Wartung';
      case 'repurchase': return 'Nachkauf';
      default: return 'Erinnerung';
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationPermissionStatus } from '../../services/notification.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {
  permissionStatus: NotificationPermissionStatus = 'default';
  isSupported = false;
  isSubscribed = false;
  isLoading = false;
  
  // Notification Settings
  reminderNotifications = true;
  budgetNotifications = true;
  expiryNotifications = true;
  generalNotifications = true;

  private subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    // Permission Status abonnieren
    this.subscription.add(
      this.notificationService.permission$.subscribe(permission => {
        this.permissionStatus = permission.permission;
        this.isSupported = permission.supported;
      })
    );

    // Subscription Status prüfen
    this.isSubscribed = await this.notificationService.isSubscribed();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Permission Status Getter Methods
  isPermissionDefault(): boolean {
    return this.permissionStatus === 'default';
  }

  isPermissionGranted(): boolean {
    return this.permissionStatus === 'granted';
  }

  isPermissionDenied(): boolean {
    return this.permissionStatus === 'denied';
  }

  async requestPermission(): Promise<void> {
    this.isLoading = true;
    
    try {
      const permission = await this.notificationService.requestPermission();
      
      if (permission === 'granted') {
        this.snackBar.open('Benachrichtigungen aktiviert!', 'Schließen', { duration: 3000 });
        // Automatisch für Push-Notifications anmelden
        await this.subscribeToPush();
      } else if (permission === 'denied') {
        this.snackBar.open('Benachrichtigungen wurden verweigert. Sie können diese in den Browser-Einstellungen aktivieren.', 'Schließen', { duration: 5000 });
      }
    } catch (error) {
      console.error('Fehler beim Anfordern der Berechtigung:', error);
      this.snackBar.open('Fehler beim Aktivieren der Benachrichtigungen', 'Schließen', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  async subscribeToPush(): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      this.snackBar.open('Bitte erlauben Sie zuerst Benachrichtigungen', 'Schließen', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    try {
      const subscription = await this.notificationService.subscribeToPush();
      
      if (subscription) {
        this.isSubscribed = true;
        this.snackBar.open('Push-Benachrichtigungen aktiviert!', 'Schließen', { duration: 3000 });
      } else {
        this.snackBar.open('Fehler beim Aktivieren der Push-Benachrichtigungen', 'Schließen', { duration: 3000 });
      }
    } catch (error) {
      console.error('Fehler beim Abonnieren von Push-Notifications:', error);
      this.snackBar.open('Fehler beim Aktivieren der Push-Benachrichtigungen', 'Schließen', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    this.isLoading = true;

    try {
      const success = await this.notificationService.unsubscribeFromPush();
      
      if (success) {
        this.isSubscribed = false;
        this.snackBar.open('Push-Benachrichtigungen deaktiviert', 'Schließen', { duration: 3000 });
      } else {
        this.snackBar.open('Fehler beim Deaktivieren der Push-Benachrichtigungen', 'Schließen', { duration: 3000 });
      }
    } catch (error) {
      console.error('Fehler beim Abbestellen von Push-Notifications:', error);
      this.snackBar.open('Fehler beim Deaktivieren der Push-Benachrichtigungen', 'Schließen', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  async sendTestNotification(): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      this.snackBar.open('Benachrichtigungen sind nicht aktiviert', 'Schließen', { duration: 3000 });
      return;
    }

    try {
      // Lokale Test-Benachrichtigung
      this.notificationService.showLocalNotification('Test Benachrichtigung', {
        body: 'Dies ist eine Test-Benachrichtigung von Ihrem Inventar System',
        icon: '/assets/icons/icon-192x192.png'
      });

      // Optional: Push-Test-Benachrichtigung
      if (this.isSubscribed) {
        await this.notificationService.sendTestNotification();
      }

      this.snackBar.open('Test-Benachrichtigung gesendet!', 'Schließen', { duration: 3000 });
    } catch (error) {
      console.error('Fehler beim Senden der Test-Benachrichtigung:', error);
      this.snackBar.open('Fehler beim Senden der Test-Benachrichtigung', 'Schließen', { duration: 3000 });
    }
  }

  getPermissionIcon(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return 'notifications_active';
      case 'denied':
        return 'notifications_off';
      default:
        return 'notifications_none';
    }
  }

  getPermissionText(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return 'Benachrichtigungen sind aktiviert';
      case 'denied':
        return 'Benachrichtigungen wurden verweigert';
      default:
        return 'Benachrichtigungen sind nicht aktiviert';
    }
  }

  getPermissionColor(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return 'primary';
      case 'denied':
        return 'warn';
      default:
        return 'accent';
    }
  }

  onNotificationSettingChange(): void {
    // Hier würden die Einstellungen gespeichert werden
    const settings = {
      reminders: this.reminderNotifications,
      budget: this.budgetNotifications,
      expiry: this.expiryNotifications,
      general: this.generalNotifications
    };
    
    // Einstellungen an Backend senden (später implementieren)
    console.log('Notification Settings geändert:', settings);
    this.snackBar.open('Einstellungen gespeichert', 'Schließen', { duration: 2000 });
  }
} 
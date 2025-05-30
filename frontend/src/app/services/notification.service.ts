import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

export interface NotificationPermission {
  permission: NotificationPermissionStatus;
  supported: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private swRegistration: ServiceWorkerRegistration | null = null;
  
  private permissionSubject = new BehaviorSubject<NotificationPermission>({
    permission: 'default',
    supported: this.isSupported()
  });
  
  public permission$ = this.permissionSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkPermission();
    this.registerServiceWorker();
  }

  private isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  private checkPermission(): void {
    if (this.isSupported()) {
      this.permissionSubject.next({
        permission: Notification.permission as NotificationPermissionStatus,
        supported: true
      });
    }
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.permissionSubject.next({
      permission: permission as NotificationPermissionStatus,
      supported: true
    });
    
    return permission as NotificationPermissionStatus;
  }

  private async registerServiceWorker(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registriert:', this.swRegistration);
    } catch (error) {
      console.error('Service Worker Registrierung fehlgeschlagen:', error);
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('Service Worker nicht registriert');
      return null;
    }

    try {
      // Für Demo-Zwecke verwenden wir einen Dummy-Key
      const dummyKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(dummyKey)
      });

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Subscription an Backend senden
      await this.savePushSubscription(pushSubscription);
      
      return pushSubscription;
    } catch (error) {
      console.error('Push Subscription fehlgeschlagen:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Backend über Unsubscription informieren
        await this.removePushSubscription();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push Unsubscription fehlgeschlagen:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Subscription Status Check fehlgeschlagen:', error);
      return false;
    }
  }

  // Lokale Benachrichtigung senden
  showLocalNotification(title: string, options?: NotificationOptions): void {
    if (this.permissionSubject.value.permission === 'granted') {
      new Notification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        ...options
      });
    }
  }

  // API Calls
  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/subscribe`, subscription).toPromise();
    } catch (error) {
      console.error('Fehler beim Speichern der Push Subscription:', error);
    }
  }

  private async removePushSubscription(): Promise<void> {
    try {
      await this.http.delete(`${this.apiUrl}/unsubscribe`).toPromise();
    } catch (error) {
      console.error('Fehler beim Entfernen der Push Subscription:', error);
    }
  }

  // Utility Methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Test Notification
  async sendTestNotification(): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/test`, {}).toPromise();
    } catch (error) {
      console.error('Test Notification fehlgeschlagen:', error);
    }
  }
} 
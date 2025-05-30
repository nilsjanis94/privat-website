// Service Worker für Push Notifications und Background Sync

const CACHE_NAME = 'inventar-app-v1';
const urlsToCache = [
  '/',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Install Event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push Event - Empfang von Push-Nachrichten
self.addEventListener('push', function(event) {
  console.log('Push Message empfangen:', event);

  let notificationData = {
    title: 'Inventar System',
    body: 'Sie haben eine neue Benachrichtigung',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    tag: 'inventar-notification',
    data: {
      url: '/'
    }
  };

  // Parse Push-Daten falls vorhanden
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (e) {
      console.error('Fehler beim Parsen der Push-Daten:', e);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Öffnen'
        },
        {
          action: 'dismiss',
          title: 'Schließen'
        }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

// Notification Click Event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification Click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Standard-Aktion oder 'open' Aktion
  let url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll().then(function(clientList) {
      // Prüfen ob die App bereits geöffnet ist
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // App öffnen falls nicht bereits geöffnet
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background Sync für Offline-Funktionalität
self.addEventListener('sync', function(event) {
  console.log('Background Sync:', event.tag);

  if (event.tag === 'inventory-sync') {
    event.waitUntil(
      // Hier würden Offline-Daten synchronisiert werden
      fetch('/api/sync-inventory')
        .then(response => {
          console.log('Inventory Sync erfolgreich');
        })
        .catch(error => {
          console.error('Inventory Sync fehlgeschlagen:', error);
        })
    );
  }
});

// Message Event für Kommunikation mit der Hauptanwendung
self.addEventListener('message', function(event) {
  console.log('Service Worker Message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic Background Sync (falls unterstützt)
self.addEventListener('periodicsync', function(event) {
  console.log('Periodic Background Sync:', event.tag);

  if (event.tag === 'inventory-reminder-check') {
    event.waitUntil(
      fetch('/api/check-reminders')
        .then(response => response.json())
        .then(data => {
          if (data.hasReminders) {
            return self.registration.showNotification('Inventar Erinnerung', {
              body: `Sie haben ${data.count} neue Erinnerung(en)`,
              icon: '/assets/icons/icon-192x192.png',
              badge: '/assets/icons/icon-72x72.png',
              tag: 'reminder-notification',
              data: {
                url: '/reminders'
              }
            });
          }
        })
        .catch(error => {
          console.error('Reminder Check fehlgeschlagen:', error);
        })
    );
  }
}); 
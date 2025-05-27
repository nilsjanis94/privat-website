# 🏠 Haushalts-Inventar-System

Ein modernes, vollständiges Web-basiertes Inventar-Verwaltungssystem für den Haushaltsbereich mit erweiterten Features wie Kontostand-Management, Ausgaben-Tracking, Verbrauchs-Verwaltung und automatisiertem Deployment.

## 🚀 Hauptfeatures

### 🔐 Authentifizierung & Benutzerverwaltung
- Sichere Benutzerregistrierung und Login
- JWT-Token basierte Authentifizierung
- Email-basierte Benutzerkonten
- Automatische Session-Verwaltung
- Benutzerspezifische Datenisolation

### 📦 Inventar-Verwaltung
- **Kategorien**: Vollständige CRUD-Operationen mit benutzerspezifischer Isolation
- **Gegenstände**: Erweiterte Item-Verwaltung mit allen Details
- **Erweiterte Suche**: Multi-Filter-System (Name, Kategorie, Zustand, Ort)
- **Zustandsverfolgung**: 5 Zustandsstufen (Neu → Schlecht)
- **Bearbeitung**: Vollständige Edit-Funktionalität für alle Items
- **Löschung**: Sichere Löschung mit Bestätigungsdialogen

### 💰 Finanz-Management
- **Kontostand-Verwaltung**: Persönlicher Kontostand mit manueller Anpassung
- **Automatische Ausgaben**: Kaufpreis wird automatisch vom Kontostand abgezogen
- **Monatliche Ausgaben**: Tracking der Ausgaben nach Kaufdatum
- **Ausgaben-Historie**: 6-Monats-Übersicht der Ausgaben
- **Balance-Update**: Dialog zum manuellen Anpassen des Kontostands
- **Guthaben-Prüfung**: Verhindert Käufe bei unzureichendem Guthaben

### 🍽️ Verbrauchs-Management
- **Verbraucht markieren**: Items als "verbraucht" markieren (z.B. Lebensmittel)
- **Verbrauch rückgängig**: Versehentlich markierte Items wiederherstellen
- **Separate Statistiken**: Getrennte Zählung aktiver vs. verbrauchter Items
- **Filter-Toggle**: Anzeige verbrauchter Items ein-/ausblenden
- **Erhaltung der Finanzdaten**: Ausgaben und Kontostand bleiben bei Verbrauch erhalten

### 📊 Dashboard & Analytics
- **Echtzeit-Statistiken**: Aktuelle Inventar-Übersicht
- **Finanz-Übersicht**: Kontostand, monatliche Ausgaben, Gesamtwerte
- **Kategorien-Verteilung**: Visualisierung der Item-Verteilung
- **Zustandsanalyse**: Übersicht über Item-Zustände
- **Neueste Items**: Chronologische Auflistung der letzten Hinzufügungen
- **Warnungen**: Hinweise auf Items ohne Kaufdatum

### 🎨 Benutzeroberfläche
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Angular Material**: Moderne, konsistente UI-Komponenten
- **Toast-Benachrichtigungen**: Sofortiges Benutzer-Feedback
- **Intuitive Navigation**: Klare Menüstruktur und Workflows
- **Accessibility**: Barrierefreie Bedienung

## 🛠️ Technologie-Stack

### Backend
- **Django 5.1**: Robustes Web-Framework
- **Django REST Framework**: RESTful API-Entwicklung
- **djangorestframework-simplejwt**: JWT-Authentifizierung
- **django-cors-headers**: Cross-Origin Resource Sharing
- **Pillow**: Bildverarbeitung für Item-Fotos
- **SQLite**: Entwicklungsdatenbank (Production-ready)

### Frontend
- **Angular 19**: Moderne Frontend-Framework mit Standalone Components
- **Angular Material**: Umfassende UI-Komponenten-Bibliothek
- **TypeScript**: Typisierte JavaScript-Entwicklung
- **RxJS**: Reactive Programming für asynchrone Operationen
- **NgRx Toastr**: Elegante Benachrichtigungen
- **CSS Grid & Flexbox**: Responsive Layout-System

### Deployment & Infrastructure
- **Apache2**: Webserver mit mod_rewrite für SPA-Routing
- **Git**: Versionskontrolle und Deployment-Pipeline
- **Bash**: Automatisierte Deployment-Scripts
- **Virtual Environment**: Isolierte Python-Umgebung

## 📋 Systemanforderungen

- **Python**: 3.11 oder höher
- **Node.js**: 18 oder höher
- **npm**: 8 oder höher
- **Apache2**: Mit mod_rewrite, mod_headers, mod_expires, mod_deflate
- **Git**: Für Deployment-Pipeline
- **Speicher**: Mindestens 4GB RAM
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 🚀 Installation & Setup

### 1. Repository Setup
```bash
git clone <repository-url>
cd inventar-system
```

### 2. Backend (Django) Setup

```bash
# Virtual Environment erstellen
python -m venv venv

# Virtual Environment aktivieren
source venv/bin/activate  # Linux/Mac
# oder
venv\Scripts\activate     # Windows

# Dependencies installieren
pip install -r backend/requirements.txt

# In Backend-Verzeichnis wechseln
cd backend

# Datenbank-Migrationen erstellen und ausführen
python manage.py makemigrations
python manage.py migrate

# Superuser erstellen (optional)
python manage.py createsuperuser

# Development Server starten
python manage.py runserver
```

**Backend läuft auf:** `http://localhost:8000`

### 3. Frontend (Angular) Setup

```bash
# In Frontend-Verzeichnis wechseln (neues Terminal)
cd frontend

# Dependencies installieren
npm install

# Environment-Datei für Development erstellen
cp src/environments/environment.prod.ts src/environments/environment.ts

# Development Server starten
ng serve

# Oder für Production Build
ng build --configuration production
```

**Frontend läuft auf:** `http://localhost:4200`

## 🚀 Production Deployment

### Automatisiertes Deployment mit Script

Das Projekt enthält ein vollautomatisches Deployment-Script für Apache2-Server:

```bash
# Auf dem Server: Repository klonen/aktualisieren
git clone <repository-url>
cd inventar-system
git pull origin main

# Virtual Environment aktivieren
source venv/bin/activate

# Automatisches Deployment ausführen
./deploy.sh
```

### Was das Deployment-Script macht:

1. **Frontend Build**: Angular Production-Build erstellen
2. **Backend Setup**: Dependencies installieren, Migrationen ausführen
3. **File Deployment**: Dateien nach `/var/www/html/` kopieren
4. **Apache Konfiguration**: `.htaccess` für SPA-Routing konfigurieren
5. **Module Aktivierung**: Benötigte Apache-Module aktivieren
6. **Berechtigungen**: Korrekte Dateiberechtigungen setzen
7. **Service Restart**: Apache bei Bedarf neu starten

### Manuelle Deployment-Schritte

Falls das automatische Script nicht verwendet werden kann:

```bash
# 1. Frontend Build
cd frontend
ng build --configuration production

# 2. Backend Setup
cd ../backend
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 3. Dateien kopieren
sudo cp -r ../frontend/dist/frontend/* /var/www/html/
sudo cp ../.htaccess /var/www/html/

# 4. Apache Module aktivieren
sudo a2enmod rewrite headers expires deflate
sudo systemctl restart apache2

# 5. Berechtigungen setzen
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 644 /var/www/html/
sudo chmod 755 /var/www/html/
```

## 📁 Detaillierte Projektstruktur

```
inventar-system/
├── .htaccess                         # Apache SPA-Routing-Konfiguration
├── deploy.sh                         # Automatisches Deployment-Script
├── backend/                          # Django Backend
│   ├── inventar_system/              # Hauptprojekt-Konfiguration
│   │   ├── settings.py               # Django-Einstellungen
│   │   ├── urls.py                   # URL-Routing
│   │   └── wsgi.py                   # WSGI-Konfiguration
│   ├── authentication/               # Authentifizierungs-App
│   │   ├── models.py                 # CustomUser Model mit Balance
│   │   ├── views.py                  # Auth-Views & Balance-Update
│   │   ├── serializers.py            # User-Serializers
│   │   └── urls.py                   # Auth-URLs
│   ├── inventory/                    # Inventar-App
│   │   ├── models.py                 # Category & Item Models mit Consumed
│   │   ├── views.py                  # CRUD-Views, Dashboard & Consumed-API
│   │   ├── serializers.py            # API-Serializers
│   │   └── urls.py                   # Inventar-URLs
│   ├── manage.py                     # Django-Management
│   ├── requirements.txt              # Python-Dependencies
│   └── db.sqlite3                    # SQLite-Datenbank
├── frontend/                         # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # UI-Komponenten
│   │   │   │   ├── dashboard/        # Dashboard mit Finanz-Übersicht
│   │   │   │   ├── inventory/        # Inventar mit Edit/Delete/Consumed
│   │   │   │   ├── item-form/        # Item-Formular (Create/Edit)
│   │   │   │   ├── category-form/    # Kategorie-Formular
│   │   │   │   ├── balance-update/   # Kontostand-Update-Dialog
│   │   │   │   ├── login/            # Login-Komponente
│   │   │   │   ├── register/         # Registrierungs-Komponente
│   │   │   │   └── navbar/           # Navigation
│   │   │   ├── services/             # Angular Services
│   │   │   │   ├── auth.service.ts   # Authentifizierung & Balance
│   │   │   │   └── inventory.service.ts # Inventar-API & Consumed
│   │   │   ├── guards/               # Route Guards
│   │   │   │   └── auth.guard.ts     # Authentifizierungs-Guard
│   │   │   ├── interceptors/         # HTTP-Interceptors
│   │   │   │   └── auth.interceptor.ts # JWT-Token-Interceptor
│   │   │   ├── interfaces/           # TypeScript-Interfaces
│   │   │   │   ├── inventory.interface.ts # Erweiterte Datenmodelle
│   │   │   │   └── user.interface.ts # User-Interface
│   │   │   └── environments/         # Umgebungskonfiguration
│   │   │       ├── environment.prod.ts # Production (relative URLs)
│   │   │       └── environment.ts    # Development (lokale URLs)
│   │   └── assets/                   # Statische Assets
│   ├── angular.json                  # Angular-Konfiguration
│   ├── package.json                  # Node.js-Dependencies
│   └── proxy.conf.json               # Development-Proxy
├── venv/                             # Python Virtual Environment
├── .gitignore                        # Git-Ignore-Regeln
└── README.md                         # Diese Datei
```

## 🔧 Konfiguration

### Backend-Konfiguration (`backend/inventar_system/settings.py`)

```python
# CORS-Konfiguration für Frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",  # Angular Development
    "https://yourdomain.com", # Production
]

# JWT-Token-Konfiguration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Datenbank-Konfiguration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Frontend-Konfiguration

**Development** (`frontend/src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api'
};
```

**Production** (`frontend/src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Relative URL für Production
};
```

### Apache-Konfiguration (`.htaccess`)

```apache
# Angular SPA Routing für Apache2
RewriteEngine On

# Handle Angular Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^.*$ /index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Cache-Control & Compression
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
</IfModule>
```

## 📊 API-Dokumentation

### Authentifizierung
| Endpoint | Methode | Beschreibung | Authentifizierung |
|----------|---------|--------------|-------------------|
| `/api/auth/register/` | POST | Benutzerregistrierung | Nein |
| `/api/auth/login/` | POST | Benutzer-Login | Nein |
| `/api/auth/token/refresh/` | POST | JWT-Token erneuern | Refresh Token |
| `/api/auth/user/` | GET | Benutzerprofil abrufen | JWT |
| `/api/auth/update-balance/` | POST | Kontostand aktualisieren | JWT |

### Inventar-Management
| Endpoint | Methode | Beschreibung | Authentifizierung |
|----------|---------|--------------|-------------------|
| `/api/inventory/categories/` | GET/POST | Kategorien verwalten | JWT |
| `/api/inventory/categories/{id}/` | GET/PUT/DELETE | Kategorie-Details | JWT |
| `/api/inventory/items/` | GET/POST | Items verwalten | JWT |
| `/api/inventory/items/{id}/` | GET/PUT/DELETE | Item-Details | JWT |
| `/api/inventory/items/{id}/consume/` | POST | Als verbraucht markieren | JWT |
| `/api/inventory/items/{id}/unconsume/` | POST | Verbrauch rückgängig | JWT |
| `/api/inventory/dashboard/` | GET | Dashboard-Statistiken | JWT |

## 🗄️ Datenmodell

### CustomUser (Erweiterte Benutzer)
```python
class CustomUser(AbstractUser):
    email = EmailField(unique=True)           # Email als Username
    balance = DecimalField(default=1000.00)   # Kontostand
    first_name = CharField(max_length=30)     # Vorname
    last_name = CharField(max_length=30)      # Nachname
    date_joined = DateTimeField(auto_now_add=True)
```

### Category (Kategorie)
```python
class Category(Model):
    name = CharField(max_length=100, unique=True)  # Kategoriename
    description = TextField(blank=True)            # Beschreibung
    owner = ForeignKey(User, on_delete=CASCADE)    # Besitzer
    created_at = DateTimeField(auto_now_add=True)  # Erstellungsdatum
```

### Item (Gegenstand)
```python
class Item(Model):
    name = CharField(max_length=200)                    # Name
    description = TextField(blank=True)                 # Beschreibung
    category = ForeignKey(Category, on_delete=CASCADE)  # Kategorie
    owner = ForeignKey(User, on_delete=CASCADE)         # Besitzer
    purchase_date = DateField(null=True, blank=True)    # Kaufdatum
    purchase_price = DecimalField(max_digits=10, decimal_places=2)  # Kaufpreis
    current_value = DecimalField(max_digits=10, decimal_places=2)   # Aktueller Wert
    condition = CharField(max_length=20, choices=CONDITION_CHOICES) # Zustand
    location = CharField(max_length=200, blank=True)    # Aufbewahrungsort
    serial_number = CharField(max_length=100, blank=True) # Seriennummer
    warranty_until = DateField(null=True, blank=True)   # Garantie bis
    image = ImageField(upload_to='items/', null=True)   # Produktbild
    consumed = BooleanField(default=False)              # Verbraucht-Status
    consumed_at = DateTimeField(null=True, blank=True)  # Verbrauchsdatum
    created_at = DateTimeField(auto_now_add=True)       # Erstellungsdatum
    updated_at = DateTimeField(auto_now=True)           # Änderungsdatum
```

## 🔐 Sicherheitsfeatures

- **JWT-Token-Authentifizierung**: Sichere, stateless Authentifizierung
- **CORS-Konfiguration**: Kontrollierte Cross-Origin-Requests
- **Benutzerisolation**: Vollständige Trennung der Benutzerdaten
- **Input-Validierung**: Umfassende Server- und Client-seitige Validierung
- **SQL-Injection-Schutz**: Django ORM verhindert SQL-Injection
- **XSS-Schutz**: Angular's eingebauter XSS-Schutz
- **CSRF-Schutz**: Django's CSRF-Middleware
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

## 🚀 Deployment-Workflow

### Entwicklung → Production

```bash
# 1. Lokale Entwicklung
git add .
git commit -m "Feature: Neue Funktionalität"
git push origin main

# 2. Server-Deployment
ssh user@server
cd /var/www/project
git pull origin main
source venv/bin/activate
./deploy.sh

# 3. Testen
curl https://yourdomain.com/
curl https://yourdomain.com/api/inventory/dashboard/
```

### Deployment-Features

- ✅ **Automatisiert**: Ein Befehl für komplettes Deployment
- ✅ **Backup**: Automatische Backups vor Deployment
- ✅ **Rollback**: Git-basierte Rollback-Möglichkeit
- ✅ **Validierung**: Überprüfung der Systemvoraussetzungen
- ✅ **Logging**: Detaillierte Deployment-Logs
- ✅ **Zero-Downtime**: Minimale Ausfallzeiten

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
ng test
ng e2e
```

### API Tests
```bash
# Dashboard-API testen
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://yourdomain.com/api/inventory/dashboard/

# Items-API testen
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://yourdomain.com/api/inventory/items/
```

## 📈 Performance-Optimierungen

- **Lazy Loading**: Angular-Module werden bei Bedarf geladen
- **OnPush Change Detection**: Optimierte Change Detection
- **Database Indexing**: Optimierte Datenbankabfragen
- **Caching**: Browser-Caching für statische Assets (1 Jahr)
- **Compression**: Gzip-Kompression für alle Text-Assets
- **Minification**: Komprimierte Production-Builds
- **Tree Shaking**: Entfernung ungenutzten Codes
- **Bundle Splitting**: Optimierte JavaScript-Bundles

## 🔧 Troubleshooting

### Häufige Probleme

**1. 404-Fehler bei Angular-Routen**
```bash
# Lösung: .htaccess prüfen
cat /var/www/html/.htaccess
# Apache mod_rewrite aktivieren
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**2. API-Calls funktionieren nicht**
```bash
# CORS-Einstellungen prüfen
grep CORS backend/inventar_system/settings.py
# Django-Server läuft prüfen
ps aux | grep python
```

**3. Environment-Datei fehlt**
```bash
# Environment-Datei erstellen
cp frontend/src/environments/environment.prod.ts \
   frontend/src/environments/environment.ts
```

**4. Berechtigungsprobleme**
```bash
# Git-Berechtigungen korrigieren
sudo chown -R $USER:$USER /var/www/project
# Web-Berechtigungen setzen
sudo chown -R www-data:www-data /var/www/html/
```

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📝 Changelog

### Version 2.1.0 (Aktuell)
- ✅ Automatisiertes Deployment-System
- ✅ Apache2-Integration mit .htaccess
- ✅ Production-ready Konfiguration
- ✅ Erweiterte Sicherheitsfeatures
- ✅ Performance-Optimierungen

### Version 2.0.0
- ✅ Kontostand-Management
- ✅ Ausgaben-Tracking
- ✅ Verbrauchs-Management
- ✅ Erweiterte Dashboard-Funktionen
- ✅ Vollständige CRUD-Operationen

### Version 1.0.0
- ✅ Basis-Inventar-System
- ✅ Authentifizierung
- ✅ Angular Material UI
- ✅ Django REST API

## 📝 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` Datei für Details.

## 👥 Autoren

- **Nils Wolters** - *Initial work & Full-Stack Development* - [GitHub](https://github.com/nilsjanis94)

## 🙏 Danksagungen

- Angular Team für das großartige Framework
- Django Team für das robuste Backend-Framework
- Material Design Team für die UI-Komponenten
- Apache Foundation für den zuverlässigen Webserver
- Alle Open-Source-Contributors

## 📞 Support

Bei Fragen oder Problemen:
- Erstelle ein Issue auf GitHub
- Kontaktiere den Entwickler direkt
- Prüfe die Troubleshooting-Sektion

## 🌐 Live Demo

**URL**: https://aileenundnils.de  
**Test-Account**: Registrierung erforderlich  
**Features**: Alle Funktionen verfügbar

---

**Version**: 2.1.0  
**Letztes Update**: Dezember 2024  
**Status**: ✅ Production Ready & Live Deployed  
**Deployment**: Automatisiert mit Apache2
```


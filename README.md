# 🏠 Haushalts-Inventar-System

Ein modernes, vollständig mobile-responsive Web-basiertes Inventar-Verwaltungssystem für den Haushaltsbereich mit erweiterten Features wie Touch-optimierter Bedienung, Purple Design System, umfassendem Kategorie-Management und automatisiertem Deployment.

## 🚀 Hauptfeatures

### 🔐 Authentifizierung & Benutzerverwaltung
- Sichere Benutzerregistrierung und Login mit JWT-Token basierter Authentifizierung
- Email-basierte Benutzerkonten mit automatischer Session-Verwaltung
- Benutzerspezifische Datenisolation mit Standard-Kategorien bei Registrierung/Login

### 📦 Inventar-Verwaltung
- **Kategorien**: Vollständige CRUD-Operationen (Create/Read/Update/Delete) mit intelligenter Kategorie-Verwaltung
- **Kategorie-Schutz**: Kategorien mit Items können nicht gelöscht werden (Smart Protection)
- **Gegenstände**: Vereinfachte Item-Verwaltung mit Fokus auf Kern-Features
- **Erweiterte Suche**: Multi-Filter-System (Name, Kategorie, Ort) mit responsiver Paginierung
- **Mobile Card-Layout**: Touch-optimierte Item-Darstellung auf mobilen Geräten (Cards statt Tabellen)
- **Bearbeitung & Löschung**: Vollständige Edit-Funktionalität mit sicheren Bestätigungsdialogen
- **Korrekte Datumsverarbeitung**: Lokale Datumskonvertierung ohne UTC-Zeitzonenfehler

### 💰 Finanz-Management
- **Kontostand-Verwaltung**: Persönlicher Kontostand mit manueller Anpassung
- **Automatische Ausgaben**: Kaufpreis wird automatisch vom Kontostand abgezogen
- **Tages-Ausgaben-Tracking**: Echtzeit-Verfolgung der heutigen Ausgaben
- **Ausgaben-Historie**: Interaktive Charts mit verschiedenen Zeiträumen

### 🍽️ Verbrauchs-Management
- **Verbraucht markieren**: Items als "verbraucht" markieren mit separaten Statistiken
- **Filter-Toggle**: Anzeige verbrauchter Items ein-/ausblenden
- **Erhaltung der Finanzdaten**: Ausgaben und Kontostand bleiben bei Verbrauch erhalten

### 📊 Dashboard & Analytics
- **Optimiertes Dashboard**: Korrekte Sortierung für letzte Aktivitäten (neueste zuerst)
- **Einheitliches Design**: Konsistente weiße Card-Darstellung für alle Kennzahlen
- **Top-Kategorien-Ranking**: Kategorien sortiert nach Anzahl der Items
- **Interaktive Charts**: 
  - **Ausgaben-Chart**: Stock-Chart-Style mit Zeitraumfiltern (1W, 1M, 1Y, Max)
  - **Kategorien-Donut-Chart**: Mit Prozentangaben direkt im Chart
  - **Monatliche Ausgaben Bar-Chart**: Mit Werten über den Balken
- **Echtzeit-Statistiken**: Aktuelle Inventar-Übersicht mit Tages-Ausgaben und intelligenten Durchschnitten

### 🎨 Modern UI/UX Design
- **Purple Design System**: Kohärentes Design mit modernen lila/purple Farbschemas
- **Mobile-First Responsive**: Vollständig optimiert für alle Geräte (320px - 1920px+)
- **Touch-Optimierung**: 44-48px Touch-Targets für perfekte mobile Bedienung
- **Adaptive Layouts**: 
  - Desktop/Tablet: Klassische Tabellendarstellung
  - Mobile: Card-basierte Layouts ohne horizontales Scrollen
- **Smart Navigation**: Klickbares Brand-Logo für schnelle Dashboard-Navigation
- **Responsive Pagination**: Intelligente Seitengrößen (5 mobile, 8 tablet, 25 desktop)
- **Dialog-Optimierung**: Perfekt positionierte und isolierte CSS-Dialogs
- **Angular Material**: Moderne, konsistente UI-Komponenten mit harmonisierten Button-Styles

## 🛠️ Technologie-Stack

### Backend
- **Django 5.1** mit Django REST Framework für RESTful API-Entwicklung
- **JWT-Authentifizierung** mit djangorestframework-simplejwt
- **SQLite** Production-ready Datenbank
- **Erweiterte API**: CRUD-Endpunkte für Kategorien und Items

### Frontend
- **Angular 19** mit Standalone Components und modernem Architecture
- **Chart.js** für interaktive Datenvisualisierungen
- **Angular Material** für umfassende UI-Komponenten mit Purple Theming
- **TypeScript & RxJS** für typisierte, reactive Programmierung
- **Responsive SCSS**: Mobile-First CSS mit CSS Custom Properties

### Deployment
- **Apache2** Webserver mit mod_rewrite für SPA-Routing
- **Automatisierte Deployment-Scripts** mit Git-basierter Pipeline
- **Optimierte Budgets**: Angepasst für umfangreiche CSS-Features (800kB initial, 15kB components)

## 📋 Systemanforderungen

- **Python**: 3.11+ | **Node.js**: 18+ | **npm**: 8+
- **Apache2** mit mod_rewrite, mod_headers, mod_expires, mod_deflate
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+, vollständig touch-optimiert mit Card-Layouts

## 🚀 Installation & Setup

### Backend (Django) Setup
```bash
# Repository klonen und Virtual Environment erstellen
git clone <repository-url>
cd inventar-system
python -m venv venv
source venv/bin/activate  # Linux/Mac

# Dependencies installieren und Datenbank setup
pip install -r backend/requirements.txt
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py runserver  # Läuft auf http://localhost:8000
```

### Frontend (Angular) Setup
```bash
# Dependencies installieren und Development Server starten
cd frontend
npm install
cp src/environments/environment.prod.ts src/environments/environment.ts
ng serve  # Läuft auf http://localhost:4200
```

## 🚀 Production Deployment

### Apache Virtual Host Konfiguration
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/your-project/frontend/dist/frontend/browser
    
    <Directory /var/www/your-project/frontend/dist/frontend/browser>
        AllowOverride All
        Require all granted
    </Directory>
    
    # API-Requests zu Django weiterleiten
    ProxyPass /api/ http://localhost:8000/api/
    ProxyPassReverse /api/ http://localhost:8000/api/
</VirtualHost>
```

### SPA-Routing (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^.*$ /index.html [L]
```

## 📊 API-Dokumentation

### Authentifizierung
| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/auth/register/` | POST | Benutzerregistrierung |
| `/api/auth/login/` | POST | Benutzer-Login |
| `/api/auth/update-balance/` | POST | Kontostand aktualisieren |

### Inventar-Management
| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/inventory/categories/` | GET/POST | Kategorien verwalten |
| `/api/inventory/categories/{id}/` | PUT/DELETE | Kategorie bearbeiten/löschen |
| `/api/inventory/items/` | GET/POST | Items verwalten |
| `/api/inventory/items/{id}/` | PUT/DELETE | Items bearbeiten/löschen |
| `/api/inventory/items/{id}/consume/` | POST | Als verbraucht markieren |
| `/api/inventory/dashboard/` | GET | Dashboard-Statistiken |
| `/api/inventory/expenses-chart/` | GET | Chart-Daten mit Zeitraumfilter |

## 📝 Changelog

### Version 3.0.0 (Aktuell - Mai 2025)
- 🎨 **Purple Design System**: Vollständig implementiertes kohärentes Design-System
- 📱 **Mobile-Responsive Revolution**: 
  - Touch-optimierte Bedienung mit 44-48px Touch-Targets
  - Mobile Card-Layout für Inventar-Items (keine horizontalen Scroll-Probleme)
  - Responsive Pagination mit intelligenten Seitengrößen
  - Auto-Scroll bei Seitenwechseln auf mobilen Geräten
- 🔧 **Kategorie CRUD**: Vollständige Create/Read/Update/Delete-Funktionalität
  - Smart Protection: Kategorien mit Items können nicht gelöscht werden
  - Inline Edit/Delete-Buttons in Kategorie-Chips
  - Erweiterte Backend-API für Kategorie-Management
- 🧭 **Smart Navigation**: Klickbares Brand-Logo führt direkt zum Dashboard
- 🎯 **Dialog-Verbesserungen**: 
  - CSS-Isolation zwischen Item- und Kategorie-Dialogs
  - Optimierte Positionierung und Padding
  - Mobile-responsive Dialog-Layouts
- 📊 **Dashboard-Einheitlichkeit**: Konsistente weiße Card-Darstellung
- 🛠️ **Build-Optimierung**: Angepasste Angular Budgets für umfangreiche Features

### Version 2.7.0 (Mai 2025)
- ✅ **Ausgaben-Chart mit Zeiträumen**: Stock-Chart-Style mit 1W, 1M, 1Y, Max Buttons
  - Backend: Neue `/expenses-chart/` API mit period-Parameter für verschiedene Aggregationen
  - Frontend: Neue `ExpensesChartComponent` mit Chart.js Line-Chart
  - Features: Hover-Effekte, Echtzeit-Statistiken (Durchschnitt, Maximum), responsive Design
- ✅ **Toast-Benachrichtigungen verbessert**: Korrigiertes Layout ohne doppelte Icons
- ✅ **Debug-Bereinigung**: Entfernung aller Backend-Debug-Ausgaben für sauberen Code

### Version 2.6.0 (Mai 2025)
- ✅ **Datum-Fix**: Korrigierte Datumsverarbeitung ohne UTC-Zeitzonenfehler
- ✅ **Dashboard-Sortierung**: Neueste Items zuerst, Top-Kategorien nach Anzahl
- ✅ **Statistiken-Optimierung**: "Heute ausgegeben" Feature hinzugefügt
- ✅ **Button-Styling-Harmonisierung**: Einheitliche Button-Designs zwischen allen Formularen

## 🎯 Mobile-First Features

### 📱 Touch-Optimierte Bedienung
- **Touch-Targets**: Alle interaktiven Elemente mindestens 44px (iOS Standard)
- **Gestenfreundlich**: Keine versehentlichen Klicks durch ausreichende Abstände
- **Hover-Effekte**: Auch auf Touch-Geräten optimierte Interaktionen

### 🃏 Adaptive Layouts
- **Desktop/Tablet**: Klassische Tabellendarstellung mit Hover-Effekten
- **Mobile**: Card-basierte Layouts mit vertikaler Informationsdarstellung
- **Automatisch**: Responsive Breakpoints bei 768px und 480px

### ⚡ Performance
- **Responsive Pagination**: Weniger Daten auf mobilen Geräten (5 vs 25 Items)
- **Optimierte Images**: Skalierte Icons für verschiedene Bildschirmgrößen
- **Lazy Loading**: Effiziente Ressourcennutzung

## 🔧 Troubleshooting

**Angular-Routen 404-Fehler**
```bash
# .htaccess prüfen und mod_rewrite aktivieren
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**API-Calls funktionieren nicht**
```bash
# CORS-Einstellungen und Django-Server prüfen
grep CORS backend/inventar_system/settings.py
ps aux | grep python
```

**Build-Budget-Fehler**
```bash
# Angular-Budgets wurden bereits auf realistische Werte angepasst
# Bei weiteren Problemen: ng build --configuration=production
```

## 🌐 Live Demo

**URL**: https://aileenundnils.de  
**Status**: ✅ Vollständig funktional & Production-Ready mit Mobile-First Design  
**Features**: Touch-optimiert, Purple Design System, responsive Pagination, Card-Layouts

### Test-Features (Mobile & Desktop)
- **Mobile Navigation**: Teste die Touch-Gesten und Card-Layouts auf dem Smartphone
- **Kategorie-Management**: Teste Edit/Delete-Funktionalität in den Kategorie-Chips
- **Brand-Navigation**: Klicke auf das Inventar-Logo für Dashboard-Navigation
- **Responsive Pagination**: Teste verschiedene Seitengrößen auf verschiedenen Geräten
- **Chart-Funktionalität**: Teste die verschiedenen Zeiträume (1W, 1M, 1Y, Max)
- **Touch-Targets**: Prüfe die 44px+ Touch-Bereiche auf mobilen Geräten

**Test-Account**: Registrierung erforderlich (kostenlos)

## 📞 Support & Beitragen

- Erstelle ein Issue auf GitHub für Probleme
- Pull Requests willkommen für Verbesserungen
- Prüfe die Troubleshooting-Sektion für häufige Probleme

## 👥 Autoren

**Nils Wolters** - Full-Stack Development - [GitHub](https://github.com/nilsjanis94)

---

**Version**: 3.0.0 | **Letztes Update**: Dezember 2024 | **Status**: ✅ Production Ready + Mobile-First

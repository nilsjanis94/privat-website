# 🏠 Haushalts-Inventar-System

Ein modernes, vollständig mobile-responsive Web-basiertes Inventar-Verwaltungssystem für den Haushaltsbereich mit erweiterten Features wie Touch-optimierter Bedienung, Purple Design System, umfassendem Kategorie-Management, vollständigem Budget-Management und automatisiertem Deployment.

## 🚀 Hauptfeatures

### 🔐 Authentifizierung & Benutzerverwaltung
- Sichere Benutzerregistrierung und Login mit JWT-Token basierter Authentifizierung
- Email-basierte Benutzerkonten mit automatischer Session-Verwaltung
- Benutzerspezifische Datenisolation mit Standard-Kategorien bei Registrierung/Login

### 📦 Inventar-Verwaltung
- **Kategorien**: Vollständige CRUD-Operationen (Create/Read/Update/Delete) mit intelligenter Kategorie-Verwaltung
- **Kategorie-Schutz**: Kategorien mit Items können nicht gelöscht werden (Smart Protection)
- **Gegenstände**: Vereinfachte Item-Verwaltung mit Fokus auf Kern-Features
- **📱 Barcode-Scanner (NEU)**: 
  - **Dual-Mode Scanning**: Kamera-basiert + Manuelle Eingabe mit Tab-Interface
  - **Cross-Browser Support**: Native BarcodeDetector (Chrome/Edge) + QuaggaJS (Safari/Firefox)
  - **iOS/Safari Optimiert**: Hardware-Beschleunigung, playsinline, touch-freundliche Controls
  - **Confidence-Based Detection**: 5 konsistente Erkennungen für höchste Genauigkeit
  - **Anti-Spam Protection**: 200ms Mindestabstand zwischen Erkennungen
  - **Automatic Product Lookup**: Integration mit UPC Database, OpenFoodFacts, UPC ItemDB, Go-UPC
  - **Smart Camera Management**: Automatisches Resource-Management und Error-Handling
  - **Barcode-Formats**: EAN-13/8, UPC-A/E, Code 128, Code 39, QR-Codes
  - **Visual Guidance**: Barcode-Ausrichtungshilfen und Scan-Frame-Overlay
  - **Form Auto-Fill**: Automatische Produktinfo-Übernahme oder manuelle Eingabe
- **Erweiterte Suche**: Multi-Filter-System (Name, Kategorie, Ort) mit responsiver Paginierung
- **Mobile Card-Layout**: Touch-optimierte Item-Darstellung auf mobilen Geräten (Cards statt Tabellen)
- **Bearbeitung & Löschung**: Vollständige Edit-Funktionalität mit sicheren Bestätigungsdialogen
- **Korrekte Datumsverarbeitung**: Lokale Datumskonvertierung ohne UTC-Zeitzonenfehler

### 💰 Finanz-Management & Budget-System
- **Vollständiges Budget-System**: 
  - **Budget-Erstellung**: Kategoriebasierte oder "Alle Kategorien"-Budgets
  - **Budget-Bearbeitung**: Vollständige Edit-Funktionalität für alle Budget-Parameter
  - **Echtzeit-Tracking**: Live-Verfolgung der Budget-Auslastung mit Farbkodierung
  - **Intelligente Warnungen**: Automatische Benachrichtigungen bei Budget-Überschreitungen
- **Budget-Analytics**: 
  - **Echte Daten**: Budget-Analysen basieren auf tatsächlichen Ausgaben statt simulierten Daten
  - **Kategorien-übergreifend**: Unterstützung für "Alle Kategorien"-Budgets
  - **Detaillierte Auswertungen**: Umfassende Budget-Performance-Statistiken
- **Kontostand-Verwaltung**: 
  - **Editierbare Balance**: Klickarer Kontostand mit visuellen Edit-Indikatoren
  - **Automatische Ausgaben**: Kaufpreis wird automatisch vom Kontostand abgezogen
  - **Tages-Ausgaben-Tracking**: Echtzeit-Verfolgung der heutigen Ausgaben prominenter auf dem Dashboard
- **Ausgaben-Historie**: Interaktive Charts mit verschiedenen Zeiträumen

### 🍽️ Verbrauchs-Management
- **Verbraucht markieren**: Items als "verbraucht" markieren mit separaten Statistiken
- **Filter-Toggle**: Anzeige verbrauchter Items ein-/ausblenden
- **Erhaltung der Finanzdaten**: Ausgaben und Kontostand bleiben bei Verbrauch erhalten

### 📊 Dashboard & Analytics
- **Intelligentes Dashboard**: 
  - **Budget-Integration**: Zentrale Budget-Übersicht mit Status-Indikatoren
  - **Budget-Warnungen**: Automatische Anzeige überschrittener Budgets mit Überschreitungsbeträgen
  - **Schnelle Budget-Navigation**: Direkte Verlinkung zum Budget-Management
  - **Heute-Ausgaben prominent**: Hervorgehobene Darstellung der heutigen Ausgaben
- **Budget-Utilization**: 
  - **Präzise Anzeige**: Budget-Auslastung mit einer Dezimalstelle (z.B. 85.3%)
  - **Farbkodierung**: Grün (<80%), Gelb (80-100%), Rot (>100%)
  - **Live-Updates**: Echtzeit-Aktualisierung bei Ausgaben-Änderungen
- **Optimiertes Dashboard**: Korrekte Sortierung für letzte Aktivitäten (neueste zuerst)
- **Einheitliches Design**: Konsistente weiße Card-Darstellung für alle Kennzahlen
- **Top-Kategorien-Ranking**: Kategorien sortiert nach Anzahl der Items
- **Interaktive Charts**: 
  - **Ausgaben-Chart**: Stock-Chart-Style mit Zeitraumfiltern (1W, 1M, 1Y, Max)
  - **Kategorien-Donut-Chart**: Mit Prozentangaben direkt im Chart
  - **Monatliche Ausgaben Bar-Chart**: Mit Werten über den Balken
  - **🌗 Dark Mode Integration**: Vollständig theme-aware Charts mit dynamischen Farbanpassungen
    - **Responsive Legenden**: Automatische Textfarben-Anpassung für optimalen Kontrast
    - **Theme-aware Tooltips**: Hintergrund und Farben passen sich dem Theme an
    - **Grid-Optimierung**: Erhöhte Transparenz und Sichtbarkeit für Dark Mode
    - **Live Updates**: Charts aktualisieren sich ohne Neuaufbau bei Theme-Wechsel
- **Echtzeit-Statistiken**: Aktuelle Inventar-Übersicht mit Tages-Ausgaben und intelligenten Durchschnitten

### 🎨 Modern UI/UX Design
- **Purple Design System**: Kohärentes Design mit modernen lila/purple Farbschemas
- **🌗 Dark Mode Support**: Vollständig implementiertes Dark/Light/Auto Theme-System
  - **Intelligente Theme-Erkennung**: Automatische Systemeinstellungen-Synchronisation  
  - **Persistente Speicherung**: Theme-Wahl wird lokal gespeichert
  - **Theme-aware Charts**: Chart.js Integration mit dynamischen Farbanpassungen
  - **Mobile & Desktop**: Dedizierte Theme-Toggles in Navigation und Mobile-Menu
  - **Umfassende Komponenten-Unterstützung**: Alle Komponenten (Budgets, Reminders, etc.) vollständig dark-mode-kompatibel
- **Mobile-First Responsive**: Vollständig optimiert für alle Geräte (320px - 1920px+)
- **Touch-Optimierung**: 44-48px Touch-Targets für perfekte mobile Bedienung
- **Adaptive Layouts**: 
  - Desktop/Tablet: Klassische Tabellendarstellung
  - Mobile: Card-basierte Layouts ohne horizontales Scrollen
- **Smart Navigation**: Klickbares Brand-Logo für schnelle Dashboard-Navigation
- **Enhanced Interactivity**: 
  - **Editierbare Balance**: Visuell hervorgehobene Edit-Funktionalität mit permanenten Edit-Icons
  - **Budget-Status-Farben**: Intuitive Farbkodierung für Budget-Performance
  - **Hover-Effekte**: Verbesserte User-Experience mit klaren visuellen Rückmeldungen
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
- **📱 Barcode Libraries**: 
  - **@zxing/browser** + **@zxing/library**: Native Barcode-Erkennung für moderne Browser
  - **QuaggaJS**: Safari/Firefox Fallback-Lösung für maximale Kompatibilität

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
# Neue Barcode-Scanner Dependencies
npm install @zxing/browser@^0.1.5 @zxing/library@^0.21.3 quagga@^0.12.1
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
| `/api/inventory/items/search-by-barcode/` | GET | **NEU**: Barcode-Suche in Inventar |
| `/api/inventory/dashboard/` | GET | Dashboard-Statistiken |
| `/api/inventory/expenses-chart/` | GET | Chart-Daten mit Zeitraumfilter |

### Budget-Management
| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/budgets/` | GET/POST | Budgets verwalten |
| `/api/budgets/{id}/` | PUT/DELETE | Budget bearbeiten/löschen |
| `/api/budgets/analytics-data/` | GET | Budget-Analytics mit echten Daten |

### Barcode-Services
| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/barcode/{barcode}/` | GET | **NEU**: Produktinfo von externen APIs |
| **Externe APIs** | - | UPC Database, OpenFoodFacts, UPC ItemDB, Go-UPC |

## 📝 Changelog

### Version 5.0.0 (AKTUELL - Januar 2025) - iOS Barcode-Scanner Revolution 📱
- **📱 Barcode-Scanner Komplett-Implementierung**: 
  - **Dual-Mode Interface**: Kamera-Scanner + Manuelle Eingabe mit Tab-Navigation
  - **Cross-Browser Kompatibilität**: Native BarcodeDetector (Chrome/Edge) + QuaggaJS (Safari/Firefox)
  - **iOS/Safari Volloptimierung**: Hardware-Beschleunigung, playsinline, webkit-spezifische Attribute
  - **Confidence-Based Detection**: 5 konsistente Erkennungen für Anti-Flicker und höchste Genauigkeit
  - **Anti-Spam Mechanismus**: 200ms Mindestabstand zwischen Erkennungen für Stabilität
- **🔍 Produktdatenbank-Integration**: 
  - **Multi-API-Support**: UPC Database, OpenFoodFacts, UPC ItemDB, Go-UPC für maximale Abdeckung
  - **Automatisches Form Pre-Fill**: Produkt-Metadaten werden automatisch in Add-Form übernommen
  - **Intelligenter Fallback**: Manuelle Eingabe bei unbekannten Barcodes mit Barcode-Übernahme
  - **Format-Unterstützung**: EAN-13/8, UPC-A/E, Code 128, Code 39, QR-Codes
- **🎯 Smart Camera Management**: 
  - **Automatisches Resource-Management**: Kamera-Streams werden optimal verwaltet und freigegeben
  - **Visual Guidance System**: Barcode-Ausrichtungshilfen, Scan-Frame-Overlay, Guide-Lines
  - **Error-Handling & Recovery**: Umfassendes Fehler-Management mit benutzerfreundlichen Meldungen
  - **Performance-Optimiert**: Optimierte Scan-Intervalle und Hardware-Beschleunigung
- **🔧 Technische Innovationen**: 
  - **Hybrid Scanning-Engine**: Beste verfügbare Library wird automatisch gewählt
  - **TypeScript Integration**: Vollständig typisierte Barcode-Interfaces und Error-States
  - **Mobile-First Design**: Touch-optimierte Kamera-Controls und responsive Video-Container
  - **Live-Testing Bestätigt**: ✅ Erfolgreiche Tests auf iOS Safari und Android Chrome

### Version 4.0.0 (30.05.2025) - Phase 1 Abgeschlossen
- 💰 **Vollständiges Budget-System**: 
  - **Budget-Erstellung & -Bearbeitung**: Komplette CRUD-Operationen für kategoriebasierte und "Alle Kategorien"-Budgets
  - **Echte Budget-Analytics**: Ersetzte simulierte Daten durch tatsächliche Ausgaben-basierte Analysen
  - **"Alle Kategorien"-Support**: Backend und Frontend-Unterstützung für kategorienübergreifende Budgets
  - **Budget-Status-Tracking**: Echtzeit-Auslastung mit präziser Dezimalanzeige (85.3% statt 85%)
- 🎯 **Dashboard-Revolution**: 
  - **Budget-Integration**: Zentrale Budget-Übersicht mit Live-Status und Farbkodierung
  - **Intelligente Warnungen**: Automatische Anzeige überschrittener Budgets mit Überschreitungsbeträgen
  - **Heute-Ausgaben prominent**: Hervorgehobene Darstellung der heutigen Ausgaben als Hauptmetrik
  - **Smart Budget-Navigation**: Direkte Verlinkung zu Budget-Management mit Warning-Badges
- 🖥️ **UI/UX-Verbesserungen**: 
  - **Editierbare Balance**: Klare visuelle Indikatoren für editierbare Kontostand-Funktion
  - **Dark Mode Fixes**: Vollständige Theme-Unterstützung für alle Komponenten (Budgets, Reminders)
  - **Farbkodierte Budget-Status**: Grün/Gelb/Rot System für intuitive Budget-Performance-Anzeige
  - **Enhanced Interactivity**: Permanente Edit-Icons und verbesserte Hover-Effekte
- 🔧 **Technische Verbesserungen**: 
  - **Budget Service Integration**: Reaktive Budget-Daten-Verwaltung im Frontend
  - **API-Erweiterungen**: Umfassende Budget-Analytics-Endpunkte mit echten Daten
  - **Error Handling**: Separate Loading-States für Budget- vs. Inventar-Daten
  - **Performance-Optimierung**: Effiziente Datenabfrage und -caching für Budget-Operationen

### Version 3.0.0 (Mai 2025)
- 🎨 **Purple Design System**: Vollständig implementiertes kohärentes Design-System
- 🌗 **Dark Mode Support**: Vollständiges Theme-System mit Light/Dark/Auto-Modi
  - **Theme Service**: Reactive Theme-Management mit LocalStorage-Persistierung  
  - **System Integration**: Automatische OS-Theme-Erkennung und Synchronisation
  - **Theme-aware Charts**: Chart.js Integration mit dynamischen Farbanpassungen für alle Charts
  - **Navigation Integration**: Theme-Toggle in Desktop-Navbar und Mobile-Menu
  - **CSS Variables System**: Umfassendes Design-Token-System für konsistente Theming
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
- 📊 **Dashboard-Einheitlichkeit**: Konsistente weiße Card-Darstellung
- 🛠️ **Build-Optimierung**: Angepasste Angular Budgets für umfangreiche Features

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
- **📱 Barcode-Scanner (NEU)**: 
  - **Kamera-Modus**: Teste den Live-Scanner mit echten Barcodes auf iOS Safari und Android Chrome
  - **Produkterkennung**: Scanne Lebensmittel-Barcodes für automatische Produktinfo-Übernahme
  - **Manueller Modus**: Teste Barcode-Eingabe für Produkte ohne Kamera
  - **Cross-Browser**: Vergleiche Performance zwischen Chrome (nativ) und Safari (QuaggaJS)
  - **Visual Guidance**: Prüfe Scan-Frame-Overlay und Barcode-Ausrichtungshilfen
  - **Error-Recovery**: Teste Kamera-Berechtigungen und Fallback-Mechanismen
- **💰 Budget-System**: 
  - **Budget-Erstellung**: Teste kategoriebasierte und "Alle Kategorien"-Budgets
  - **Budget-Bearbeitung**: Vollständige Edit-Funktionalität für alle Parameter
  - **Budget-Analytics**: Echte Daten-basierte Budget-Performance-Analysen
  - **Dashboard-Integration**: Budget-Status und Warnungen im Dashboard
- **🎯 Dashboard-Features**: 
  - **Budget-Übersicht**: Live Budget-Auslastung mit Farbkodierung
  - **Heute-Ausgaben**: Prominente Darstellung der heutigen Ausgaben
  - **Budget-Warnungen**: Automatische Anzeige überschrittener Budgets
  - **Editierbare Balance**: Klicke auf Kontostand für sofortige Bearbeitung
- **Mobile Navigation**: Teste die Touch-Gesten und Card-Layouts auf dem Smartphone
- **🌗 Dark Mode**: Teste den Theme-Wechsel über Navbar (Desktop) oder Mobile-Menu
  - **Auto-Modus**: Synchronisierung mit Systemeinstellungen testen
  - **Charts Dark Mode**: Alle Charts (Donut, Bar, Line) im Dark Mode prüfen
  - **Theme-Persistierung**: Reload der Seite - Theme-Wahl bleibt erhalten
  - **Budget-Components**: Teste Dark Mode in Budget-Formularen und Analytics
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

**Version**: 5.0.0 | **Letztes Update**: Januar 2025 | **Status**: ✅ Production Ready + iOS Barcode-Scanner Revolution

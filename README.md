# 🏠 Haushalts-Inventar-System

Ein modernes, vollständiges Web-basiertes Inventar-Verwaltungssystem für den Haushaltsbereich mit erweiterten Features wie Kontostand-Management, Ausgaben-Tracking, interaktiven Charts und automatisiertem Deployment.

## 🚀 Hauptfeatures

### 🔐 Authentifizierung & Benutzerverwaltung
- Sichere Benutzerregistrierung und Login mit JWT-Token basierter Authentifizierung
- Email-basierte Benutzerkonten mit automatischer Session-Verwaltung
- Benutzerspezifische Datenisolation mit Standard-Kategorien bei Registrierung/Login

### 📦 Inventar-Verwaltung
- **Kategorien**: Vollständige CRUD-Operationen mit intelligenter Kategorie-Verwaltung
- **Gegenstände**: Vereinfachte Item-Verwaltung mit Fokus auf Kern-Features
- **Erweiterte Suche**: Multi-Filter-System (Name, Kategorie, Ort) mit Paginierung
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
- **Top-Kategorien-Ranking**: Kategorien sortiert nach Anzahl der Items
- **Interaktive Charts**: 
  - **Ausgaben-Chart**: Stock-Chart-Style mit Zeitraumfiltern (1W, 1M, 1Y, Max)
  - **Kategorien-Donut-Chart**: Mit Prozentangaben direkt im Chart
  - **Monatliche Ausgaben Bar-Chart**: Mit Werten über den Balken
- **Echtzeit-Statistiken**: Aktuelle Inventar-Übersicht mit Tages-Ausgaben und intelligenten Durchschnitten

### 🎨 Benutzeroberfläche
- **Responsive Design**: Vollständig optimiert für Desktop, Tablet und Mobile (320px - 1920px+)
- **Angular Material**: Moderne, konsistente UI-Komponenten mit harmonisierten Button-Styles
- **Toast-Benachrichtigungen**: Verbessertes Layout ohne doppelte Icons
- **Mobile-First Design**: Touch-optimierte Bedienung mit 44px+ Touch-Targets

## 🛠️ Technologie-Stack

### Backend
- **Django 5.1** mit Django REST Framework für RESTful API-Entwicklung
- **JWT-Authentifizierung** mit djangorestframework-simplejwt
- **SQLite** Production-ready Datenbank

### Frontend
- **Angular 19** mit Standalone Components und Chart.js für interaktive Visualisierungen
- **Angular Material** für umfassende UI-Komponenten
- **TypeScript & RxJS** für typisierte, reactive Programmierung

### Deployment
- **Apache2** Webserver mit mod_rewrite für SPA-Routing
- **Automatisierte Deployment-Scripts** mit Git-basierter Pipeline

## 📋 Systemanforderungen

- **Python**: 3.11+ | **Node.js**: 18+ | **npm**: 8+
- **Apache2** mit mod_rewrite, mod_headers, mod_expires, mod_deflate
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+, vollständig touch-optimiert

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
| `/api/inventory/items/` | GET/POST | Items verwalten |
| `/api/inventory/items/{id}/consume/` | POST | Als verbraucht markieren |
| `/api/inventory/dashboard/` | GET | Dashboard-Statistiken |
| `/api/inventory/expenses-chart/` | GET | Chart-Daten mit Zeitraumfilter |

## 📝 Changelog

### Version 2.7.0 (Aktuell - May 2025)
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

## 🌐 Live Demo

**URL**: https://aileenundnils.de  
**Status**: ✅ Vollständig funktional & Production-Ready  
**Features**: Responsive Design, SPA-Routing, Echtzeit-Updates, korrekte Datumsverarbeitung

### Test-Features
- **Chart-Funktionalität**: Teste die verschiedenen Zeiträume (1W, 1M, 1Y, Max)
- **Mobile Navigation**: Hamburger-Menü und Touch-Gesten
- **Datumserfassung**: Teste Item-Erstellung mit verschiedenen Daten
- **Dashboard-Sortierung**: Prüfe korrekte Reihenfolge bei neuen Items

**Test-Account**: Registrierung erforderlich (kostenlos)

## 📞 Support & Beitragen

- Erstelle ein Issue auf GitHub für Probleme
- Pull Requests willkommen für Verbesserungen
- Prüfe die Troubleshooting-Sektion für häufige Probleme

## 👥 Autoren

**Nils Wolters** - Full-Stack Development - [GitHub](https://github.com/nilsjanis94)

---

**Version**: 2.7.0 | **Letztes Update**: May 2024 | **Status**: ✅ Production Ready

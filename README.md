Ich erstelle Ihnen eine umfassende README.md für Ihr Inventar-System:

```markdown:README.md
# Haushalts-Inventar-System

Ein modernes Web-basiertes Inventar-Verwaltungssystem für den Haushaltsbereich, entwickelt mit Django (Backend) und Angular (Frontend).

## 🚀 Features

### Authentifizierung
- Benutzerregistrierung und Login
- JWT-Token basierte Authentifizierung
- Sichere Session-Verwaltung

### Inventar-Verwaltung
- **Kategorien**: Erstellen, bearbeiten und löschen von Kategorien
- **Gegenstände**: Vollständige CRUD-Operationen für Inventar-Items
- **Erweiterte Suche**: Filtern nach Name, Kategorie, Zustand und Ort
- **Zustandsverfolgung**: 5 verschiedene Zustandsstufen (Neu bis Schlecht)

### Dashboard
- Übersicht über Inventar-Statistiken
- Anzeige der neuesten hinzugefügten Gegenstände
- Kategorien-Übersicht mit Item-Anzahl

### Benutzeroberfläche
- Responsive Design mit Angular Material
- Moderne, intuitive Benutzeroberfläche
- Toast-Benachrichtigungen für Benutzer-Feedback
- Mobile-optimiert

## 🛠️ Technologie-Stack

### Backend
- **Django 5.1**: Web-Framework
- **Django REST Framework**: API-Entwicklung
- **djangorestframework-simplejwt**: JWT-Authentifizierung
- **django-cors-headers**: CORS-Unterstützung
- **SQLite**: Datenbank (entwicklung)

### Frontend
- **Angular 19**: Frontend-Framework
- **Angular Material**: UI-Komponenten
- **TypeScript**: Typisierte Programmierung
- **RxJS**: Reactive Programming
- **NgRx Toastr**: Benachrichtigungen

## 📋 Voraussetzungen

- Python 3.11+
- Node.js 18+
- npm oder yarn

## 🚀 Installation & Setup

### Backend (Django)

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd inventar-system
   ```

2. **Virtual Environment erstellen**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # oder
   venv\Scripts\activate     # Windows
   ```

3. **Dependencies installieren**
   ```bash
   pip install -r requirements.txt
   ```

4. **Datenbank migrieren**
   ```bash
   cd backend
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Superuser erstellen (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Development Server starten**
   ```bash
   python manage.py runserver
   ```

   Backend läuft auf: `http://localhost:8000`

### Frontend (Angular)

1. **In Frontend-Verzeichnis wechseln**
   ```bash
   cd frontend
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Development Server starten**
   ```bash
   ng serve
   ```

   Frontend läuft auf: `http://localhost:4200`

## 📁 Projektstruktur

```
inventar-system/
├── backend/                    # Django Backend
│   ├── inventar_system/       # Hauptprojekt
│   ├── authentication/        # Auth-App
│   ├── inventory/             # Inventar-App
│   ├── manage.py
│   └── requirements.txt
├── frontend/                  # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # UI-Komponenten
│   │   │   ├── services/      # Services
│   │   │   ├── guards/        # Route Guards
│   │   │   └── models/        # TypeScript Models
│   │   └── assets/
│   ├── angular.json
│   └── package.json
├── .gitignore
└── README.md
```

## 🔧 Konfiguration

### Backend-Konfiguration

Die wichtigsten Einstellungen befinden sich in `backend/inventar_system/settings.py`:

- **CORS_ALLOWED_ORIGINS**: Frontend-URL für CORS
- **SIMPLE_JWT**: JWT-Token-Konfiguration
- **DATABASES**: Datenbank-Konfiguration

### Frontend-Konfiguration

API-Basis-URL in `frontend/src/app/services/inventory.service.ts` anpassen:

```typescript
private apiUrl = 'http://localhost:8000/api';
```

## 📊 API-Endpoints

### Authentifizierung
- `POST /api/auth/register/` - Benutzerregistrierung
- `POST /api/auth/login/` - Benutzer-Login
- `POST /api/auth/token/refresh/` - Token erneuern

### Inventar
- `GET /api/inventory/categories/` - Kategorien abrufen
- `POST /api/inventory/categories/` - Kategorie erstellen
- `PUT /api/inventory/categories/{id}/` - Kategorie bearbeiten
- `DELETE /api/inventory/categories/{id}/` - Kategorie löschen

- `GET /api/inventory/items/` - Items abrufen
- `POST /api/inventory/items/` - Item erstellen
- `PUT /api/inventory/items/{id}/` - Item bearbeiten
- `DELETE /api/inventory/items/{id}/` - Item löschen

### Dashboard
- `GET /api/inventory/dashboard/` - Dashboard-Statistiken

## 🎨 Datenmodell

### Category (Kategorie)
- `name`: Name der Kategorie
- `description`: Beschreibung
- `created_at`: Erstellungsdatum

### Item (Gegenstand)
- `name`: Name des Gegenstands
- `description`: Beschreibung
- `category`: Zugehörige Kategorie
- `condition`: Zustand (neu, sehr_gut, gut, befriedigend, schlecht)
- `purchase_date`: Kaufdatum
- `current_value`: Aktueller Wert
- `location`: Aufbewahrungsort
- `serial_number`: Seriennummer
- `warranty_until`: Garantie bis

## 🔐 Sicherheit

- JWT-Token-basierte Authentifizierung
- CORS-Konfiguration für sichere Frontend-Backend-Kommunikation
- Authentifizierte API-Endpoints
- Route Guards im Frontend

## 🚀 Deployment

### Backend (Django)
1. Produktions-Settings konfigurieren
2. Static Files sammeln: `python manage.py collectstatic`
3. Produktions-Datenbank konfigurieren
4. WSGI-Server (z.B. Gunicorn) verwenden

### Frontend (Angular)
1. Produktions-Build: `ng build --prod`
2. `dist/` Ordner auf Webserver deployen
3. API-URLs für Produktion anpassen

## 🤝 Entwicklung

### Code-Style
- Python: PEP 8
- TypeScript: Angular Style Guide
- Prettier für Code-Formatierung

### Testing
```bash
# Backend Tests
cd backend
python manage.py test

# Frontend Tests
cd frontend
ng test
```

## 📝 Lizenz

Dieses Projekt ist für den privaten Gebrauch entwickelt.

## 👨‍💻 Autor

Entwickelt für die private Haushalts-Inventar-Verwaltung.

---

## 🐛 Bekannte Probleme

- Pillow 10.1.0 Kompatibilitätsproblem mit Python 3.13 (gelöst durch Downgrade auf 10.0.1)

## 🔄 Changelog

### Version 1.0.0
- Initiale Version mit vollständiger CRUD-Funktionalität
- JWT-Authentifizierung implementiert
- Dashboard mit Statistiken
- Responsive UI mit Angular Material
```

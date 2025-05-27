```markdown:README.md
# 🏠 Haushalts-Inventar-System

Ein modernes, vollständiges Web-basiertes Inventar-Verwaltungssystem für den Haushaltsbereich mit erweiterten Features wie Kontostand-Management, Ausgaben-Tracking und Verbrauchs-Verwaltung.

## 🚀 Hauptfeatures

### 🔐 Authentifizierung & Benutzerverwaltung
- Sichere Benutzerregistrierung und Login
- JWT-Token basierte Authentifizierung
- Email-basierte Benutzerkonten
- Automatische Session-Verwaltung
- Passwort-Reset-Funktionalität

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

## 📋 Systemanforderungen

- **Python**: 3.11 oder höher
- **Node.js**: 18 oder höher
- **npm**: 8 oder höher
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

# Development Server starten
ng serve

# Oder für Production Build
ng build --configuration production
```

**Frontend läuft auf:** `http://localhost:4200`

## 📁 Detaillierte Projektstruktur

```
inventar-system/
├── backend/                           # Django Backend
│   ├── inventar_system/              # Hauptprojekt-Konfiguration
│   │   ├── settings.py               # Django-Einstellungen
│   │   ├── urls.py                   # URL-Routing
│   │   └── wsgi.py                   # WSGI-Konfiguration
│   ├── authentication/               # Authentifizierungs-App
│   │   ├── models.py                 # CustomUser Model
│   │   ├── views.py                  # Auth-Views & Balance-Update
│   │   ├── serializers.py            # User-Serializers
│   │   └── urls.py                   # Auth-URLs
│   ├── inventory/                    # Inventar-App
│   │   ├── models.py                 # Category & Item Models
│   │   ├── views.py                  # CRUD-Views & Dashboard
│   │   ├── serializers.py            # API-Serializers
│   │   └── urls.py                   # Inventar-URLs
│   ├── manage.py                     # Django-Management
│   ├── requirements.txt              # Python-Dependencies
│   └── db.sqlite3                    # SQLite-Datenbank
├── frontend/                         # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # UI-Komponenten
│   │   │   │   ├── dashboard/        # Dashboard-Komponente
│   │   │   │   ├── inventory/        # Inventar-Verwaltung
│   │   │   │   ├── item-form/        # Item-Formular (Create/Edit)
│   │   │   │   ├── category-form/    # Kategorie-Formular
│   │   │   │   ├── balance-update/   # Kontostand-Update-Dialog
│   │   │   │   ├── login/            # Login-Komponente
│   │   │   │   ├── register/         # Registrierungs-Komponente
│   │   │   │   └── navbar/           # Navigation
│   │   │   ├── services/             # Angular Services
│   │   │   │   ├── auth.service.ts   # Authentifizierung
│   │   │   │   └── inventory.service.ts # Inventar-API
│   │   │   ├── guards/               # Route Guards
│   │   │   │   └── auth.guard.ts     # Authentifizierungs-Guard
│   │   │   ├── interceptors/         # HTTP-Interceptors
│   │   │   │   └── auth.interceptor.ts # JWT-Token-Interceptor
│   │   │   ├── interfaces/           # TypeScript-Interfaces
│   │   │   │   └── inventory.interface.ts # Datenmodelle
│   │   │   └── environments/         # Umgebungskonfiguration
│   │   └── assets/                   # Statische Assets
│   ├── angular.json                  # Angular-Konfiguration
│   ├── package.json                  # Node.js-Dependencies
│   └── proxy.conf.json               # Development-Proxy
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

## 🚀 Deployment

### Production-Build erstellen
```bash
# Frontend Build
cd frontend
ng build --configuration production

# Backend für Production konfigurieren
cd backend
python manage.py collectstatic
python manage.py migrate
```

### Umgebungsvariablen (Production)
```bash
export DEBUG=False
export SECRET_KEY="your-secret-key"
export ALLOWED_HOSTS="yourdomain.com,www.yourdomain.com"
export DATABASE_URL="your-database-url"
```

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

## 📈 Performance-Optimierungen

- **Lazy Loading**: Angular-Module werden bei Bedarf geladen
- **OnPush Change Detection**: Optimierte Change Detection
- **Database Indexing**: Optimierte Datenbankabfragen
- **Caching**: Browser-Caching für statische Assets
- **Minification**: Komprimierte Production-Builds
- **Tree Shaking**: Entfernung ungenutzten Codes

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📝 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` Datei für Details.

## 👥 Autoren

- **Nils Wolters** - *Initial work* - [GitHub](https://github.com/nilswolters)

## 🙏 Danksagungen

- Angular Team für das großartige Framework
- Django Team für das robuste Backend-Framework
- Material Design Team für die UI-Komponenten
- Alle Open-Source-Contributors

## 📞 Support

Bei Fragen oder Problemen:
- Erstelle ein Issue auf GitHub
- Kontaktiere den Entwickler direkt

---

**Version**: 2.0.0  
**Letztes Update**: Dezember 2024  
**Status**: ✅ Production Ready
```


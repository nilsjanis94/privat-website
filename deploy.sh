#!/bin/bash

# Deployment Script für Inventar System
echo "🚀 Starting deployment for Inventar System..."

# Farben für bessere Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
WEB_DIR="/var/www/html"
PROJECT_DIR=$(pwd)

# Fehlerbehandlung
set -e

# Funktion für farbige Ausgabe
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/manage.py" ]; then
    print_error "Bitte führe das Script im Root-Verzeichnis des Projekts aus!"
    exit 1
fi

# Frontend Build
print_status "Building Angular frontend..."
cd frontend

# Node modules installieren falls nötig
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm ci
fi

# Production Build
print_status "Creating production build..."
ng build --configuration production --base-href /

print_success "Frontend build completed!"

# Backend Setup
print_status "Setting up Django backend..."
cd ../backend

# Virtual Environment aktivieren falls vorhanden
if [ -d "venv" ]; then
    print_status "Activating virtual environment..."
    source venv/bin/activate
fi

# Dependencies installieren
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Datenbank migrieren
print_status "Running database migrations..."
python manage.py migrate

# Prüfe ob es unangewendete Migrationen gibt
print_status "Checking for pending migrations..."
PENDING_MIGRATIONS=$(python manage.py showmigrations --plan | grep "\[ \]" | wc -l)
if [ $PENDING_MIGRATIONS -gt 0 ]; then
    print_warning "Found $PENDING_MIGRATIONS pending migrations!"
    python manage.py showmigrations --plan | grep "\[ \]"
    print_status "Applying pending migrations..."
    python manage.py migrate
fi

# Static files sammeln
print_status "Collecting static files..."
python manage.py collectstatic --noinput

print_success "Backend setup completed!"

# Django Backend Service neustarten
print_status "Restarting Django backend service..."
sudo systemctl restart django-backend

# Prüfe ob Service erfolgreich gestartet wurde
if systemctl is-active --quiet django-backend; then
    print_success "Django backend service restarted successfully!"
else
    print_warning "Django backend service restart may have failed. Checking status..."
    sudo systemctl status django-backend --no-pager -l
fi

# Deployment zum Webserver
print_status "Deploying to web directory..."
cd "$PROJECT_DIR"

# Backup erstellen falls Webverzeichnis existiert
if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR)" ]; then
    BACKUP_DIR="/tmp/inventar_backup_$(date +%Y%m%d_%H%M%S)"
    print_warning "Creating backup at $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$WEB_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
fi

# Angular Build kopieren
print_status "Copying Angular build to web directory..."
sudo cp -r frontend/dist/frontend/* "$WEB_DIR/"

# .htaccess kopieren
print_status "Copying .htaccess configuration..."
sudo cp .htaccess "$WEB_DIR/"

# Berechtigungen setzen
print_status "Setting correct permissions..."
sudo chown -R www-data:www-data "$WEB_DIR/"
sudo chmod -R 644 "$WEB_DIR/"
sudo chmod 755 "$WEB_DIR/"
sudo chmod 644 "$WEB_DIR/.htaccess"

# Apache Module prüfen und aktivieren
print_status "Checking Apache modules..."
MODULES_TO_CHECK=("rewrite" "headers" "expires" "deflate")
for module in "${MODULES_TO_CHECK[@]}"; do
    if ! apache2ctl -M 2>/dev/null | grep -q "${module}_module"; then
        print_warning "Activating Apache module: $module"
        sudo a2enmod "$module"
        RESTART_APACHE=true
    fi
done

# Apache neu starten falls Module aktiviert wurden
if [ "$RESTART_APACHE" = true ]; then
    print_status "Restarting Apache..."
    sudo systemctl restart apache2
fi

# Deployment-Info ausgeben
print_success "Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  • Frontend: Built and deployed"
echo "  • Backend: Migrations, static files updated and service restarted"
echo "  • Web directory: $WEB_DIR"
echo "  • .htaccess: Configured for Angular routing"
echo ""
echo "🌐 Your application should now be available at your domain!"
echo ""
echo "🔍 Test these URLs:"
echo "  • https://yourdomain.com/ (should show dashboard)"
echo "  • https://yourdomain.com/login (should show login page)"
echo "  • https://yourdomain.com/api/inventory/dashboard/ (should return JSON)"
echo "  • https://yourdomain.com/api/inventory/expenses-chart/?period=1M (should return chart data)"

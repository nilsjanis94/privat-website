from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict
import calendar
import requests
from .models import Category, Item
from .serializers import CategorySerializer, ItemSerializer, ItemCreateUpdateSerializer

# Helper function for food description generation
def generate_food_description(product):
    """Generiert Beschreibung für Lebensmittel aus OpenFoodFacts"""
    parts = []
    
    if product.get('brands'):
        parts.append(f"Marke: {product['brands']}")
    
    if product.get('categories'):
        # Kategorien kürzen und bereinigen
        categories = product['categories'].split(',')[:2]  # Nur erste 2 Kategorien
        clean_categories = [cat.strip() for cat in categories if cat.strip()]
        if clean_categories:
            parts.append(f"Kategorie: {', '.join(clean_categories)}")
    
    if product.get('quantity'):
        parts.append(f"Menge: {product['quantity']}")
    
    # Nährwerte falls verfügbar
    if product.get('nutriments', {}).get('energy-kcal_100g'):
        kcal = product['nutriments']['energy-kcal_100g']
        parts.append(f"Energie: {kcal} kcal/100g")
    
    description = ' | '.join(parts)
    
    # Auf 200 Zeichen begrenzen
    if len(description) > 200:
        return description[:197] + '...'
    
    return description

# Create your views here.

# Category Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def categories_list_create(request):
    if request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    else:
        categories = Category.objects.filter(owner=request.user).order_by('name')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def category_detail(request, pk):
    try:
        category = Category.objects.get(pk=pk, owner=request.user)  # Nur eigene Kategorien
    except Category.DoesNotExist:
        return Response({'error': 'Kategorie nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Item Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def items_list_create(request):
    if request.method == 'POST':
        # Daten vor Serializer-Validierung bereinigen
        data = request.data.copy()
        
        # Leere Strings zu None
        if data.get('purchase_date') == '':
            data['purchase_date'] = None
        if data.get('purchase_price') == '':
            data['purchase_price'] = None
            
        # ISO-Datum zu YYYY-MM-DD konvertieren
        if data.get('purchase_date') and isinstance(data['purchase_date'], str):
            try:
                # Parse ISO format und extrahiere nur das Datum
                if 'T' in data['purchase_date']:
                    date_obj = datetime.fromisoformat(data['purchase_date'].replace('Z', '+00:00'))
                    data['purchase_date'] = date_obj.date().isoformat()
            except ValueError:
                pass  # Bei Fehler das Original-Datum beibehalten
        
        # Context für Serializer hinzufügen
        serializer = ItemCreateUpdateSerializer(data=data, context={'request': request})

        if serializer.is_valid():
            purchase_price = serializer.validated_data.get('purchase_price', 0) or 0
            
            if purchase_price > 0:
                if request.user.balance >= purchase_price:
                    request.user.balance -= purchase_price
                    request.user.save()
                else:
                    return Response({
                        'error': f'Nicht genügend Guthaben. Verfügbar: {request.user.balance}€, Benötigt: {purchase_price}€'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                item = serializer.save(owner=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    else:
        queryset = Item.objects.filter(owner=request.user).select_related('category', 'owner')
        
        # Filter für verbrauchte/nicht verbrauchte Items
        consumed = request.query_params.get('consumed', None)
        if consumed is not None:
            if consumed.lower() == 'true':
                queryset = queryset.filter(consumed=True)
            elif consumed.lower() == 'false':
                queryset = queryset.filter(consumed=False)
        
        # Zeitraum-Filter für verbrauchte Items (für Shopping List)
        days = request.query_params.get('days', None)
        if days and consumed and consumed.lower() == 'true':
            try:
                days_int = int(days)
                cutoff_date = timezone.now() - timedelta(days=days_int)
                queryset = queryset.filter(consumed_at__gte=cutoff_date)
            except (ValueError, TypeError):
                pass  # Ignoriere ungültige days Parameter
        
        # Suchfunktion
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        
        # Kategorie-Filter
        category = request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Sortierung für bessere Shopping List Funktionalität
        if consumed and consumed.lower() == 'true':
            # Verbrauchte Items nach Verbrauchsdatum sortieren (neueste zuerst)
            queryset = queryset.order_by('-consumed_at', '-updated_at')
        else:
            # Normale Items nach Update-Datum sortieren
            queryset = queryset.order_by('-updated_at')
        
        serializer = ItemSerializer(queryset, many=True)
        return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def item_detail(request, pk):
    try:
        item = Item.objects.get(pk=pk, owner=request.user)  # Nur eigene Items
    except Item.DoesNotExist:
        return Response({'error': 'Gegenstand nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ItemSerializer(item)
        return Response(serializer.data)
    elif request.method in ['PUT', 'PATCH']:
        # Daten vor Serializer-Validierung bereinigen (wie bei CREATE)
        data = request.data.copy()
        
        # Leere Strings zu None
        if data.get('purchase_date') == '':
            data['purchase_date'] = None
        if data.get('purchase_price') == '':
            data['purchase_price'] = None
            
        # ISO-Datum zu YYYY-MM-DD konvertieren
        if data.get('purchase_date') and isinstance(data['purchase_date'], str):
            try:
                # Parse ISO format und extrahiere nur das Datum
                if 'T' in data['purchase_date']:
                    date_obj = datetime.fromisoformat(data['purchase_date'].replace('Z', '+00:00'))
                    data['purchase_date'] = date_obj.date().isoformat()
            except ValueError:
                pass  # Bei Fehler das Original-Datum beibehalten
        
        # Bei Updates den Kontostand NICHT ändern (nur bei Erstellung)
        serializer = ItemCreateUpdateSerializer(item, data=data, context={'request': request})
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        # Optional: Kaufpreis zurück zum Kontostand hinzufügen bei Löschung
        if item.purchase_price:
            request.user.balance += item.purchase_price
            request.user.save()
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Neue View für "Als verbraucht markieren"
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_item_consumed(request, pk):
    try:
        item = Item.objects.get(pk=pk, owner=request.user)
    except Item.DoesNotExist:
        return Response({'error': 'Gegenstand nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    if item.consumed:
        return Response({'error': 'Gegenstand ist bereits als verbraucht markiert'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Quantity um 1 reduzieren
    if item.quantity > 1:
        item.quantity -= 1
        message = f'1x {item.name} verbraucht. Noch {item.quantity} Stück verfügbar.'
    else:
        # Letztes Stück - als vollständig verbraucht markieren
        item.quantity = 0
        item.consumed = True
        item.consumed_at = timezone.now()
        message = f'{item.name} vollständig verbraucht.'
    
    item.save()
    
    return Response({
        'message': message,
        'item': ItemSerializer(item).data
    }, status=status.HTTP_200_OK)

# Neue View für "Verbrauch rückgängig machen"
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unmark_item_consumed(request, pk):
    try:
        item = Item.objects.get(pk=pk, owner=request.user)
    except Item.DoesNotExist:
        return Response({'error': 'Gegenstand nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    if not item.consumed and item.quantity > 0:
        return Response({'error': 'Gegenstand ist nicht als verbraucht markiert'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verbrauch rückgängig machen
    if item.consumed:
        # Item war vollständig verbraucht - wieder verfügbar machen
        item.consumed = False
        item.consumed_at = None
        item.quantity = 1
        message = f'{item.name} ist wieder verfügbar (1 Stück)'
    else:
        # Quantity um 1 erhöhen (falls möglich rückgängig zu machen)
        item.quantity += 1
        message = f'Verbrauch rückgängig gemacht. {item.name} hat jetzt {item.quantity} Stück.'
    
    item.save()
    
    return Response({
        'message': message,
        'item': ItemSerializer(item).data
    }, status=status.HTTP_200_OK)

# Dashboard/Statistics View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user_items = Item.objects.filter(owner=request.user)
    active_items = user_items.filter(consumed=False)  # Nur aktive Items
    consumed_items = user_items.filter(consumed=True)  # Verbrauchte Items
    user_categories = Category.objects.filter(owner=request.user)
    
    # Aktueller Monat
    now = timezone.now()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_month_end = (current_month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
    
    # Heute - NEU
    today = now.date()
    today_items = user_items.filter(
        purchase_date=today,
        purchase_date__isnull=False
    )
    today_expenses = sum(item.purchase_price or 0 for item in today_items)
    
    # Items des aktuellen Monats (ALLE Items, auch verbrauchte, für Ausgaben)
    current_month_items = user_items.filter(
        purchase_date__gte=current_month_start.date(),
        purchase_date__lte=current_month_end.date(),
        purchase_date__isnull=False
    )
    
    # Monatliche Ausgaben berechnen (ALLE Items)
    current_month_expenses = sum(item.purchase_price or 0 for item in current_month_items)
    
    # Ausgaben der letzten 6 Monate (ALLE Items) - ZURÜCK ZUM ORIGINAL
    monthly_expenses = []
    for i in range(6):
        month_date = now - timedelta(days=30 * i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        month_items = user_items.filter(
            purchase_date__gte=month_start.date(),
            purchase_date__lte=month_end.date(),
            purchase_date__isnull=False
        )
        
        month_total = sum(item.purchase_price or 0 for item in month_items)
        
        monthly_expenses.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': f"{calendar.month_name[month_start.month]} {month_start.year}",
            'total_expenses': float(month_total),
            'items_count': month_items.count()
        })
    
    monthly_expenses.reverse()
    
    # Berechne Statistiken (nur aktive Items für Inventar)
    total_current_value = sum(item.purchase_price or 0 for item in active_items)
    total_purchase_price = sum(item.purchase_price or 0 for item in user_items)  # Alle Items
    
    stats = {
        'total_items': active_items.count(),
        'consumed_items': consumed_items.count(),
        'total_value': total_current_value,
        'total_purchase_price': total_purchase_price,
        'current_month_expenses': float(current_month_expenses),
        'today_expenses': float(today_expenses),
        'monthly_expenses': monthly_expenses,
        'categories_count': user_categories.count(),
        'balance': float(request.user.balance),
        'items_by_category': {},
        'recent_items': ItemSerializer(
            active_items.order_by('-purchase_date', '-created_at')[:5],
            many=True, 
            context={'request': request}
        ).data
    }
    
    # Items nach Kategorie (nur aktive)
    for category in user_categories:
        count = active_items.filter(category=category).count()
        if count > 0:
            stats['items_by_category'][category.name] = count
    
    return Response(stats)

# Neue API für Ausgaben-Chart mit verschiedenen Zeiträumen
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expenses_chart_data(request):
    user_items = Item.objects.filter(owner=request.user)
    period = request.query_params.get('period', '1W')  # Standard: 1W
    
    now = timezone.now()
    data_points = []
    
    if period == '1W':
        # Letzte 7 Tage (täglich)
        for i in range(7):
            day = now.date() - timedelta(days=i)
            
            day_items = user_items.filter(
                purchase_date=day,
                purchase_date__isnull=False
            )
            
            total = sum(item.purchase_price or 0 for item in day_items)
            
            data_points.append({
                'date': day.isoformat(),
                'label': day.strftime('%d.%m'),
                'amount': float(total),
                'items_count': day_items.count()
            })
    
    elif period == '1M':
        # Letzten 30 Tage (täglich)
        for i in range(30):
            day = now.date() - timedelta(days=i)
            
            day_items = user_items.filter(
                purchase_date=day,
                purchase_date__isnull=False
            )
            
            total = sum(item.purchase_price or 0 for item in day_items)
            
            data_points.append({
                'date': day.isoformat(),
                'label': day.strftime('%d.%m'),
                'amount': float(total),
                'items_count': day_items.count()
            })
    
    elif period == '1Y':
        # Letzten 12 Monate (monatlich)
        for i in range(12):
            month_date = now - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_items = user_items.filter(
                purchase_date__gte=month_start.date(),
                purchase_date__lte=month_end.date(),
                purchase_date__isnull=False
            )
            
            total = sum(item.purchase_price or 0 for item in month_items)
            
            data_points.append({
                'date': month_start.date().isoformat(),
                'label': month_start.strftime('%b %y'),
                'amount': float(total),
                'items_count': month_items.count()
            })
    
    elif period == 'MAX':
        # Alle Daten seit dem ersten Kauf (monatlich gruppiert)
        first_item = user_items.filter(purchase_date__isnull=False).order_by('purchase_date').first()
        
        if first_item:
            start_date = first_item.purchase_date
            current_date = now.date()
            
            # Berechne Monate zwischen erstem Kauf und heute
            current_month = current_date.replace(day=1)
            start_month = start_date.replace(day=1)
            
            while start_month <= current_month:
                month_end = (start_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_items = user_items.filter(
                    purchase_date__gte=start_month,
                    purchase_date__lte=month_end,
                    purchase_date__isnull=False
                )
                
                total = sum(item.purchase_price or 0 for item in month_items)
                
                data_points.append({
                    'date': start_month.isoformat(),
                    'label': start_month.strftime('%b %y'),
                    'amount': float(total),
                    'items_count': month_items.count()
                })
                
                # Nächster Monat
                if start_month.month == 12:
                    start_month = start_month.replace(year=start_month.year + 1, month=1)
                else:
                    start_month = start_month.replace(month=start_month.month + 1)
    
    else:
        # Fallback auf 1W
        for i in range(7):
            day = now.date() - timedelta(days=i)
            
            day_items = user_items.filter(
                purchase_date=day,
                purchase_date__isnull=False
            )
            
            total = sum(item.purchase_price or 0 for item in day_items)
            
            data_points.append({
                'date': day.isoformat(),
                'label': day.strftime('%d.%m'),
                'amount': float(total),
                'items_count': day_items.count()
            })
    
    # Daten umkehren (älteste zuerst für Liniendiagramm)
    data_points.reverse()
    
    return Response({
        'period': period,
        'data_points': data_points,
        'total_amount': sum(point['amount'] for point in data_points),
        'total_items': sum(point['items_count'] for point in data_points)
    })

# Budget Management Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def budgets_list_create(request):
    from .serializers import BudgetSerializer
    from .models import Budget
    
    if request.method == 'POST':
        serializer = BudgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    else:
        budgets = Budget.objects.filter(owner=request.user, is_active=True).order_by('-created_at')
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def budget_detail(request, pk):
    from .serializers import BudgetSerializer
    from .models import Budget
    
    try:
        budget = Budget.objects.get(pk=pk, owner=request.user)
    except Budget.DoesNotExist:
        return Response({'error': 'Budget nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = BudgetSerializer(budget)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = BudgetSerializer(budget, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        budget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Reminder Management Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reminders_list(request):
    from .serializers import ReminderSerializer
    from .models import Reminder
    
    reminders = Reminder.objects.filter(
        owner=request.user, 
        is_dismissed=False
    ).order_by('reminder_date')
    
    # Filter für offene/alle Reminders
    show_all = request.query_params.get('all', 'false').lower() == 'true'
    if not show_all:
        reminders = reminders.filter(is_sent=False)
    
    serializer = ReminderSerializer(reminders, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_reminder(request, pk):
    from .models import Reminder
    
    try:
        reminder = Reminder.objects.get(pk=pk, owner=request.user)
    except Reminder.DoesNotExist:
        return Response({'error': 'Erinnerung nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    reminder.is_dismissed = True
    reminder.save()
    
    return Response({'message': 'Erinnerung verworfen'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_reminders(request):
    """Zeigt Items an, die bald ablaufen oder Erinnerungen benötigen"""
    from .serializers import ItemSerializer
    
    items = Item.objects.filter(
        owner=request.user,
        consumed=False,
        reminder_enabled=True,
        expiry_date__isnull=False
    )
    
    # Berechne Items die in den nächsten X Tagen ablaufen
    today = timezone.now().date()
    items_needing_reminder = []
    
    for item in items:
        days_until_expiry = (item.expiry_date - today).days
        if days_until_expiry <= item.reminder_days_before:
            items_needing_reminder.append(item)
    
    serializer = ItemSerializer(items_needing_reminder, many=True)
    return Response(serializer.data)

# Barcode Scanner Features
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_by_barcode(request, barcode):
    """Sucht Items nach Barcode"""
    items = Item.objects.filter(
        owner=request.user,
        barcode=barcode
    )
    serializer = ItemSerializer(items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_info_by_barcode(request, barcode):
    """Holt Produktinformationen über verschiedene APIs für umfassende Produktabdeckung"""
    
    try:
        # 1. UPC Database API - umfassende kostenlose Datenbank
        try:
            upc_response = requests.get(
                f'https://api.upcdatabase.org/product/{barcode}',
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if upc_response.status_code == 200:
                upc_data = upc_response.json()
                
                if upc_data.get('success') and upc_data.get('title'):
                    return Response({
                        'found': True,
                        'name': upc_data.get('title', ''),
                        'brand': upc_data.get('brand', ''),
                        'category': upc_data.get('category', ''),
                        'description': upc_data.get('description', ''),
                        'image_url': upc_data.get('image', ''),
                        'barcode': barcode,
                        'source': 'UPC Database'
                    })
        except requests.exceptions.RequestException as e:
            print(f"UPC Database API Fehler: {e}")
        except Exception as e:
            print(f"UPC Database API unerwarteter Fehler: {e}")
        
        # 2. OpenFoodFacts für Lebensmittel (bewährt und stabil)
        try:
            food_response = requests.get(
                f'https://world.openfoodfacts.org/api/v0/product/{barcode}.json',
                timeout=10
            )
            
            if food_response.status_code == 200:
                food_data = food_response.json()
                
                if food_data.get('status') == 1:
                    product = food_data.get('product', {})
                    
                    return Response({
                        'found': True,
                        'name': product.get('product_name', ''),
                        'brand': product.get('brands', ''),
                        'category': product.get('categories', 'Lebensmittel'),
                        'description': generate_food_description(product),
                        'ingredients': product.get('ingredients_text', ''),
                        'image_url': product.get('image_front_url', ''),
                        'barcode': barcode,
                        'source': 'OpenFoodFacts'
                    })
        except requests.exceptions.RequestException as e:
            print(f"OpenFoodFacts API Fehler: {e}")
        except Exception as e:
            print(f"OpenFoodFacts API unerwarteter Fehler: {e}")
        
        # 3. UPC Item DB als weitere Option
        try:
            item_db_response = requests.get(
                f'https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}',
                timeout=10
            )
            
            if item_db_response.status_code == 200:
                item_data = item_db_response.json()
                
                if item_data.get('code') == 'OK' and item_data.get('items'):
                    item = item_data['items'][0]
                    
                    return Response({
                        'found': True,
                        'name': item.get('title', ''),
                        'brand': item.get('brand', ''),
                        'category': item.get('category', ''),
                        'description': item.get('description', ''),
                        'image_url': '',  # UPC Item DB hat keine Bilder in der kostenlosen Version
                        'barcode': barcode,
                        'source': 'UPC ItemDB'
                    })
        except requests.exceptions.RequestException as e:
            print(f"UPC ItemDB API Fehler: {e}")
        except Exception as e:
            print(f"UPC ItemDB API unerwarteter Fehler: {e}")
        
        # 4. Go-UPC API als Premium-Option (falls konfiguriert)
        try:
            # Diese API benötigt normalerweise einen API-Key, aber wir können es versuchen
            go_upc_response = requests.get(
                f'https://go-upc.com/api/v1/code/{barcode}',
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if go_upc_response.status_code == 200:
                go_upc_data = go_upc_response.json()
                
                if go_upc_data.get('product') and go_upc_data['product'].get('name'):
                    product = go_upc_data['product']
                    return Response({
                        'found': True,
                        'name': product.get('name', ''),
                        'brand': product.get('brand', ''),
                        'category': product.get('category', ''),
                        'description': product.get('description', ''),
                        'image_url': product.get('imageUrl', ''),
                        'barcode': barcode,
                        'source': 'Go-UPC'
                    })
        except requests.exceptions.RequestException as e:
            print(f"Go-UPC API Fehler: {e}")
        except Exception as e:
            print(f"Go-UPC API unerwarteter Fehler: {e}")
        
        # Wenn alle APIs fehlschlagen
        return Response({
            'found': False,
            'message': 'Produkt nicht in verfügbaren Datenbanken gefunden. Sie können das Produkt trotzdem manuell hinzufügen.',
            'suggestion': 'manual_entry',
            'barcode': barcode,
            'tried_sources': ['UPC Database', 'OpenFoodFacts', 'UPC ItemDB', 'Go-UPC']
        })
            
    except Exception as e:
        print(f"Allgemeiner API-Fehler: {e}")
        return Response({
            'found': False,
            'message': f'Fehler beim Abrufen der Produktdaten: {str(e)}',
            'suggestion': 'manual_entry',
            'barcode': barcode
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Budget Dashboard View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_dashboard(request):
    """Dashboard mit Budget-Übersicht und Warnungen"""
    from .models import Budget
    from .serializers import BudgetSerializer
    from django.db.models import Sum
    
    budgets = Budget.objects.filter(owner=request.user, is_active=True)
    budget_data = BudgetSerializer(budgets, many=True).data
    
    # Gesamtstatistiken
    total_budget = sum(float(b['amount']) for b in budget_data)
    total_spent = sum(float(b['spent_this_period']) for b in budget_data)
    budgets_over_limit = [b for b in budget_data if b['is_over_budget']]
    
    return Response({
        'budgets': budget_data,
        'summary': {
            'total_budget': total_budget,
            'total_spent': total_spent,
            'remaining_total': total_budget - total_spent,
            'budgets_over_limit': len(budgets_over_limit),
            'over_budget_details': budgets_over_limit
        }
    })

# Budget Analytics Views - NEU
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_analytics_data(request):
    """Detaillierte Budget-Analytics mit echten historischen Daten"""
    from .models import Budget
    from django.db.models import Sum
    
    period = request.query_params.get('period', '1M')
    user_items = Item.objects.filter(owner=request.user)
    user_budgets = Budget.objects.filter(owner=request.user, is_active=True)
    now = timezone.now()
    
    # Trend-Daten basierend auf echten Ausgaben generieren
    trend_data = []
    
    if period == '1D':
        # Letzte 24 Stunden
        for i in range(24):
            hour_start = now - timedelta(hours=i+1)
            hour_end = now - timedelta(hours=i)
            
            # Items in dieser Stunde
            hour_items = user_items.filter(
                created_at__gte=hour_start,
                created_at__lt=hour_end,
                purchase_price__isnull=False
            )
            
            actual_spending = sum(item.purchase_price or 0 for item in hour_items)
            
            # Geplante Ausgaben basierend auf Budget (geschätzt)
            total_daily_budget = sum(float(b.amount) for b in user_budgets if b.period == 'monthly') / 30
            planned_hourly = total_daily_budget / 24 if total_daily_budget > 0 else 0
            
            trend_data.append({
                'period_label': hour_start.strftime('%H:%M'),
                'planned': round(planned_hourly, 2),
                'actual': float(actual_spending),
                'variance': round(planned_hourly - float(actual_spending), 2),
                'items_count': hour_items.count()
            })
    
    elif period == '1W':
        # Letzte 7 Tage
        for i in range(7):
            day = now.date() - timedelta(days=i)
            
            day_items = user_items.filter(
                purchase_date=day,
                purchase_price__isnull=False
            )
            
            actual_spending = sum(item.purchase_price or 0 for item in day_items)
            
            # Geplante tägliche Ausgaben
            total_daily_budget = sum(float(b.amount) for b in user_budgets if b.period == 'monthly') / 30
            
            trend_data.append({
                'period_label': day.strftime('%a, %d.%m'),
                'planned': round(total_daily_budget, 2),
                'actual': float(actual_spending),
                'variance': round(total_daily_budget - float(actual_spending), 2),
                'items_count': day_items.count()
            })
    
    elif period == '1M':
        # Letzte 4 Wochen
        for i in range(4):
            week_start = now.date() - timedelta(weeks=i+1)
            week_end = now.date() - timedelta(weeks=i)
            
            week_items = user_items.filter(
                purchase_date__gte=week_start,
                purchase_date__lt=week_end,
                purchase_price__isnull=False
            )
            
            actual_spending = sum(item.purchase_price or 0 for item in week_items)
            
            # Geplante wöchentliche Ausgaben
            total_weekly_budget = sum(float(b.amount) for b in user_budgets if b.period == 'monthly') / 4
            
            week_number = week_start.isocalendar()[1]
            
            trend_data.append({
                'period_label': f'KW {week_number}',
                'planned': round(total_weekly_budget, 2),
                'actual': float(actual_spending),
                'variance': round(total_weekly_budget - float(actual_spending), 2),
                'items_count': week_items.count()
            })
    
    else:  # 3M, 6M, 12M
        months = {'3M': 3, '6M': 6, '12M': 12}.get(period, 6)
        
        for i in range(months):
            month_date = now - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_items = user_items.filter(
                purchase_date__gte=month_start.date(),
                purchase_date__lte=month_end.date(),
                purchase_price__isnull=False
            )
            
            actual_spending = sum(item.purchase_price or 0 for item in month_items)
            
            # Geplante monatliche Ausgaben
            total_monthly_budget = sum(float(b.amount) for b in user_budgets if b.period == 'monthly')
            
            trend_data.append({
                'period_label': month_start.strftime('%b %y'),
                'planned': round(total_monthly_budget, 2),
                'actual': float(actual_spending),
                'variance': round(total_monthly_budget - float(actual_spending), 2),
                'items_count': month_items.count()
            })
    
    # Reverse für chronologische Reihenfolge
    trend_data.reverse()
    
    # Kategorie-Analyse basierend auf echten Daten
    categories_analysis = []
    user_categories = Category.objects.filter(owner=request.user)
    
    # Zeitraum für Kategorien-Analyse
    if period in ['1D', '1W']:
        category_start = now.date() - timedelta(days=7)
    elif period == '1M':
        category_start = now.date() - timedelta(days=30)
    else:
        category_start = now.date() - timedelta(days=90)
    
    # 1. Erst Gesamtbudgets (category=null) behandeln
    total_budgets = user_budgets.filter(category__isnull=True)
    for total_budget in total_budgets:
        # Alle Ausgaben für Gesamtbudget
        all_items = user_items.filter(
            purchase_date__gte=category_start,
            purchase_price__isnull=False
        )
        
        spent_amount = sum(item.purchase_price or 0 for item in all_items)
        budgeted_amount = float(total_budget.amount)
        
        remaining = budgeted_amount - float(spent_amount)
        percent_used = (float(spent_amount) / budgeted_amount * 100) if budgeted_amount > 0 else 0
        
        # Trend berechnen (Vergleich mit vorheriger Periode)
        prev_start = category_start - (now.date() - category_start)
        prev_items = user_items.filter(
            purchase_date__gte=prev_start,
            purchase_date__lt=category_start,
            purchase_price__isnull=False
        )
        prev_spending = sum(item.purchase_price or 0 for item in prev_items)
        
        if prev_spending > 0:
            trend = 'up' if spent_amount > float(prev_spending) else 'down' if spent_amount < float(prev_spending) else 'stable'
        else:
            trend = 'up' if spent_amount > 0 else 'stable'
        
        categories_analysis.append({
            'category': f'{total_budget.name} (Alle Kategorien)',
            'budgeted': budgeted_amount,
            'spent': float(spent_amount),
            'remaining': remaining,
            'percent_used': round(percent_used, 1),
            'trend': trend,
            'items_count': all_items.count()
        })
    
    # 2. Dann kategorienspezifische Budgets
    for category in user_categories:
        # Budget für diese Kategorie
        category_budget = user_budgets.filter(category=category).first()
        budgeted_amount = float(category_budget.amount) if category_budget else 0
        
        # Tatsächliche Ausgaben in dieser Kategorie
        category_items = user_items.filter(
            category=category,
            purchase_date__gte=category_start,
            purchase_price__isnull=False
        )
        
        spent_amount = sum(item.purchase_price or 0 for item in category_items)
        
        if budgeted_amount > 0 or spent_amount > 0:
            remaining = budgeted_amount - float(spent_amount)
            percent_used = (float(spent_amount) / budgeted_amount * 100) if budgeted_amount > 0 else 0
            
            # Trend berechnen (Vergleich mit vorheriger Periode)
            prev_start = category_start - (now.date() - category_start)
            prev_items = user_items.filter(
                category=category,
                purchase_date__gte=prev_start,
                purchase_date__lt=category_start,
                purchase_price__isnull=False
            )
            prev_spending = sum(item.purchase_price or 0 for item in prev_items)
            
            if prev_spending > 0:
                trend = 'up' if spent_amount > float(prev_spending) else 'down' if spent_amount < float(prev_spending) else 'stable'
            else:
                trend = 'up' if spent_amount > 0 else 'stable'
            
            categories_analysis.append({
                'category': category.name,
                'budgeted': budgeted_amount,
                'spent': float(spent_amount),
                'remaining': remaining,
                'percent_used': round(percent_used, 1),
                'trend': trend,
                'items_count': category_items.count()
            })
    
    return Response({
        'period': period,
        'trend_data': trend_data,
        'categories_analysis': categories_analysis,
        'summary': {
            'total_planned': sum(item['planned'] for item in trend_data),
            'total_actual': sum(item['actual'] for item in trend_data),
            'total_variance': sum(item['variance'] for item in trend_data),
            'total_items': sum(item['items_count'] for item in trend_data)
        }
    })

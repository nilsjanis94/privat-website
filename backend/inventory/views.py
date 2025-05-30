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
    
    # Als verbraucht markieren
    item.consumed = True
    item.consumed_at = timezone.now()
    item.save()
    
    return Response({
        'message': f'{item.name} wurde als verbraucht markiert',
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
    
    if not item.consumed:
        return Response({'error': 'Gegenstand ist nicht als verbraucht markiert'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verbrauch rückgängig machen
    item.consumed = False
    item.consumed_at = None
    item.save()
    
    return Response({
        'message': f'{item.name} ist wieder verfügbar',
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
    """Holt Produktinformationen über externe API (z.B. OpenFoodFacts)"""
    
    try:
        # OpenFoodFacts API für Produktinformationen
        response = requests.get(f'https://world.openfoodfacts.org/api/v0/product/{barcode}.json')
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 1:  # Produkt gefunden
                product = data.get('product', {})
                
                return Response({
                    'found': True,
                    'name': product.get('product_name', ''),
                    'brand': product.get('brands', ''),
                    'category': product.get('categories', ''),
                    'ingredients': product.get('ingredients_text', ''),
                    'image_url': product.get('image_front_url', ''),
                    'barcode': barcode
                })
            else:
                return Response({
                    'found': False,
                    'message': 'Produkt nicht in der Datenbank gefunden'
                })
        else:
            return Response({
                'found': False,
                'message': 'Fehler beim Abrufen der Produktdaten'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'found': False,
            'message': f'Fehler: {str(e)}'
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

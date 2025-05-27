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
        serializer = ItemCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Kontostand prüfen und abziehen - KORRIGIERT: purchase_price statt current_value
            purchase_price = serializer.validated_data.get('purchase_price', 0) or 0
            
            # Nur abziehen wenn ein Kaufpreis angegeben wurde
            if purchase_price > 0:
                if request.user.balance >= purchase_price:
                    request.user.balance -= purchase_price
                    request.user.save()
                else:
                    return Response({
                        'error': f'Nicht genügend Guthaben. Verfügbar: {request.user.balance}€, Benötigt: {purchase_price}€'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Item erstellen
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    else:
        queryset = Item.objects.filter(owner=request.user).select_related('category', 'owner')
        
        # Suchfunktion
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search) |
                Q(serial_number__icontains=search)
            )
        
        # Kategorie-Filter
        category = request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Zustand-Filter
        condition = request.query_params.get('condition', None)
        if condition:
            queryset = queryset.filter(condition=condition)
        
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
        # Bei Updates den Kontostand NICHT ändern (nur bei Erstellung)
        serializer = ItemCreateUpdateSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
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
    
    # Items des aktuellen Monats (ALLE Items, auch verbrauchte, für Ausgaben)
    current_month_items = user_items.filter(
        purchase_date__gte=current_month_start.date(),
        purchase_date__lte=current_month_end.date(),
        purchase_date__isnull=False
    )
    
    # Monatliche Ausgaben berechnen (ALLE Items)
    current_month_expenses = sum(item.purchase_price or 0 for item in current_month_items)
    
    # Ausgaben der letzten 6 Monate (ALLE Items)
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
    total_current_value = sum(item.current_value or 0 for item in active_items)
    total_purchase_price = sum(item.purchase_price or 0 for item in user_items)  # Alle Items
    items_without_purchase_date = user_items.filter(purchase_date__isnull=True).count()
    
    stats = {
        'total_items': active_items.count(),  # Nur aktive Items
        'consumed_items': consumed_items.count(),  # Verbrauchte Items
        'total_value': total_current_value,  # Nur aktive Items
        'total_purchase_price': total_purchase_price,  # Alle Items
        'current_month_expenses': float(current_month_expenses),  # Alle Items
        'monthly_expenses': monthly_expenses,  # Alle Items
        'items_without_purchase_date': items_without_purchase_date,
        'categories_count': user_categories.count(),
        'balance': float(request.user.balance),
        'items_by_condition': {},
        'items_by_category': {},
        'recent_items': ItemSerializer(
            active_items.order_by('-created_at')[:5],  # Nur aktive Items
            many=True, 
            context={'request': request}
        ).data
    }
    
    # Items nach Zustand (nur aktive)
    for condition_key, condition_label in Item.CONDITION_CHOICES:
        count = active_items.filter(condition=condition_key).count()
        stats['items_by_condition'][condition_key] = {
            'label': condition_label,
            'count': count
        }
    
    # Items nach Kategorie (nur aktive)
    for category in user_categories:
        count = active_items.filter(category=category).count()
        if count > 0:
            stats['items_by_category'][category.name] = count
    
    return Response(stats)

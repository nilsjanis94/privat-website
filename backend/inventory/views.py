from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
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
        category = Category.objects.get(pk=pk)
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
        serializer = ItemCreateUpdateSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Dashboard/Statistics View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user_items = Item.objects.filter(owner=request.user)
    user_categories = Category.objects.filter(owner=request.user)  # Nur User-Kategorien
    
    stats = {
        'total_items': user_items.count(),
        'total_value': sum(item.current_value or 0 for item in user_items),
        'categories_count': user_categories.count(),  # User-Kategorien zählen
        'items_by_condition': {},
        'items_by_category': {},
        'recent_items': ItemSerializer(
            user_items.order_by('-created_at')[:5], 
            many=True, 
            context={'request': request}
        ).data
    }
    
    # Items nach Zustand
    for condition_key, condition_label in Item.CONDITION_CHOICES:
        count = user_items.filter(condition=condition_key).count()
        stats['items_by_condition'][condition_key] = {
            'label': condition_label,
            'count': count
        }
    
    # Items nach Kategorie - nur User-Kategorien
    for category in user_categories:  # Geändert von Category.objects.all()
        count = user_items.filter(category=category).count()
        if count > 0:
            stats['items_by_category'][category.name] = count
    
    return Response(stats)

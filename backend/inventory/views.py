from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Category, Item
from .serializers import CategorySerializer, ItemSerializer, ItemCreateUpdateSerializer

# Create your views here.

# Category Views
class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.all().order_by('name')

class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.all()

# Item Views
class ItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ItemCreateUpdateSerializer
        return ItemSerializer
    
    def get_queryset(self):
        queryset = Item.objects.filter(owner=self.request.user).select_related('category', 'owner')
        
        # Suchfunktion
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search) |
                Q(serial_number__icontains=search)
            )
        
        # Kategorie-Filter
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Zustand-Filter
        condition = self.request.query_params.get('condition', None)
        if condition:
            queryset = queryset.filter(condition=condition)
        
        return queryset.order_by('-created_at')

class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ItemCreateUpdateSerializer
        return ItemSerializer
    
    def get_queryset(self):
        return Item.objects.filter(owner=self.request.user).select_related('category', 'owner')

# Dashboard/Statistics View
@api_view(['GET'])
def dashboard_stats(request):
    user_items = Item.objects.filter(owner=request.user)
    
    stats = {
        'total_items': user_items.count(),
        'total_value': sum(item.current_value or 0 for item in user_items),
        'categories_count': Category.objects.count(),
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
    
    # Items nach Kategorie
    categories = Category.objects.all()
    for category in categories:
        count = user_items.filter(category=category).count()
        if count > 0:
            stats['items_by_category'][category.name] = count
    
    return Response(stats)

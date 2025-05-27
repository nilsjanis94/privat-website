from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.categories_list_create, name='category-list-create'),
    path('categories/<int:pk>/', views.category_detail, name='category-detail'),
    
    # Items
    path('items/', views.items_list_create, name='item-list-create'),
    path('items/<int:pk>/', views.item_detail, name='item-detail'),
    
    # Dashboard
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.categories_list_create, name='category-list-create'),
    path('categories/<int:pk>/', views.category_detail, name='category-detail'),
    
    # Items
    path('items/', views.items_list_create, name='item-list-create'),
    path('items/<int:pk>/', views.item_detail, name='item-detail'),
    path('items/<int:pk>/consume/', views.mark_item_consumed, name='item-consume'),
    path('items/<int:pk>/unconsume/', views.unmark_item_consumed, name='item-unconsume'),
    
    # Dashboard
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('expenses-chart/', views.expenses_chart_data, name='expenses_chart_data'),
    
    # Budget Management
    path('budgets/', views.budgets_list_create, name='budget-list-create'),
    path('budgets/<int:pk>/', views.budget_detail, name='budget-detail'),
    path('budget-dashboard/', views.budget_dashboard, name='budget-dashboard'),
    path('budget-analytics/', views.budget_analytics_data, name='budget-analytics-data'),
    
    # Reminders
    path('reminders/', views.reminders_list, name='reminders-list'),
    path('reminders/<int:pk>/dismiss/', views.dismiss_reminder, name='dismiss-reminder'),
    path('pending-reminders/', views.pending_reminders, name='pending-reminders'),
    
    # Barcode Scanner
    path('barcode/<str:barcode>/search/', views.search_by_barcode, name='barcode-search'),
    path('barcode/<str:barcode>/info/', views.product_info_by_barcode, name='barcode-info'),
]

from django.contrib import admin
from .models import Category, Item

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'owner', 'condition', 'current_value', 'created_at')
    list_filter = ('category', 'condition', 'created_at', 'owner')
    search_fields = ('name', 'description', 'serial_number', 'location')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Grundinformationen', {
            'fields': ('name', 'description', 'category', 'owner')
        }),
        ('Kaufinformationen', {
            'fields': ('purchase_date', 'purchase_price', 'current_value')
        }),
        ('Details', {
            'fields': ('condition', 'location', 'serial_number', 'warranty_until', 'image')
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

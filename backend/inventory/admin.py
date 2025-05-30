from django.contrib import admin
from .models import Category, Item, Budget, Reminder

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('name', 'amount', 'period', 'category', 'owner', 'is_active', 'created_at')
    list_filter = ('period', 'is_active', 'created_at', 'owner')
    search_fields = ('name', 'owner__username', 'category__name')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Grundinformationen', {
            'fields': ('name', 'amount', 'period', 'category', 'owner')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('item', 'reminder_type', 'reminder_date', 'is_sent', 'is_dismissed', 'owner')
    list_filter = ('reminder_type', 'is_sent', 'is_dismissed', 'reminder_date', 'owner')
    search_fields = ('item__name', 'message', 'owner__username')
    ordering = ('-reminder_date',)
    
    fieldsets = (
        ('Erinnerung', {
            'fields': ('item', 'owner', 'reminder_type', 'message', 'reminder_date')
        }),
        ('Status', {
            'fields': ('is_sent', 'is_dismissed')
        }),
        ('Zeitstempel', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at',)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'owner', 'purchase_price', 'expiry_date', 'barcode', 'created_at')
    list_filter = ('category', 'created_at', 'owner', 'consumed', 'reminder_enabled')
    search_fields = ('name', 'description', 'location', 'barcode')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Grundinformationen', {
            'fields': ('name', 'description', 'category', 'owner')
        }),
        ('Kaufinformationen', {
            'fields': ('purchase_date', 'purchase_price', 'barcode')
        }),
        ('Details', {
            'fields': ('location',)
        }),
        ('Ablauf & Erinnerungen', {
            'fields': ('expiry_date', 'expected_lifetime_days', 'reminder_enabled', 'reminder_days_before')
        }),
        ('Status', {
            'fields': ('consumed', 'consumed_at')
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'consumed_at')

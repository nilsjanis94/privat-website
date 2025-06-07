from rest_framework import serializers
from .models import Category, Item, Budget, Reminder

class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'items_count']
        read_only_fields = ['id', 'created_at']
    
    def get_items_count(self, obj):
        # Nur aktive (nicht verbrauchte) Items zählen
        return obj.items.filter(consumed=False).count()

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent_this_period = serializers.SerializerMethodField()
    remaining_budget = serializers.SerializerMethodField()
    is_over_budget = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'amount', 'period', 'category', 'category_name', 
            'is_active', 'spent_this_period', 'remaining_budget', 'is_over_budget',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_spent_this_period(self, obj):
        from django.utils import timezone
        from datetime import datetime, timedelta
        from django.db.models import Sum
        
        now = timezone.now()
        if obj.period == 'monthly':
            start_date = now.replace(day=1).date()
        else:  # yearly
            start_date = now.replace(month=1, day=1).date()
        
        items_query = Item.objects.filter(
            owner=obj.owner,
            purchase_date__gte=start_date,
            purchase_price__isnull=False
        )
        
        if obj.category:
            items_query = items_query.filter(category=obj.category)
        
        spent = items_query.aggregate(total=Sum('purchase_price'))['total'] or 0
        return float(spent)
    
    def get_remaining_budget(self, obj):
        spent = self.get_spent_this_period(obj)
        return float(obj.amount) - spent
    
    def get_is_over_budget(self, obj):
        return self.get_remaining_budget(obj) < 0

class ReminderSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = Reminder
        fields = [
            'id', 'item', 'item_name', 'reminder_type', 'message',
            'reminder_date', 'is_sent', 'is_dismissed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    location_display = serializers.CharField(source='get_location_display', read_only=True)
    days_until_expiry = serializers.SerializerMethodField()
    needs_reminder = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'owner', 'owner_name', 'quantity', 'initial_quantity', 'purchase_date', 'purchase_price',
            'location', 'location_display', 'store', 'consumed', 'consumed_at',
            'expiry_date', 'reminder_enabled', 
            'reminder_days_before', 'barcode', 'image_url', 'days_until_expiry', 
            'needs_reminder', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'consumed_at', 'created_at', 'updated_at']
    
    def get_days_until_expiry(self, obj):
        if obj.expiry_date:
            from django.utils import timezone
            delta = obj.expiry_date - timezone.now().date()
            return delta.days
        return None
    
    def get_needs_reminder(self, obj):
        if obj.expiry_date and obj.reminder_enabled:
            days_until = self.get_days_until_expiry(obj)
            if days_until is not None:
                return days_until <= obj.reminder_days_before
        return False
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    # Explizit allow_null und allow_blank für optionale Felder entsprechend dem Model
    quantity = serializers.IntegerField(min_value=1, required=False, default=1)
    initial_quantity = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    purchase_date = serializers.DateField(allow_null=True, required=False)
    purchase_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False)
    location = serializers.CharField(max_length=50, allow_blank=True, required=False)
    store = serializers.CharField(max_length=100, allow_blank=True, required=False)
    description = serializers.CharField(max_length=200, allow_blank=True, required=False)
    expiry_date = serializers.DateField(allow_null=True, required=False)
    barcode = serializers.CharField(max_length=50, allow_blank=True, required=False)
    image_url = serializers.URLField(allow_blank=True, required=False)
    consumed = serializers.BooleanField(required=False)
    
    class Meta:
        model = Item
        fields = [
            'name', 'description', 'category', 'quantity', 'initial_quantity', 'purchase_date',
            'purchase_price', 'location', 'store', 'expiry_date',
            'reminder_enabled', 'reminder_days_before', 'barcode', 'image_url',
            'consumed'
        ]
    
    def validate_category(self, value):
        """Prüfe ob die Kategorie dem aktuellen Benutzer gehört"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if not Category.objects.filter(id=value.id, owner=request.user).exists():
                raise serializers.ValidationError("Kategorie nicht gefunden oder gehört nicht dem Benutzer.")
        return value
    
    def create(self, validated_data):
        # Owner wird von der View über save(owner=...) gesetzt
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Owner nicht ändern bei Updates
        validated_data.pop('owner', None)
        return super().update(instance, validated_data)

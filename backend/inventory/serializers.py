from rest_framework import serializers
from .models import Category, Item

class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'items_count']
        read_only_fields = ['id', 'created_at']
    
    def get_items_count(self, obj):
        # Nur aktive (nicht verbrauchte) Items zählen
        return obj.items.filter(consumed=False).count()

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    location_display = serializers.CharField(source='get_location_display', read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'owner', 'owner_name', 'purchase_date', 'purchase_price',
            'location', 'location_display', 'consumed', 'consumed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'consumed_at', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    # Explizit allow_null und allow_blank für optionale Felder entsprechend dem Model
    purchase_date = serializers.DateField(allow_null=True, required=False)
    purchase_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False)
    location = serializers.CharField(max_length=50, allow_blank=True, required=False)
    description = serializers.CharField(max_length=200, allow_blank=True, required=False)
    
    class Meta:
        model = Item
        fields = [
            'name', 'description', 'category', 'purchase_date',
            'purchase_price', 'location'
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

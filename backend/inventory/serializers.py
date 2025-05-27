from rest_framework import serializers
from .models import Category, Item

class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'items_count']
        read_only_fields = ['id', 'created_at']
    
    def get_items_count(self, obj):
        return obj.items.count()

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'owner', 'owner_name', 'purchase_date', 'purchase_price',
            'current_value', 'condition', 'location', 'serial_number',
            'warranty_until', 'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = [
            'name', 'description', 'category', 'purchase_date',
            'purchase_price', 'current_value', 'condition',
            'location', 'serial_number', 'warranty_until', 'image'
        ]
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

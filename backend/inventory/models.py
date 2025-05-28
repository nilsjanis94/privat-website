from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return self.name

class Item(models.Model):
    CONDITION_CHOICES = [
        ('gut', 'Gut'),
        ('ok', 'OK'),
        ('schlecht', 'Schlecht'),
    ]
    
    LOCATION_CHOICES = [
        ('wohnzimmer', 'Wohnzimmer'),
        ('schlafzimmer', 'Schlafzimmer'),
        ('kueche', 'Küche'),
        ('bad', 'Bad'),
        ('buero', 'Büro'),
        ('keller', 'Keller'),
        ('dachboden', 'Dachboden'),
        ('garage', 'Garage'),
        ('balkon', 'Balkon'),
        ('sonstiges', 'Sonstiges'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=200, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='gut')
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES, blank=True)
    consumed = models.BooleanField(default=False)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.purchase_price and not self.current_value:
            self.current_value = self.purchase_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.owner.username}"

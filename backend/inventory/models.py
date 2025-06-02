from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        unique_together = ['name', 'owner']  # Ein Kategoriename pro Benutzer
    
    def __str__(self):
        return self.name

class Budget(models.Model):
    PERIOD_CHOICES = [
        ('monthly', 'Monatlich'),
        ('yearly', 'Jährlich'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets', null=True, blank=True)
    name = models.CharField(max_length=200)  # z.B. "Lebensmittel Budget" oder "Gesamt Budget"
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['owner', 'category', 'period']  # Ein Budget pro Kategorie/Zeitraum
    
    def __str__(self):
        return f"{self.name} - {self.amount}€ ({self.get_period_display()})"

class Item(models.Model):
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
    quantity = models.PositiveIntegerField(default=1, help_text="Anzahl der Items")
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES, blank=True)
    consumed = models.BooleanField(default=False)
    consumed_at = models.DateTimeField(null=True, blank=True)
    
    # Neue Felder für Verbrauchserinnerungen
    expiry_date = models.DateField(null=True, blank=True, help_text="Ablaufdatum für Lebensmittel etc.")
    expected_lifetime_days = models.IntegerField(null=True, blank=True, help_text="Erwartete Lebensdauer in Tagen")
    reminder_enabled = models.BooleanField(default=False, help_text="Erinnerungen für dieses Item aktivieren")
    reminder_days_before = models.IntegerField(default=3, help_text="Tage vor Ablauf für Erinnerung")
    
    # Barcode für Scanner-Feature
    barcode = models.CharField(max_length=50, blank=True, null=True, help_text="EAN/UPC Barcode")
    image_url = models.URLField(blank=True, null=True, help_text="URL zum Produktbild")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        quantity_str = f" (x{self.quantity})" if self.quantity > 1 else ""
        return f"{self.name}{quantity_str} - {self.owner.username}"

class Reminder(models.Model):
    TYPE_CHOICES = [
        ('expiry', 'Ablaufdatum'),
        ('maintenance', 'Wartung'),
        ('repurchase', 'Nachkauf'),
    ]
    
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='reminders')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    reminder_date = models.DateTimeField()
    is_sent = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_reminder_type_display()} für {self.item.name}"

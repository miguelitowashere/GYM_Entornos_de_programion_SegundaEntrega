from django.db import models
from django.conf import settings
from django.utils import timezone

class Membership(models.Model):
    name = models.CharField(max_length=100)
    days = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    icon = models.CharField(max_length=10, default='🎁')
    color = models.CharField(max_length=20, default='#667eea')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.days} días"


class UserMembership(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    remaining_days = models.IntegerField(default=0)
    last_discount_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.remaining_days} días"
    
    def discount_daily(self):
        today = timezone.now().date()
        if self.last_discount_date != today and self.remaining_days > 0:
            self.remaining_days -= 1
            self.last_discount_date = today
            self.save()
            return True
        return False
from django.db import models
from django.conf import settings
from machines.models import Machine

class Reservation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE)
    hour = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)  # ✅ AGREGADO

    class Meta:
        # ✅ Evita duplicados a nivel de base de datos
        unique_together = ('machine', 'hour')

    def __str__(self):
        return f"{self.user.username} - {self.machine.name} - {self.hour}"
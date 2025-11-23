from django.core.management.base import BaseCommand
from django.utils import timezone
from memberships.models import UserMembership
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class Command(BaseCommand):
    help = 'Descuenta 1 día a todos los usuarios con días restantes > 0'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        
        # Obtener usuarios con días > 0 que NO hayan sido descontados hoy
        memberships = UserMembership.objects.filter(
            remaining_days__gt=0
        ).exclude(last_discount_date=today)

        count = 0
        channel_layer = get_channel_layer()

        for um in memberships:
            um.remaining_days -= 1
            um.last_discount_date = today
            um.save()
            count += 1

            # ✅ Notificar por WebSocket
            async_to_sync(channel_layer.group_send)(
                "reservations_group",
                {
                    "type": "broadcast_message",
                    "message": {
                        "event": "days_updated",
                        "user_id": um.user.id,
                        "username": um.user.username,
                        "days": um.remaining_days,
                    },
                },
            )

        self.stdout.write(
            self.style.SUCCESS(f'✅ Se descontó 1 día a {count} usuarios')
        )
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from reservations.models import Reservation
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class Command(BaseCommand):
    help = 'Elimina reservas cuya hora ya pasó'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        current_time = now.time()
        
        # Obtener todas las reservas
        all_reservations = Reservation.objects.all()
        
        deleted_count = 0
        channel_layer = get_channel_layer()

        for reservation in all_reservations:
            reservation_time = datetime.strptime(reservation.hour, "%H:%M").time()
            
            # Si la hora de la reserva ya pasó (+ 1 hora de margen)
            if reservation_time <= current_time:
                reservation_id = reservation.id
                reservation.delete()
                deleted_count += 1

                # ✅ Notificar por WebSocket
                async_to_sync(channel_layer.group_send)(
                    "reservations_group",
                    {
                        "type": "broadcast_message",
                        "message": {
                            "event": "reservation_deleted",
                            "reservation_id": reservation_id,
                        },
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(f'✅ Se eliminaron {deleted_count} reservas vencidas')
        )
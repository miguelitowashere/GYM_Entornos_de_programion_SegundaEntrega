from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime

from machines.models import Machine
from .models import Reservation

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from memberships.models import UserMembership

User = get_user_model()


class MyReservationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ✅ Eliminar reservas de días anteriores
        today = timezone.now().date()
        Reservation.objects.filter(created_at__date__lt=today).delete()
        
        # ✅ Obtener hora actual
        now = timezone.now()
        current_time = now.time()
        
        # ✅ Obtener solo reservas de HOY del usuario
        reservations = Reservation.objects.filter(
            user=request.user,
            created_at__date=today
        ).order_by('hour')
        
        # Filtrar solo las que aún no han pasado
        active_reservations = []
        for r in reservations:
            reservation_time = datetime.strptime(r.hour, "%H:%M").time()
            if reservation_time > current_time:
                active_reservations.append({
                    "id": r.id,
                    "machine_name": r.machine.name,
                    "hour": r.hour,
                    "created_at": r.created_at.isoformat()
                })
        
        return Response(active_reservations)
    
class CreateReservationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        machine_id = request.data.get("machine")
        hour = request.data.get("hour")

        if not machine_id or not hour:
            return Response(
                {"detail": "Datos incompletos"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ VERIFICAR QUE EL USUARIO TENGA DÍAS DISPONIBLES
        try:
            user_membership = UserMembership.objects.get(user=request.user)
            if user_membership.remaining_days <= 0:
                return Response(
                    {"detail": "No tienes días disponibles para hacer reservas. Contacta al administrador."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserMembership.DoesNotExist:
            return Response(
                {"detail": "No tienes una membresía activa. Contacta al administrador."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            machine = Machine.objects.get(id=machine_id)
        except Machine.DoesNotExist:
            return Response(
                {"detail": "Máquina no existe"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ VALIDAR QUE LA HORA NO HAYA PASADO
        now = timezone.now()
        current_time = now.time()
        reservation_time = datetime.strptime(hour, "%H:%M").time()
        
        if reservation_time <= current_time:
            return Response(
                {"detail": "No puedes reservar una hora que ya pasó"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Verificar si ya está reservada HOY
        today = now.date()
        if Reservation.objects.filter(
            machine=machine, 
            hour=hour,
            created_at__date=today
        ).exists():
            return Response(
                {"detail": "Esta máquina ya está reservada en ese horario"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Crear reserva
        reservation = Reservation.objects.create(
            user=request.user,
            machine=machine,
            hour=hour
        )

        # ✅ ENVIAR NOTIFICACIÓN POR WEBSOCKET
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "reservations_group",
            {
                "type": "broadcast_message",
                "message": {
                    "event": "new_reservation",
                    "reservation_id": reservation.id,
                    "user": request.user.username,
                    "machine": machine.name,
                    "hour": hour,
                },
            },
        )

        return Response({
            "detail": "Reserva creada correctamente",
            "reservation": {
                "id": reservation.id,
                "machine_name": machine.name,
                "hour": hour,
                "created_at": reservation.created_at.isoformat()
            }
        }, status=status.HTTP_201_CREATED)


class ReservationHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"detail": "No autorizado"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # ✅ Eliminar reservas de días anteriores
        today = timezone.now().date()
        deleted_count = Reservation.objects.filter(created_at__date__lt=today).count()
        Reservation.objects.filter(created_at__date__lt=today).delete()
        
        if deleted_count > 0:
            print(f"🗑️ {deleted_count} reservas antiguas eliminadas")

        # ✅ Obtener hora actual
        now = timezone.now()
        current_time = now.time()
        
        # ✅ Obtener solo reservas de HOY
        all_reservations = Reservation.objects.filter(
            created_at__date=today
        ).order_by('hour')
        
        active_reservations = []
        for r in all_reservations:
            reservation_time = datetime.strptime(r.hour, "%H:%M").time()
            if reservation_time > current_time:
                active_reservations.append({
                    "id": r.id,
                    "user_name": r.user.username,
                    "machine_name": r.machine.name,
                    "hour": r.hour,
                    "created_at": r.created_at.isoformat(),
                })

        return Response(active_reservations)
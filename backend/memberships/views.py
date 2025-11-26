from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Membership, UserMembership
from .serializers import MembershipSerializer, UserWithDaysSerializer

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()


class MembershipListCreateView(APIView):
    """Lista y crea membresías"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = Membership.objects.filter(is_active=True).order_by('days')
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_staff:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        serializer = MembershipSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MembershipDeleteView(APIView):
    """Elimina una membresía"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        try:
            membership = Membership.objects.get(pk=pk)
            membership.is_active = False  # Soft delete
            membership.save()
            return Response({"success": True}, status=status.HTTP_200_OK)
        except Membership.DoesNotExist:
            return Response({"error": "Membresía no encontrada"}, status=status.HTTP_404_NOT_FOUND)


class AssignDaysView(APIView):
    """Admin asigna días a un usuario"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get("user_id")
        membership_id = request.data.get("membership_id")

        if not user_id or not membership_id:
            return Response({"error": "user_id y membership_id son obligatorios"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuario no existe"}, status=status.HTTP_404_NOT_FOUND)

        try:
            membership = Membership.objects.get(id=membership_id)
        except Membership.DoesNotExist:
            return Response({"error": "Membresía no existe"}, status=status.HTTP_404_NOT_FOUND)

        um, created = UserMembership.objects.get_or_create(user=user)
        
        # ✅ Si es la primera vez que recibe días, establecer la fecha inicial como HOY
        if um.remaining_days == 0 or um.last_discount_date is None:
            um.last_discount_date = timezone.now().date()
        
        um.remaining_days += membership.days
        um.save()

        # Notificación WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "reservations_group",
            {
                "type": "broadcast_message",
                "message": {
                    "event": "days_updated",
                    "user_id": user_id,
                    "username": user.username,
                    "days": um.remaining_days,
                },
            },
        )

        return Response({
            "success": True,
            "user": user.username,
            "membership": membership.name,
            "days_added": membership.days,
            "remaining_days": um.remaining_days
        })


class MyDaysView(APIView):
    """Usuario ve sus días restantes"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            um = UserMembership.objects.get(user=request.user)
            
            # ✅ SOLO DESCONTAR SI YA PASÓ UN DÍA COMPLETO
            today = timezone.now().date()
            
            if um.last_discount_date is not None and um.remaining_days > 0:
                # Calcular días transcurridos desde el último descuento
                days_passed = (today - um.last_discount_date).days
                
                # Solo descontar si ha pasado al menos 1 día
                if days_passed > 0:
                    # Descontar los días que han pasado (máximo los días restantes)
                    days_to_discount = min(days_passed, um.remaining_days)
                    um.remaining_days -= days_to_discount
                    um.last_discount_date = today
                    um.save()
            
            return Response({
                "remaining_days": um.remaining_days,
                "last_discount_date": um.last_discount_date
            })
        except UserMembership.DoesNotExist:
            um = UserMembership.objects.create(
                user=request.user, 
                remaining_days=0,
                last_discount_date=None
            )
            return Response({
                "remaining_days": 0,
                "last_discount_date": None
            })


class AllUsersWithDaysView(APIView):
    """Admin ve todos los usuarios con sus días"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.filter(is_staff=False, is_superuser=False).order_by('username')
        serializer = UserWithDaysSerializer(users, many=True)
        return Response(serializer.data)
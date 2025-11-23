from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

class LoginView(APIView):
    def post(self, request):
        user = authenticate(
            username=request.data.get("username"),
            password=request.data.get("password")
        )

        if not user:
            return Response(
                {"detail": "Credenciales inválidas"},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "is_admin": user.is_staff
        })


class CreateUserView(APIView):
    """Admin crea nuevos usuarios"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Solo admin puede crear usuarios
        if not request.user.is_staff:
            return Response(
                {"error": "No autorizado"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username y password son obligatorios"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": f"El usuario '{username}' ya existe"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear usuario
        user = User.objects.create_user(
            username=username,
            password=password,
            role="user"
        )

        # Enviar notificación por WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "reservations_group",
            {
                "type": "broadcast_message",
                "message": {
                    "event": "user_created",
                    "username": username,
                },
            },
        )

        return Response({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED)
class CreateUserView(APIView):
    """Admin crea nuevos usuarios"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "No autorizado"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username y password son obligatorios"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": f"El usuario '{username}' ya existe"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ CREAR USUARIO NORMAL (NO STAFF)
        user = User.objects.create_user(
            username=username,
            password=password,
            role="user",
            is_staff=False,  # ✅ IMPORTANTE
            is_superuser=False  # ✅ IMPORTANTE
        )

        print(f"✅ Usuario creado: {user.username} (ID: {user.id}, is_staff: {user.is_staff})")

        # Enviar notificación por WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "reservations_group",
            {
                "type": "broadcast_message",
                "message": {
                    "event": "user_created",
                    "username": username,
                    "user_id": user.id,
                },
            },
        )

        return Response({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED)
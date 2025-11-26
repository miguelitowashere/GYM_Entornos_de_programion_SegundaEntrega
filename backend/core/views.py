from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# ✅ IMPORT CORREGIDO - Ajusta la ruta según tu estructura de proyecto
# Si tu modelo UserMembership está en una app llamada "memberships":
from memberships.models import UserMembership
# Si está en otra app, ajusta el import. Por ejemplo:
# from accounts.models import UserMembership

User = get_user_model()

class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"error": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_admin": user.is_staff
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_admin": request.user.is_staff
        })


class CreateUserView(APIView):
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

        user = User.objects.create_user(
            username=username,
            password=password
        )

        # Crear membresía con 0 días
        UserMembership.objects.create(user=user, remaining_days=0)

        return Response({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username
            }
        }, status=status.HTTP_201_CREATED)


class UpdateUserView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        if not request.user.is_staff:
            return Response(
                {"error": "No autorizado"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        # No permitir editar superusuarios
        if user.is_superuser:
            return Response(
                {"error": "No puedes editar un superusuario"},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get("username")
        password = request.data.get("password")

        # Actualizar username si se proporciona
        if username and username != user.username:
            if User.objects.filter(username=username).exists():
                return Response(
                    {"error": f"El usuario '{username}' ya existe"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = username

        # Actualizar password si se proporciona
        if password:
            user.set_password(password)

        user.save()

        return Response({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username
            }
        })


class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if not request.user.is_staff:
            return Response(
                {"error": "No autorizado"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        # No permitir eliminar superusuarios
        if user.is_superuser:
            return Response(
                {"error": "No puedes eliminar un superusuario"},
                status=status.HTTP_403_FORBIDDEN
            )

        # No permitir que el admin se elimine a sí mismo
        if user.id == request.user.id:
            return Response(
                {"error": "No puedes eliminarte a ti mismo"},
                status=status.HTTP_403_FORBIDDEN
            )

        username = user.username
        user.delete()

        return Response({
            "success": True,
            "message": f"Usuario '{username}' eliminado correctamente"
        })
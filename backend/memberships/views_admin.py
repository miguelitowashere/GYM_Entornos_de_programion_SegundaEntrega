from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Membership, UserMembership
from .serializers import MembershipSerializer
from core.models import User


class MembershipViewSet(ModelViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def add_days(self, request):
        user_id = request.data.get("user_id")
        days = request.data.get("days")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuario no existe"}, status=404)

        membership = UserMembership.objects.get(user=user)
        membership.remaining_days += int(days)
        membership.save()

        return Response({
            "status": "ok",
            "remaining_days": membership.remaining_days
        })

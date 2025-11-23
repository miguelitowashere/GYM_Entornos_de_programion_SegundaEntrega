from rest_framework import serializers
from .models import User
from memberships.models import UserMembership

class UserSerializer(serializers.ModelSerializer):
    remaining_days = serializers.SerializerMethodField()

    def get_remaining_days(self, obj):
        try:
            return obj.usermembership.remaining_days
        except UserMembership.DoesNotExist:
            return 0

    class Meta:
        model = User
        fields = ["id", "username", "role", "remaining_days"]

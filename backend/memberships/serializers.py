from rest_framework import serializers
from .models import Membership, UserMembership
from django.contrib.auth import get_user_model

User = get_user_model()

class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ['id', 'name', 'days', 'price', 'icon', 'color', 'is_active', 'created_at']


class UserMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserMembership
        fields = ['id', 'user', 'username', 'remaining_days', 'last_discount_date']


class UserWithDaysSerializer(serializers.ModelSerializer):
    remaining_days = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'remaining_days']
    
    def get_remaining_days(self, obj):
        try:
            membership = UserMembership.objects.get(user=obj)
            return membership.remaining_days
        except UserMembership.DoesNotExist:
            UserMembership.objects.create(user=obj, remaining_days=0)
            return 0
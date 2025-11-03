from rest_framework import serializers
from .models import Like

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'city_name', 'liked_at']
        read_only_fields = ['id', 'liked_at']
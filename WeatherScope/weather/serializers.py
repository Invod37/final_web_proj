from rest_framework import serializers
from .models import Like
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'city_name', 'liked_at']
        read_only_fields = ['id', 'liked_at']

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password1'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password2'}
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("пошта вже використовується")
        return value

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "паролі не співпадають"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password1 = validated_data.pop('password1')
        user = User.objects.create_user(**validated_data, password=password1)
        return user
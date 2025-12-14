from rest_framework import serializers
from .models import Like, SearchHistory, Clothes
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password


class ClothesSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Clothes
        fields = ['id', 'name', 'season', 'temperature_min', 'temperature_max', 'unit', 'img_path', 'image', 'image_url']
        extra_kwargs = {
            'image': {'required': False},
            'img_path': {'required': False}
        }

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        elif obj.img_path:
            return f"/media/{obj.img_path}"
        return None


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'city_name', 'liked_at']
        read_only_fields = ['id', 'liked_at']


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['id', 'city_name', 'searched_at']
        read_only_fields = ['id', 'searched_at']


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
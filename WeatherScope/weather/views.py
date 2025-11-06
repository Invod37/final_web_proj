
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Like
from django.contrib.auth.models import User
from .serializers import LikeSerializer

@api_view(['GET'])
def get_weather(request):
    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    url = 'https://api.openweathermap.org/data/2.5/weather?q={}&units=metric&appid=' + appid
    city = request.query_params.get('city', 'London')
    try:
        response = requests.get(url.format(city))
        response.raise_for_status()
        data = response.json()

        city_info = {
            'city': city,
            'temp': data['main']['temp'],
            'icon': data['weather'][0]['icon'],
            'description': data['weather'][0]['description'],
            'humidity': data['main']['humidity'],
            'wind_speed': data['wind']['speed'],
            'pressure': data['main']['pressure'],
        }

        return Response(city_info, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        return Response(
            {'error': 'Failed to fetch weather data', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except KeyError as e:
        return Response(
            {'error': 'City not found', 'detail': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
@api_view(['POST'])
def like_city(request):
    city_name = request.data.get('city_name')
    if not city_name:
        return Response({"error": "Enter name"})
    if Like.objects.filter(city_name=city_name).exists():
        return Response({"message": "Added"})

    Like.objects.create(city_name=city_name)

    return Response({"message": "Added"})
@api_view(['GET'])
def favorite_cities_list(request):
    cities = Like.objects.all()
    cities_list = [{"id": city.id, "city_name": city.city_name} for city in cities]
    return Response(cities_list)
@api_view(['DELETE'])
def like_city_delete(request, city_id):
    if Like.objects.filter(id=city_id).exists():
        Like.objects.filter(id=city_id).delete()
        return Response({"message": "Deleted"}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "City not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def register(request):
    try:
        username = request.data.get('username')
        password1 = request.data.get('password1')
        password2 = request.data.get('password2')
        email = request.data.get('email')

        if not username or not password1 or not password2 or not email:
            return Response({"error": ["всі поля обов'язкові"]}, 400)

        if password1 != password2:
            return Response({"password2": ["паролі не співпадають"]}, 400)

        if User.objects.filter(username=username).exists():
            return Response({"username": ["користувач вже існує"]}, 400)

        if User.objects.filter(email=email).exists():
            return Response({"email": ["пошта вже існує"]}, 400)

        user = User.objects.create_user(username=username, email=email, password=password1)

        return Response({"message": "registered"}, 201)

    except Exception as e:
        return Response({"error": [str(e)]}, 500)

@api_view(['POST'])
def login(request):

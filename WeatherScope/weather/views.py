from collections import defaultdict
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Like
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import requests
from google import genai


client = genai.Client(api_key='AIzaSyBrFcHanls8a6t7hPgZZWYImNXfMuSkRPE')

def create_chat_title(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if hasattr(response, "text") and response.text:
            return response.text
        elif hasattr(response, "candidates"):
            return response.candidates[0].content.parts[0].text
        else:
            return "No text found in Gemini response."
    except Exception as e:
        return f"Error: {e}"
@api_view(['GET'])
@permission_classes([AllowAny])
def get_weather(request):
    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    units = request.query_params.get('units', 'metric')
    url = f'https://api.openweathermap.org/data/2.5/weather?q={{}}&units={units}&appid=' + appid
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
        return Response({'error': 'Failed to fetch weather data', 'detail': str(e)}, 500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_outfit_advice(request):
    city = request.query_params.get('city', None)
    if not city:
        return Response({"error": "City not specified"}, status=400)
    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    url = 'https://api.openweathermap.org/data/2.5/weather?q={}&units=metric&appid=' + appid
    try:
        weather_response = requests.get(url.format(city))
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        weather_context = (
            f"The temperature in {city} is {weather_data['main']['temp']}°C with "
            f"{weather_data['weather'][0]['description']}. "
            f"Humidity is {weather_data['main']['humidity']}%, "
            f"and wind speed is {weather_data['wind']['speed']} m/s."
        )
        prompt = f"Give me a very short and friendly outfit advice for someone in this weather: {weather_context}"
        advice = create_chat_title(prompt)

        return Response({"city": city, "advice": advice}, status=200)

    except requests.exceptions.RequestException as e:
        return Response({'error': 'Failed to fetch weather data', 'detail': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_city(request):
    user = request.user
    city_name = request.data.get('city_name')

    if not city_name:
        return Response({"error": "Enter city name"}, 400)

    if Like.objects.filter(user=user, city_name=city_name).exists():
        return Response({"message": "Already added"})

    Like.objects.create(user=user, city_name=city_name)
    return Response({"message": "Added"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def favorite_cities_list(request):
    user = request.user
    cities = Like.objects.filter(user=user)
    data = [{"id": c.id, "city_name": c.city_name} for c in cities]
    return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def like_city_delete(request, city_id):
    user = request.user
    if Like.objects.filter(id=city_id, user=user).exists():
        Like.objects.filter(id=city_id, user=user).delete()
        return Response({"message": "Deleted"})
    return Response({"error": "City not found"}, 404)


from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
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

    user = User.objects.create_user(username=username, email=email, password=password1)
    return Response({"message": "registered"}, 201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"username": ["користувач не знайдений"]}, 400)

    if not user.check_password(password):
        return Response({"password": ["неправильний пароль"]}, 400)

    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "message": "logged in"
    })

def get_coordinates(city_name, state_code='', country_code=''):
    limit = 1
    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    url = f"http://api.openweathermap.org/geo/1.0/direct?q={city_name},{state_code},{country_code}&limit={limit}&appid={appid}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if not data:
            return None

        city_data = data[0]
        return {
            'city': city_data.get('name'),
            'lat': city_data.get('lat'),
            'lon': city_data.get('lon'),
            'country': city_data.get('country'),
            'state': city_data.get('state')
        }

    except requests.exceptions.RequestException:
        return None

def transform_forecast(data):
    days = defaultdict(list)
    for item in data['list']:
        date_str = item['dt_txt'].split(' ')[0]
        days[date_str].append(item)

    forecast = []
    for date, items in days.items():
        temps = [i['main']['temp'] for i in items]
        avg_temp = sum(temps) / len(temps)
        weather = items[0]['weather'][0]
        forecast.append({
            'date': date,
            'avg_temp': round(avg_temp, 1),
            'desc': weather['description'],
            'icon': weather['icon']
        })
    return forecast
@api_view(['GET'])
@permission_classes([AllowAny])
def get_forecast(request):
    city = request.query_params.get('city')
    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    cords = get_coordinates(city)
    lat = cords['lat']
    lon = cords['lon']

    try:
        url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={appid}&units=metric'
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        forecast = transform_forecast(data)

    except requests.exceptions.RequestException as e:
        return Response({'error': 'API request failed', 'detail': str(e)}, 500)
    except Exception as e:
        return Response({'error': 'Internal server error', 'detail': str(e)}, 500)
    return Response({'forecast': forecast})


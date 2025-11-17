from drf_yasg.views import get_schema_view
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
    from datetime import datetime
    from .models import SearchHistory

    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    units = request.query_params.get('units', 'metric')
    city = request.query_params.get('city', 'London')

    print("User authenticated:", request.user.is_authenticated)
    if request.user.is_authenticated:
        SearchHistory.add_search(request.user, city)

    current_url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&units={units}&appid={appid}'
    forecast_url = f'https://api.openweathermap.org/data/2.5/forecast?q={city}&units={units}&appid={appid}&cnt=60'

    try:
        current_response = requests.get(current_url)
        current_response.raise_for_status()
        current_data = current_response.json()

        forecast_response = requests.get(forecast_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()
        current_info = {
            'city': city,
            'temp': current_data['main']['temp'],
            'icon': current_data['weather'][0]['icon'],
            'description': current_data['weather'][0]['description'],
            'humidity': current_data['main']['humidity'],
            'wind_speed': current_data['wind']['speed'],
            'pressure': current_data['main']['pressure'],
        }

        from datetime import datetime
        daily_forecasts = {}

        for item in forecast_data['list']:
            date = datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d')

            if date not in daily_forecasts:
                daily_forecasts[date] = {
                    'date': date,
                    'day_name': datetime.fromtimestamp(item['dt']).strftime('%A'),
                    'temp': item['main']['temp'],
                    'temp_min': item['main']['temp_min'],
                    'temp_max': item['main']['temp_max'],
                    'icon': item['weather'][0]['icon'],
                    'description': item['weather'][0]['description'],
                    'humidity': item['main']['humidity'],
                    'wind_speed': item['wind']['speed'],
                    'pressure': item['main']['pressure'],
                }
            else:
                daily_forecasts[date]['temp_min'] = min(daily_forecasts[date]['temp_min'], item['main']['temp_min'])
                daily_forecasts[date]['temp_max'] = max(daily_forecasts[date]['temp_max'], item['main']['temp_max'])

        forecast_list = list(daily_forecasts.values())

        response_data = {
            'current': current_info,
            'forecast': forecast_list
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        return Response({'error': 'Failed to fetch weather data', 'detail': str(e)}, 500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_weather_history(request):
    from datetime import datetime, timedelta
    import time

    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    units = request.query_params.get('units', 'metric')
    city = request.query_params.get('city', 'London')

    print(f"\n=== GET_WEATHER_HISTORY CALLED ===")
    print(f"City: {city}, Units: {units}")

    try:
        geo_url = f'http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={appid}'
        print(f"Geocoding URL: {geo_url}")

        geo_response = requests.get(geo_url)
        geo_response.raise_for_status()
        geo_data = geo_response.json()

        if not geo_data:
            return Response({'error': 'City not found'}, 404)

        lat = geo_data[0]['lat']
        lon = geo_data[0]['lon']
        print(f"Coordinates: lat={lat}, lon={lon}")

        history_list = []
        current_time = int(time.time())

        for i in range(7, 0, -1):
            days_ago = i
            timestamp = current_time - (days_ago * 86400)
            date = datetime.fromtimestamp(timestamp)

            history_list.append({
                'date': date.strftime('%Y-%m-%d'),
                'day_name': date.strftime('%A'),
                'timestamp': timestamp,
                'note': 'Historical data requires OpenWeatherMap subscription'
            })

        current_url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units={units}&appid={appid}'
        current_response = requests.get(current_url)
        current_response.raise_for_status()
        current_data = current_response.json()

        for i, hist in enumerate(history_list):
            hist.update({
                'temp': current_data['main']['temp'] - (i * 0.5),
                'temp_min': current_data['main']['temp_min'] - (i * 0.5),
                'temp_max': current_data['main']['temp_max'] - (i * 0.5),
                'humidity': current_data['main']['humidity'],
                'pressure': current_data['main']['pressure'],
                'wind_speed': current_data['wind']['speed'],
                'description': current_data['weather'][0]['description'],
                'icon': current_data['weather'][0]['icon'],
            })

        response_data = {
            'city': city,
            'history': history_list,
            'note': 'Full historical data requires OpenWeatherMap paid subscription. This is simulated data for demonstration.'
        }

        print(f"History data created for {len(history_list)} days")
        return Response(response_data, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {e}")
        return Response({'error': 'Failed to fetch weather data', 'detail': str(e)}, 500)
    except (KeyError, IndexError) as e:
        print(f"Data parsing error: {e}")
        return Response({'error': 'Invalid data received from weather API', 'detail': str(e)}, 500)
    except Exception as e:
        print(f"Unexpected error: {e}")
        return Response({'error': 'An unexpected error occurred', 'detail': str(e)}, 500)

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
def search_history_list(request):
    """
    Get user's search history (last 7 days)
    Returns list of cities searched with timestamps
    """
    from .models import SearchHistory
    from .serializers import SearchHistorySerializer

    user = request.user

    SearchHistory.cleanup_old_searches()

    history = SearchHistory.objects.filter(user=user)[:50]
    serializer = SearchHistorySerializer(history, many=True)

    return Response({
        'count': history.count(),
        'history': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_search_history(request):
    """
    Clear all search history for the authenticated user
    """
    from .models import SearchHistory

    user = request.user
    deleted_count = SearchHistory.objects.filter(user=user).delete()[0]

    return Response({
        'message': 'Search history cleared',
        'deleted_count': deleted_count
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_search_history_item(request, history_id):
    """
    Delete a specific search history item
    """
    from .models import SearchHistory

    user = request.user

    try:
        history_item = SearchHistory.objects.get(id=history_id, user=user)
        history_item.delete()
        return Response({'message': 'Search history item deleted'})
    except SearchHistory.DoesNotExist:
        return Response({'error': 'History item not found'}, 404)
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

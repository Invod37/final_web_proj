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
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

_client = None

def get_genai_client():
    global _client
    if _client is None:
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "your_gemini_api_key_here":
            raise ValueError("GEMINI_API_KEY is not configured in .env file")
        _client = genai.Client(api_key=api_key)
    return _client

def create_chat_title(prompt: str) -> str:
    try:
        client = get_genai_client()
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

        forecast_list = list(daily_forecasts.values())[:4]

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

        temperature = weather_data['main']['temp']

        from .models import Clothes
        from .serializers import ClothesSerializer
        from django.db.models import Q

        if request.user.is_authenticated:
            clothes = Clothes.objects.filter(
                Q(user=request.user) | Q(user__isnull=True),
                temperature_min__lte=temperature,
                temperature_max__gte=temperature,
                unit='C'
            )
        else:
            clothes = Clothes.objects.filter(
                user__isnull=True,
                temperature_min__lte=temperature,
                temperature_max__gte=temperature,
                unit='C'
            )

        serializer = ClothesSerializer(clothes, many=True)

        return Response({
            "city": city,
            "temperature": temperature,
            "clothes": serializer.data
        }, status=200)

    except requests.exceptions.RequestException as e:
        return Response({'error': 'Failed to fetch weather data', 'detail': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_outfit_advice(request):
    city = request.query_params.get('city', None)
    if not city:
        return Response({"error": "City not specified"}, status=400)

    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    url = 'https://api.openweathermap.org/data/2.5/weather?q={}&units=metric&appid=' + appid

    try:
        weather_response = requests.get(url.format(city))
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        temperature = weather_data['main']['temp']
        description = weather_data['weather'][0]['description']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed']
        precipitation = weather_data.get('rain', {}).get('1h', 0) or weather_data.get('snow', {}).get('1h', 0) or 0

        from openai import OpenAI
        from django.conf import settings

        api_key = settings.OPENAI_API_KEY
        if not api_key or api_key == "your_openai_api_key_here":
            return Response({'error': 'OPENAI_API_KEY is not configured in .env file'}, status=500)

        client = OpenAI(api_key=api_key)

        prompt = f"""You are a professional fashion advisor. Based on the following weather conditions in {city}, recommend specific clothing items.

Weather Details:
- Temperature: {temperature}°C
- Conditions: {description}
- Humidity: {humidity}%
- Wind Speed: {wind_speed} m/s
- Precipitation: {precipitation} mm/h

Provide a list of 5-7 specific clothing items that would be appropriate for this weather. 
Format your response as a simple list, one item per line, without numbering or bullet points.
Be specific (e.g., "wool coat", "light rain jacket", "cotton t-shirt").

Example format:
warm winter coat
wool scarf
leather gloves
thick jeans
winter boots"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful fashion advisor. Always respond with a simple list of clothing items, one per line, without numbers or bullets."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )

        ai_recommendations = response.choices[0].message.content.strip().split('\n')
        ai_recommendations = [item.strip() for item in ai_recommendations if item.strip()]

        ai_recommendations_with_images = []
        for item in ai_recommendations:
            try:
                image_response = client.images.generate(
                    model="dall-e-3",
                    prompt=f"A clean, simple photograph of {item} on white background, fashion product photography style",
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
                image_url = image_response.data[0].url
                ai_recommendations_with_images.append({
                    "name": item,
                    "image_url": image_url
                })
            except Exception as img_error:
                print(f"Failed to generate image for {item}: {img_error}")
                ai_recommendations_with_images.append({
                    "name": item,
                    "image_url": None
                })

        from .models import Clothes
        from .serializers import ClothesSerializer
        from django.db.models import Q

        if request.user.is_authenticated:
            user_clothes = Clothes.objects.filter(
                Q(user=request.user) | Q(user__isnull=True)
            )
        else:
            user_clothes = Clothes.objects.filter(user__isnull=True)

        matched_clothes = []
        matched_names = set()

        for ai_item_obj in ai_recommendations_with_images:
            ai_item = ai_item_obj["name"]
            ai_item_lower = ai_item.lower()
            for clothes_item in user_clothes:
                clothes_name_lower = clothes_item.name.lower()

                if (clothes_name_lower in ai_item_lower or
                    ai_item_lower in clothes_name_lower or
                    any(word in clothes_name_lower for word in ai_item_lower.split() if len(word) > 3)):

                    if clothes_item.name not in matched_names:
                        matched_clothes.append(clothes_item)
                        matched_names.add(clothes_item.name)
                        break

        serializer = ClothesSerializer(matched_clothes, many=True)

        return Response({
            "city": city,
            "temperature": temperature,
            "weather": {
                "description": description,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "precipitation": precipitation
            },
            "ai_recommendations": ai_recommendations_with_images,
            "matched_clothes": serializer.data,
            "total_matches": len(matched_clothes)
        }, status=200)

    except Exception as e:
        return Response({'error': 'Failed to generate AI outfit advice', 'detail': str(e)}, status=500)


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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_clothes_list(request):
    from .models import Clothes
    from .serializers import ClothesSerializer

    if request.method == 'GET':
        clothes = Clothes.objects.filter(user=request.user)
        serializer = ClothesSerializer(clothes, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        serializer = ClothesSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def user_clothes_delete(request, clothes_id):
    from .models import Clothes

    try:
        clothes = Clothes.objects.get(id=clothes_id, user=request.user)
        clothes.delete()
        return Response({"message": "Clothes deleted"}, status=200)
    except Clothes.DoesNotExist:
        return Response({"error": "Clothes not found or not owned by user"}, status=404)



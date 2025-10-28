import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


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
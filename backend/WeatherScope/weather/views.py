import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from .forms import RegisterForm
from .models import ClothingItem, UserClothingChoice

User = get_user_model()


def _ensure_default_clothing_items():
    """Create default clothing items if they don't exist."""
    defaults = [
        # Cold (below -10°C)
        ('Heavy winter coat', ClothingItem.GROUP_COLD, 'Insulated heavy coat for extreme cold'),
        ('Thermal underwear', ClothingItem.GROUP_COLD, 'Base layer for warmth'),
        ('Winter gloves', ClothingItem.GROUP_COLD, 'Insulated gloves'),
        ('Warm hat', ClothingItem.GROUP_COLD, 'Wool or fleece hat'),
        ('Winter boots', ClothingItem.GROUP_COLD, 'Insulated waterproof boots'),
        ('Scarf', ClothingItem.GROUP_COLD, 'Neck protection'),

        # Cool (-10 to +10°C)
        ('Light jacket', ClothingItem.GROUP_COOL, 'Spring/fall jacket'),
        ('Sweater', ClothingItem.GROUP_COOL, 'Warm pullover'),
        ('Long pants', ClothingItem.GROUP_COOL, 'Jeans or trousers'),
        ('Closed shoes', ClothingItem.GROUP_COOL, 'Regular shoes'),
        ('Light scarf', ClothingItem.GROUP_COOL, 'Optional neck protection'),

        # Warm (above +10°C)
        ('T-shirt', ClothingItem.GROUP_WARM, 'Short sleeve shirt'),
        ('Shorts', ClothingItem.GROUP_WARM, 'Summer shorts'),
        ('Light dress', ClothingItem.GROUP_WARM, 'Summer dress'),
        ('Sandals', ClothingItem.GROUP_WARM, 'Open shoes'),
        ('Sunglasses', ClothingItem.GROUP_WARM, 'Sun protection'),
        ('Sun hat', ClothingItem.GROUP_WARM, 'Wide-brimmed hat'),
    ]

    for name, group, description in defaults:
        ClothingItem.objects.get_or_create(
            name=name,
            temperature_group=group,
            defaults={'description': description}
        )


@api_view(['GET'])
def get_weather(request):
    appid = '7e8aa7cdfb2050e8a1c183a3922963a6'
    city = request.query_params.get('city', 'London')
    units = request.query_params.get('units', 'metric')
    url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&units={units}&appid={appid}'

    try:
        response = requests.get(url)
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


def get_clothes_for_temperature(request):
    """Get recommended clothing based on temperature.

    Query params:
    - temp: temperature in Celsius (required)
    """
    if not request.user.is_authenticated:
        return JsonResponse({'detail': 'Authentication required'}, status=401)

    try:
        temp = float(request.GET.get('temp', 0))
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid temperature value'}, status=400)

    if temp < -10:
        group = ClothingItem.GROUP_COLD
        group_label = 'Below -10°C'
    elif -10 <= temp <= 10:
        group = ClothingItem.GROUP_COOL
        group_label = '-10°C to +10°C'
    else:
        group = ClothingItem.GROUP_WARM
        group_label = 'Above +10°C'

    try:
        user_choice = UserClothingChoice.objects.get(user=request.user)
        selected_items = user_choice.clothing_items.filter(temperature_group=group)
        user_selected = [{'id': item.id, 'name': item.name, 'description': item.description}
                        for item in selected_items]
    except UserClothingChoice.DoesNotExist:
        user_selected = []

    all_items = ClothingItem.objects.filter(temperature_group=group)
    available_items = [{'id': item.id, 'name': item.name, 'description': item.description}
                      for item in all_items]

    return JsonResponse({
        'temperature': temp,
        'temperature_group': group,
        'temperature_group_label': group_label,
        'user_selected_items': user_selected,
        'all_available_items': available_items
    })


def get_available_clothing_items(request):
    """Get all available clothing items grouped by temperature."""
    if not request.user.is_authenticated:
        return JsonResponse({'detail': 'Authentication required'}, status=401)

    _ensure_default_clothing_items()

    items_by_group = {
        'cold': [],
        'cool': [],
        'warm': []
    }

    for item in ClothingItem.objects.all():
        items_by_group[item.temperature_group].append({
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'temperature_group': item.temperature_group,
            'temperature_group_label': item.get_temperature_group_display()
        })

    return JsonResponse(items_by_group)


@csrf_exempt
def user_clothing_selection(request):
    """Get or update user's clothing selections."""
    if not request.user.is_authenticated:
        return JsonResponse({'detail': 'Authentication required'}, status=401)

    user_choice, created = UserClothingChoice.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        selected_items = user_choice.clothing_items.all()
        data = [{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'temperature_group': item.temperature_group,
            'temperature_group_label': item.get_temperature_group_display()
        } for item in selected_items]
        return JsonResponse({'selected_items': data})

    elif request.method == 'POST':
        try:
            import json
            body = json.loads(request.body.decode('utf-8'))
            item_ids = body.get('item_ids', [])
        except (json.JSONDecodeError, AttributeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        if not isinstance(item_ids, list):
            return JsonResponse({'error': 'item_ids must be a list'}, status=400)

        user_choice.clothing_items.clear()
        for item_id in item_ids:
            try:
                item = ClothingItem.objects.get(id=item_id)
                user_choice.clothing_items.add(item)
            except ClothingItem.DoesNotExist:
                pass

        return JsonResponse({'success': True, 'message': 'Clothing selections updated'})



def get_current_user(request):
    """Get current logged-in user info."""
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'username': request.user.username,
            'email': request.user.email
        })
    return JsonResponse({'authenticated': False}, status=401)


@csrf_exempt
def register_view(request):
    if request.method == 'GET':
        return HttpResponseRedirect('/static/register.html')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)

            _ensure_default_clothing_items()

            UserClothingChoice.objects.get_or_create(user=user)

            return JsonResponse({'success': True, 'username': user.username})
        else:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)


@csrf_exempt
def login_view(request):
    if request.method == 'GET':
        return HttpResponseRedirect('/static/login.html')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False}, status=401)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect('/static/login.html')

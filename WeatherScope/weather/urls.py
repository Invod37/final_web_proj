from django.urls import path
from . import views

urlpatterns = [
    path('weather/', views.get_weather, name='get-weather'),
    path('favorite-cities/', views. favorite_cities_list, name='favorite_cities'),
    path('like_city/', views.like_city, name='like_city'),
]
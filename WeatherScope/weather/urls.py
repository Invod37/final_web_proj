from django.urls import path
from . import views


urlpatterns = [
    path('weather/', views.get_weather, name='get-weather'),
    path('favorite-cities/', views.favorite_cities_list, name='favorite_cities'),
    path('favorite-cities/<int:city_id>/', views.like_city_delete, name='favorite_cities_delete'),
    path('like-city/', views.like_city, name='like-city'),
    path('register/', views.register, name='register'),
    path('outfit-advice/', views.get_outfit_advice, name='outfit_advice'),

    path('login/', views.login, name='token_obtain_pair'),
]
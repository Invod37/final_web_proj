from django.urls import path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from . import views
schema_view = get_schema_view(
    openapi.Info(
        title="Weather API",
        default_version='v1',
        description="API",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)
urlpatterns = [
    path('weather/', views.get_weather, name='get-weather'),
    path('weather-history/', views.get_weather_history, name='get-weather-history'),
    path('favorite-cities/', views.favorite_cities_list, name='favorite_cities'),
    path('favorite-cities/<int:city_id>/', views.like_city_delete, name='favorite_cities_delete'),
    path('like-city/', views.like_city, name='like-city'),
    path('search-history/', views.search_history_list, name='search-history'),
    path('search-history/clear/', views.clear_search_history, name='clear-search-history'),
    path('search-history/<int:history_id>/', views.delete_search_history_item, name='delete-search-history-item'),
    path('register/', views.register, name='register'),
    path('outfit-advice/', views.get_outfit_advice, name='outfit_advice'),
    path('ai-outfit-advice/', views.ai_outfit_advice, name='ai_outfit_advice'),
    path('login/', views.login, name='token_obtain_pair'),
    path('clothes/', views.user_clothes_list, name='user-clothes-list'),
    path('clothes/<int:clothes_id>/', views.user_clothes_delete, name='user-clothes-delete'),

    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]
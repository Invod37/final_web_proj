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
    path('favorite-cities/', views.favorite_cities_list, name='favorite_cities'),
    path('favorite-cities/<int:city_id>/', views.like_city_delete, name='favorite_cities_delete'),
    path('like-city/', views.like_city, name='like-city'),
    path('register/', views.register, name='register'),
    path('outfit-advice/', views.get_outfit_advice, name='outfit_advice'),
    path('login/', views.login, name='token_obtain_pair'),

    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]
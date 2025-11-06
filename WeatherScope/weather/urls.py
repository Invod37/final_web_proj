from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('weather/', views.get_weather, name='get-weather'),
    path('favorite-cities/', views.favorite_cities_list, name='favorite_cities'),
    path('favorite-cities/<int:city_id>/', views.like_city_delete, name='favorite_cities_delete'),
    path('like-city/', views.like_city, name='like-city'),
    path('register/', views.register, name='register'),


    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
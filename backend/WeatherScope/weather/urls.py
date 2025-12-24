from django.urls import path
from . import views

urlpatterns = [
    path('weather/', views.get_weather, name='get-weather'),

    path('clothes/for-temperature/', views.get_clothes_for_temperature, name='clothes-for-temperature'),
    path('clothes/available/', views.get_available_clothing_items, name='available-clothing-items'),
    path('clothes/my-selection/', views.user_clothing_selection, name='user-clothing-selection'),

    path('user/info/', views.get_current_user, name='current-user'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]
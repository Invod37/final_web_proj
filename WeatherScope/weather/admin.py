from django.contrib import admin
from .models import Like, SearchHistory

# Register your models here.
admin.site.register(Like)


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'city_name', 'searched_at']
    list_filter = ['searched_at', 'user']
    search_fields = ['user__username', 'city_name']
    ordering = ['-searched_at']
    readonly_fields = ['searched_at']


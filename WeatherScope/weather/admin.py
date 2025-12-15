from django.contrib import admin
from .models import Like, SearchHistory, Clothes


@admin.register(Clothes)
class ClothesAdmin(admin.ModelAdmin):
    list_display = ['name', 'season', 'temperature_min', 'temperature_max', 'unit', 'user', 'image_thumbnail']
    list_filter = ['season', 'unit', 'user']
    search_fields = ['name', 'user__username']
    ordering = ['temperature_min']
    raw_id_fields = ['user']
    fields = ['user', 'name', 'season', 'temperature_min', 'temperature_max', 'unit', 'image', 'img_path']

    def image_thumbnail(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="50" height="50" style="object-fit: cover;" />'
        elif obj.img_path:
            return f'<img src="/media/{obj.img_path}" width="50" height="50" style="object-fit: cover;" />'
        return '-'
    image_thumbnail.short_description = 'Image'
    image_thumbnail.allow_tags = True


admin.site.register(Like)


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'city_name', 'searched_at']
    list_filter = ['searched_at', 'user']
    search_fields = ['user__username', 'city_name']
    ordering = ['-searched_at']
    readonly_fields = ['searched_at']


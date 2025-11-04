from django.contrib import admin
from .models import City, ClothingItem, UserClothingChoice

# Register your models here.
admin.site.register(City)


@admin.register(ClothingItem)
class ClothingItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'temperature_group', 'description')
    list_filter = ('temperature_group',)
    search_fields = ('name', 'description')


@admin.register(UserClothingChoice)
class UserClothingChoiceAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_items')
    filter_horizontal = ('clothing_items',)

    def get_items(self, obj):
        return ", ".join([item.name for item in obj.clothing_items.all()[:5]])
    get_items.short_description = 'Selected Items'

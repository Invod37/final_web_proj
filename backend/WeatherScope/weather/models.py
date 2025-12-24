from django.db import models
from django.conf import settings

class City(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class ClothingItem(models.Model):
    """Clothing items managed by admin.
    """

    GROUP_COLD = 'cold'
    GROUP_COOL = 'cool'
    GROUP_WARM = 'warm'

    GROUP_CHOICES = [
        (GROUP_COLD, 'Below -10°C'),
        (GROUP_COOL, '-10°C to +10°C'),
        (GROUP_WARM, 'Above +10°C'),
    ]

    name = models.CharField(max_length=100, help_text='Name of clothing item')
    temperature_group = models.CharField(max_length=10, choices=GROUP_CHOICES)
    description = models.TextField(blank=True, help_text='Optional description')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['temperature_group', 'name']
        verbose_name = 'Clothing Item'
        verbose_name_plural = 'Clothing Items'

    def __str__(self):
        return f"{self.name} ({self.get_temperature_group_display()})"


class UserClothingChoice(models.Model):
    """User's selected clothing items for each temperature group."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clothing_choices')
    clothing_items = models.ManyToManyField(ClothingItem, related_name='chosen_by_users')

    class Meta:
        verbose_name = 'User Clothing Choice'
        verbose_name_plural = 'User Clothing Choices'

    def __str__(self):
        return f"{self.user.username}'s clothing choices"

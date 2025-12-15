from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from datetime import timedelta


class Clothes(models.Model):
    UNIT_CHOICES = [
        ('C', 'Celsius'),
        ('F', 'Fahrenheit'),
    ]

    SEASON_CHOICES = [
        ('winter', 'Winter'),
        ('spring', 'Spring'),
        ('summer', 'Summer'),
        ('autumn', 'Autumn'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    season = models.CharField(max_length=20, choices=SEASON_CHOICES)
    temperature_min = models.FloatField()
    temperature_max = models.FloatField()
    unit = models.CharField(max_length=1, choices=UNIT_CHOICES, default='C')
    img_path = models.CharField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to='clothes_images/', blank=True, null=True)

    class Meta:
        verbose_name = 'Clothes'
        verbose_name_plural = 'Clothes'
        ordering = ['temperature_min']

    def __str__(self):
        return f"{self.name} ({self.temperature_min}-{self.temperature_max}°{self.unit})"


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    city_name = models.CharField(max_length=100)
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'city_name']

    def __str__(self):
        return self.city_name


class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_history')
    city_name = models.CharField(max_length=100)
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-searched_at']
        verbose_name = 'Search History'
        verbose_name_plural = 'Search Histories'
        indexes = [
            models.Index(fields=['user', '-searched_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.city_name} - {self.searched_at}"

    @classmethod
    def cleanup_old_searches(cls):
        seven_days_ago = timezone.now() - timedelta(days=7)
        deleted_count = cls.objects.filter(searched_at__lt=seven_days_ago).delete()[0]
        return deleted_count

    @classmethod
    def add_search(cls, user, city_name):
        if user.is_authenticated:
            cls.objects.create(user=user, city_name=city_name)
            cls.cleanup_old_searches()


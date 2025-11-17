
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from datetime import timedelta

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    city_name = models.CharField(max_length=100)
    liked_at = models.DateTimeField(auto_now_add=True)

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
        """Delete searches older than 7 days"""
        seven_days_ago = timezone.now() - timedelta(days=7)
        deleted_count = cls.objects.filter(searched_at__lt=seven_days_ago).delete()[0]
        return deleted_count

    @classmethod
    def add_search(cls, user, city_name):
        """Add a search to history and clean up old entries"""
        if user.is_authenticated:
            cls.objects.create(user=user, city_name=city_name)
            cls.cleanup_old_searches()


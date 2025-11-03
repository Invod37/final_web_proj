

from django.db import models

class Like(models.Model):
    city_name = models.CharField(max_length=100)
    liked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.city_name
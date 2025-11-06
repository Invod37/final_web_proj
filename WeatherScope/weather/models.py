
from django.contrib.auth.models import User
from django.db import models

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    city_name = models.CharField(max_length=100)
    liked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.city_name

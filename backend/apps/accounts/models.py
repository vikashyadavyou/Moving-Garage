from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access."""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('mechanic', 'Mechanic'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_mechanic(self):
        return self.role == 'mechanic'

    @property
    def is_user(self):
        return self.role == 'user'


class MechanicProfile(models.Model):
    """Extended profile for mechanics with location and availability."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='mechanic_profile'
    )
    is_available = models.BooleanField(default=False)
    current_latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    current_longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_jobs_completed = models.PositiveIntegerField(default=0)
    specializations = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'mechanic_profiles'

    def __str__(self):
        return f"Mechanic: {self.user.get_full_name() or self.user.username}"

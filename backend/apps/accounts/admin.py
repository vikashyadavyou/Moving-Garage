from django.contrib import admin
from .models import User, MechanicProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'phone', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'phone']


@admin.register(MechanicProfile)
class MechanicProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_available', 'rating', 'total_jobs_completed']
    list_filter = ['is_available']

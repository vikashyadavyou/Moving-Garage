from django.contrib import admin
from .models import IssueCatalog, ServiceRequest


@admin.register(IssueCatalog)
class IssueCatalogAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'fixed_cost', 'is_active', 'sort_order']
    list_editable = ['sort_order', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'mechanic', 'status', 'reported_issue', 'total_cost', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'mechanic__username']
    readonly_fields = ['created_at', 'updated_at']

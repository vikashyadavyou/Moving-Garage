"""
Root URL Configuration for Moving Garage.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.services.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
]

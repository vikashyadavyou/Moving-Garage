from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.ProfileView.as_view(), name='profile'),
    path('mechanic/availability/', views.MechanicAvailabilityView.as_view(), name='mechanic-availability'),
    path('mechanic/location/', views.MechanicLocationView.as_view(), name='mechanic-location'),
    path('mechanic/stats/', views.MechanicStatsView.as_view(), name='mechanic-stats'),
]

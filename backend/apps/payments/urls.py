from django.urls import path
from . import views

urlpatterns = [
    path('create-order/', views.CreatePaymentOrderView.as_view(), name='create-payment-order'),
    path('verify/', views.VerifyPaymentView.as_view(), name='verify-payment'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
]

from django.db import models
from apps.services.models import ServiceRequest


class Payment(models.Model):
    """Payment model integrated with Razorpay."""

    STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('ONLINE', 'Online'),
        ('CASH', 'Cash'),
    ]

    payment_method = models.CharField(
        max_length=10, choices=PAYMENT_METHOD_CHOICES, default='ONLINE'
    )

    service_request = models.OneToOneField(
        ServiceRequest, on_delete=models.CASCADE, related_name='payment'
    )
    razorpay_order_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_payment_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_signature = models.CharField(max_length=255, blank=True, default='')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f"Payment #{self.pk} - ₹{self.amount} ({self.status})"

import razorpay
from django.conf import settings

def get_razorpay_client():
    """Get configured Razorpay (payment gateway) client."""
    if settings.PAYMENT_GATEWAY_KEY and settings.PAYMENT_GATEWAY_SECRET:
        return razorpay.Client(
            auth=(settings.PAYMENT_GATEWAY_KEY, settings.PAYMENT_GATEWAY_SECRET)
        )
    return None

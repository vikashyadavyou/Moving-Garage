import razorpay
from django.conf import settings

def get_razorpay_client():
    """Get configured Razorpay client."""
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        return razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    return None

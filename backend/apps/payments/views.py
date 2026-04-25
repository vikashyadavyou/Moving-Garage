from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Payment
from .serializers import PaymentSerializer, PaymentVerifySerializer
from .razorpay_client import get_razorpay_client
from apps.services.models import ServiceRequest


class CreatePaymentOrderView(APIView):
    """POST /api/v1/payments/create-order/ - Create Razorpay order."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request_id = request.data.get('service_request_id')
        service_request = get_object_or_404(
            ServiceRequest, pk=request_id
        )

        if service_request.status != 'completed':
            return Response(
                {'error': 'Service is not yet completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = service_request.total_cost
        amount_paise = int(float(amount) * 100)

        # Try Razorpay, fall back to mock
        client = get_razorpay_client()
        if client:
            order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'payment_capture': '1',
            })
            order_id = order['id']
        else:
            # Mock order for development
            import uuid
            order_id = f'order_mock_{uuid.uuid4().hex[:12]}'

        payment, created = Payment.objects.get_or_create(
            service_request=service_request,
            defaults={
                'razorpay_order_id': order_id,
                'amount': amount,
            }
        )
        if not created:
            payment.razorpay_order_id = order_id
            payment.save()

        return Response({
            'order_id': order_id,
            'amount': amount_paise,
            'currency': 'INR',
            'payment': PaymentSerializer(payment).data,
        })


class VerifyPaymentView(APIView):
    """POST /api/v1/payments/verify/ - Verify payment signature."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        payment = get_object_or_404(
            Payment, razorpay_order_id=data['razorpay_order_id']
        )

        client = get_razorpay_client()
        if client:
            try:
                client.utility.verify_payment_signature({
                    'razorpay_payment_id': data['razorpay_payment_id'],
                    'razorpay_order_id': data['razorpay_order_id'],
                    'razorpay_signature': data['razorpay_signature'],
                })
                verified = True
            except Exception:
                verified = False
        else:
            # Mock verification for development
            verified = True

        if verified:
            payment.razorpay_payment_id = data['razorpay_payment_id']
            payment.razorpay_signature = data['razorpay_signature']
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.save()
            return Response({
                'message': 'Payment verified successfully!',
                'payment': PaymentSerializer(payment).data,
            })
        else:
            payment.status = 'failed'
            payment.save()
            return Response(
                {'error': 'Payment verification failed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PaymentDetailView(APIView):
    """GET /api/v1/payments/{id}/ - Payment status."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        return Response(PaymentSerializer(payment).data)

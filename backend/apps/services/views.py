from decimal import Decimal
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import IssueCatalog, ServiceRequest
from .serializers import (
    IssueCatalogSerializer,
    ServiceRequestCreateSerializer,
    ServiceRequestSerializer,
    DiagnoseOverrideSerializer,
    StatusUpdateSerializer,
)
from .pricing import calculate_quote, recalculate_on_override
from apps.accounts.permissions import IsMechanic, IsUser


class IssueCatalogListView(generics.ListAPIView):
    """GET /api/v1/issues/ - List all available issue types with pricing."""
    queryset = IssueCatalog.objects.filter(is_active=True)
    serializer_class = IssueCatalogSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ServiceRequestCreateView(generics.CreateAPIView):
    """POST /api/v1/requests/ - Create a new service request (User)."""
    serializer_class = ServiceRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsUser]

    def perform_create(self, serializer):
        request_obj = serializer.save(user=self.request.user)

        # Calculate initial pricing with all selected issues
        issues = list(request_obj.reported_issues.all())
        default_distance = Decimal('5.00')  # Default 5km estimate
        pricing = calculate_quote(default_distance, issues)

        request_obj.distance_km = pricing['distance_km']
        request_obj.distance_cost = pricing['distance_cost']
        request_obj.issue_cost = pricing['issue_cost']
        request_obj.total_cost = pricing['total_cost']
        request_obj.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return full serializer data
        full_serializer = ServiceRequestSerializer(serializer.instance)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED)


class ServiceRequestListView(generics.ListAPIView):
    """GET /api/v1/requests/ - List requests.
    - Users: see their own requests
    - Mechanics: see pending requests (available for acceptance)
    """
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'mechanic':
            # Show pending requests (not yet accepted) + mechanic's own jobs
            status_filter = self.request.query_params.get('status', None)
            if status_filter == 'mine':
                return ServiceRequest.objects.filter(mechanic=user)
            return ServiceRequest.objects.filter(status='pending')
        else:
            return ServiceRequest.objects.filter(user=user)


class ServiceRequestDetailView(generics.RetrieveAPIView):
    """GET /api/v1/requests/{id}/ - Request detail."""
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ServiceRequest.objects.all()


class AcceptRequestView(APIView):
    """PATCH /api/v1/requests/{id}/accept/ - Mechanic accepts a request."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def patch(self, request, pk):
        service_request = get_object_or_404(ServiceRequest, pk=pk)

        if service_request.status != 'pending':
            return Response(
                {'error': 'This request is no longer available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mechanic = request.user
        profile = mechanic.mechanic_profile

        # Calculate distance from mechanic to user
        if profile.current_latitude and profile.current_longitude:
            from utils.maps import calculate_distance
            distance = calculate_distance(
                float(profile.current_latitude),
                float(profile.current_longitude),
                float(service_request.user_latitude),
                float(service_request.user_longitude),
            )
        else:
            distance = Decimal('5.00')

        # Recalculate pricing with actual distance and all reported issues
        issues = list(service_request.reported_issues.all())
        if not issues and service_request.reported_issue:
            # Fallback to legacy FK
            issues = [service_request.reported_issue]
        pricing = calculate_quote(distance, issues)

        service_request.mechanic = mechanic
        service_request.status = 'accepted'
        service_request.accepted_at = timezone.now()
        service_request.distance_km = pricing['distance_km']
        service_request.distance_cost = pricing['distance_cost']
        service_request.issue_cost = pricing['issue_cost']
        service_request.total_cost = pricing['total_cost']
        service_request.estimated_arrival_minutes = max(
            int(float(distance) * 3), 5
        )  # Rough estimate: 3 min/km, min 5 min
        service_request.save()

        return Response(ServiceRequestSerializer(service_request).data)


class UpdateStatusView(APIView):
    """PATCH /api/v1/requests/{id}/status/ - Update request status."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def patch(self, request, pk):
        service_request = get_object_or_404(
            ServiceRequest, pk=pk, mechanic=request.user
        )

        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        service_request.status = new_status
        service_request.save(update_fields=['status', 'updated_at'])

        return Response(ServiceRequestSerializer(service_request).data)


class DiagnoseOverrideView(APIView):
    """PATCH /api/v1/requests/{id}/diagnose/ - Mechanic overrides the issue(s)."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def patch(self, request, pk):
        service_request = get_object_or_404(
            ServiceRequest, pk=pk, mechanic=request.user
        )

        if service_request.status not in ('arrived', 'in_progress', 'accepted'):
            return Response(
                {'error': 'Cannot override diagnosis at this stage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DiagnoseOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        issue_ids = serializer.validated_data['actual_issue_ids']
        notes = serializer.validated_data.get('notes', '')
        new_issues = list(IssueCatalog.objects.filter(pk__in=issue_ids))

        # Single consolidated save via recalculate_on_override (fixes double-save bug)
        pricing = recalculate_on_override(service_request, new_issues, notes)

        return Response({
            'message': 'Diagnosis updated. Waiting for user approval.',
            'request': ServiceRequestSerializer(service_request).data,
            'new_pricing': {
                'distance_cost': str(pricing['distance_cost']),
                'issue_cost': str(pricing['issue_cost']),
                'total_cost': str(pricing['total_cost']),
            },
        })


class ApproveQuoteView(APIView):
    """POST /api/v1/requests/{id}/approve-quote/ - User approves new quote."""
    permission_classes = [permissions.IsAuthenticated, IsUser]

    def post(self, request, pk):
        service_request = get_object_or_404(
            ServiceRequest, pk=pk, user=request.user
        )

        if service_request.status != 'quote_pending':
            return Response(
                {'error': 'No pending quote to approve.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # On approval: accept the actual issues as the new active issues
        service_request.user_approved_override = True
        service_request.status = 'in_progress'

        # Remove the "Unknown Issue" diagnostic fee from reported issues
        # and replace with actual diagnosed issues
        unknown_issue = IssueCatalog.objects.filter(slug='unknown-issue').first()
        if unknown_issue and service_request.reported_issues.filter(pk=unknown_issue.pk).exists():
            service_request.reported_issues.remove(unknown_issue)

        # Add actual issues to the reported set so effective_issues reflects them
        actual = service_request.actual_issues.all()
        for issue in actual:
            service_request.reported_issues.add(issue)

        # Recalculate final bill based on the updated reported issues (minus unknown)
        all_issues = list(service_request.reported_issues.all())
        distance_km = service_request.distance_km or Decimal('5.00')
        from .pricing import calculate_quote
        pricing = calculate_quote(distance_km, all_issues)
        service_request.issue_cost = pricing['issue_cost']
        service_request.total_cost = pricing['total_cost']

        service_request.save()

        return Response({
            'message': 'Quote approved. Mechanic can proceed with repair.',
            'request': ServiceRequestSerializer(service_request).data,
        })


class CompleteRequestView(APIView):
    """POST /api/v1/requests/{id}/complete/ - Mark as completed (after payment)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        service_request = get_object_or_404(ServiceRequest, pk=pk)

        # Only allow completion from payment-confirmed states
        # This is called by the system after online payment verification
        if service_request.status not in ('pending_payment',):
            return Response(
                {'error': 'Cannot complete at this stage. Payment must be processed first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service_request.status = 'completed'
        service_request.completed_at = timezone.now()
        service_request.save()

        # Update mechanic stats
        if service_request.mechanic:
            profile = service_request.mechanic.mechanic_profile
            profile.total_jobs_completed += 1
            profile.save(update_fields=['total_jobs_completed'])

        return Response({
            'message': 'Service completed!',
            'request': ServiceRequestSerializer(service_request).data,
        })


class CancelRequestView(APIView):
    """POST /api/v1/requests/{id}/cancel/ - Cancel a request."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        service_request = get_object_or_404(ServiceRequest, pk=pk)

        # Only allow the user to cancel, or mechanic before arrival
        non_cancellable = ('in_progress', 'completed', 'pending_payment', 'pending_cash')
        if request.user == service_request.user:
            if service_request.status in non_cancellable:
                return Response(
                    {'error': 'Cannot cancel at this stage.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif request.user == service_request.mechanic:
            if service_request.status in non_cancellable:
                return Response(
                    {'error': 'Cannot cancel at this stage.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {'error': 'Not authorized.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        service_request.status = 'cancelled'
        service_request.cancelled_at = timezone.now()
        service_request.save()

        return Response({
            'message': 'Request cancelled.',
            'request': ServiceRequestSerializer(service_request).data,
        })


class ConfirmCashPaymentView(APIView):
    """POST /api/v1/requests/{id}/confirm-cash/ - Mechanic confirms cash received."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def post(self, request, pk):
        service_request = get_object_or_404(
            ServiceRequest, pk=pk, mechanic=request.user
        )

        if service_request.status != 'pending_cash':
            return Response(
                {'error': 'No pending cash collection for this request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update payment
        payment = getattr(service_request, 'payment', None)
        if payment:
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.save()

        # Update service request
        service_request.status = 'completed'
        service_request.completed_at = timezone.now()
        service_request.save()

        # Update mechanic stats
        profile = request.user.mechanic_profile
        profile.total_jobs_completed += 1
        profile.save(update_fields=['total_jobs_completed'])

        return Response({
            'message': 'Cash payment confirmed!',
            'request': ServiceRequestSerializer(service_request).data,
        })


class PendingRequestCountView(APIView):
    """GET /api/v1/requests/pending-count/ - Get count of pending requests."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def get(self, request):
        count = ServiceRequest.objects.filter(status='pending').count()
        return Response({'count': count})


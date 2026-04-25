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

        # Calculate initial pricing with a default distance estimate
        # (actual distance will be calculated when a mechanic accepts)
        issue = request_obj.reported_issue
        default_distance = Decimal('5.00')  # Default 5km estimate
        pricing = calculate_quote(default_distance, issue)

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

        # Recalculate pricing with actual distance
        pricing = calculate_quote(distance, service_request.reported_issue)

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
    """PATCH /api/v1/requests/{id}/diagnose/ - Mechanic overrides the issue."""
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

        new_issue = IssueCatalog.objects.get(
            pk=serializer.validated_data['actual_issue_id']
        )
        notes = serializer.validated_data.get('notes', '')

        pricing = recalculate_on_override(service_request, new_issue)
        service_request.override_notes = notes
        service_request.save(update_fields=['override_notes'])

        return Response({
            'message': 'Diagnosis updated. Waiting for user approval.',
            'request': ServiceRequestSerializer(service_request).data,
            'new_pricing': pricing,
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

        service_request.user_approved_override = True
        service_request.status = 'in_progress'
        service_request.save(
            update_fields=['user_approved_override', 'status', 'updated_at']
        )

        return Response({
            'message': 'Quote approved. Mechanic can proceed with repair.',
            'request': ServiceRequestSerializer(service_request).data,
        })


class CompleteRequestView(APIView):
    """POST /api/v1/requests/{id}/complete/ - Mark as completed."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def post(self, request, pk):
        service_request = get_object_or_404(
            ServiceRequest, pk=pk, mechanic=request.user
        )

        if service_request.status not in ('in_progress', 'arrived'):
            return Response(
                {'error': 'Cannot complete at this stage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If issue was overridden, check that user approved
        if (
            service_request.issue_was_overridden
            and not service_request.user_approved_override
        ):
            return Response(
                {'error': 'User has not approved the updated quote yet.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service_request.status = 'completed'
        service_request.completed_at = timezone.now()
        service_request.save()

        # Update mechanic stats
        profile = request.user.mechanic_profile
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
        if request.user == service_request.user:
            if service_request.status in ('in_progress', 'completed'):
                return Response(
                    {'error': 'Cannot cancel at this stage.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif request.user == service_request.mechanic:
            if service_request.status in ('in_progress', 'completed'):
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

from rest_framework import serializers
from .models import IssueCatalog, ServiceRequest
from apps.accounts.serializers import UserSerializer


class IssueCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCatalog
        fields = [
            'id', 'slug', 'name', 'fixed_cost',
            'description', 'icon', 'is_active', 'sort_order',
        ]


class ServiceRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new service request."""

    class Meta:
        model = ServiceRequest
        fields = [
            'vehicle_make', 'vehicle_model', 'vehicle_year',
            'reported_issue', 'user_latitude', 'user_longitude',
            'user_address',
        ]


class ServiceRequestSerializer(serializers.ModelSerializer):
    """Full read serializer for service requests."""
    user = UserSerializer(read_only=True)
    mechanic = UserSerializer(read_only=True)
    reported_issue_detail = IssueCatalogSerializer(source='reported_issue', read_only=True)
    actual_issue_detail = IssueCatalogSerializer(source='actual_issue', read_only=True)
    effective_issue_name = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'user', 'mechanic',
            'vehicle_make', 'vehicle_model', 'vehicle_year',
            'reported_issue', 'reported_issue_detail',
            'actual_issue', 'actual_issue_detail',
            'effective_issue_name',
            'issue_was_overridden', 'user_approved_override',
            'override_notes',
            'user_latitude', 'user_longitude', 'user_address',
            'distance_km', 'distance_cost', 'issue_cost', 'total_cost',
            'status', 'created_at', 'updated_at',
            'accepted_at', 'completed_at', 'cancelled_at',
            'estimated_arrival_minutes',
        ]

    def get_effective_issue_name(self, obj):
        issue = obj.effective_issue
        return issue.name if issue else None


class DiagnoseOverrideSerializer(serializers.Serializer):
    """Serializer for mechanic diagnostic override."""
    actual_issue_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, default='')

    def validate_actual_issue_id(self, value):
        try:
            IssueCatalog.objects.get(pk=value, is_active=True)
        except IssueCatalog.DoesNotExist:
            raise serializers.ValidationError("Invalid issue ID.")
        return value


class StatusUpdateSerializer(serializers.Serializer):
    """Serializer for mechanic status updates."""
    status = serializers.ChoiceField(
        choices=['en_route', 'arrived', 'in_progress']
    )

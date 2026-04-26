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
    """Serializer for creating a new service request with multiple issues."""

    reported_issue_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        help_text='List of IssueCatalog IDs the user selected.',
    )

    class Meta:
        model = ServiceRequest
        fields = [
            'vehicle_make', 'vehicle_model', 'vehicle_year',
            'reported_issue_ids', 'user_latitude', 'user_longitude',
            'user_address',
        ]

    def validate_reported_issue_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one issue must be selected.")
        issues = IssueCatalog.objects.filter(pk__in=value, is_active=True)
        if issues.count() != len(value):
            raise serializers.ValidationError("One or more issue IDs are invalid.")
        return value

    def create(self, validated_data):
        issue_ids = validated_data.pop('reported_issue_ids')
        # Set the first issue as the legacy FK for backward compat
        first_issue = IssueCatalog.objects.get(pk=issue_ids[0])
        validated_data['reported_issue'] = first_issue
        instance = super().create(validated_data)
        # Set the M2M relationship
        instance.reported_issues.set(issue_ids)
        return instance


class ServiceRequestSerializer(serializers.ModelSerializer):
    """Full read serializer for service requests."""
    user = UserSerializer(read_only=True)
    mechanic = UserSerializer(read_only=True)
    reported_issue_detail = IssueCatalogSerializer(source='reported_issue', read_only=True)
    actual_issue_detail = IssueCatalogSerializer(source='actual_issue', read_only=True)
    reported_issues_detail = IssueCatalogSerializer(source='reported_issues', many=True, read_only=True)
    actual_issues_detail = IssueCatalogSerializer(source='actual_issues', many=True, read_only=True)
    effective_issue_name = serializers.SerializerMethodField()
    payment_status = serializers.CharField(source='payment.status', read_only=True, default='created')
    payment_method = serializers.CharField(source='payment.payment_method', read_only=True, default='ONLINE')

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'user', 'mechanic',
            'vehicle_make', 'vehicle_model', 'vehicle_year',
            'reported_issue', 'reported_issue_detail',
            'actual_issue', 'actual_issue_detail',
            'reported_issues_detail', 'actual_issues_detail',
            'effective_issue_name',
            'issue_was_overridden', 'user_approved_override',
            'override_notes',
            'user_latitude', 'user_longitude', 'user_address',
            'distance_km', 'distance_cost', 'issue_cost', 'total_cost',
            'status', 'created_at', 'updated_at',
            'accepted_at', 'completed_at', 'cancelled_at',
            'estimated_arrival_minutes',
            'payment_status', 'payment_method',
        ]

    def get_effective_issue_name(self, obj):
        issues = obj.effective_issues
        if issues.exists():
            return ', '.join(i.name for i in issues)
        # Fallback to legacy FK
        issue = obj.effective_issue
        return issue.name if issue else None


class DiagnoseOverrideSerializer(serializers.Serializer):
    """Serializer for mechanic diagnostic override (multi-issue)."""
    actual_issue_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='List of actual IssueCatalog IDs found after inspection.',
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_actual_issue_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one issue must be selected.")
        issues = IssueCatalog.objects.filter(pk__in=value, is_active=True)
        if issues.count() != len(value):
            raise serializers.ValidationError("One or more issue IDs are invalid.")
        return value


class StatusUpdateSerializer(serializers.Serializer):
    """Serializer for mechanic status updates."""
    status = serializers.ChoiceField(
        choices=['en_route', 'arrived', 'in_progress', 'pending_payment']
    )

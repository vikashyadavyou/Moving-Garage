from django.db import models
from django.conf import settings


class IssueCatalog(models.Model):
    """Pre-defined issue types with fixed pricing."""

    slug = models.SlugField(unique=True, max_length=50)
    name = models.CharField(max_length=100)
    fixed_cost = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, default='🔧')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'issue_catalog'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.name} (₹{self.fixed_cost})"


class ServiceRequest(models.Model):
    """Core model for breakdown assistance requests."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('en_route', 'En Route'),
        ('arrived', 'Arrived'),
        ('diagnosed', 'Diagnosed'),
        ('quote_pending', 'Quote Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('pending_cash', 'Pending Cash Collection'),
    ]

    # Participants
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='service_requests',
    )
    mechanic = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mechanic_jobs',
    )

    # Vehicle info
    vehicle_make = models.CharField(max_length=100)
    vehicle_model = models.CharField(max_length=100)
    vehicle_year = models.PositiveIntegerField(null=True, blank=True)

    # Issue tracking — Legacy single FK (kept for backward compat, nullable)
    reported_issue = models.ForeignKey(
        IssueCatalog,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='reported_requests',
    )
    actual_issue = models.ForeignKey(
        IssueCatalog,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='actual_requests',
    )

    # Issue tracking — New M2M fields for multiple issue selection
    reported_issues = models.ManyToManyField(
        IssueCatalog,
        related_name='reported_requests_multi',
        blank=True,
    )
    actual_issues = models.ManyToManyField(
        IssueCatalog,
        related_name='actual_requests_multi',
        blank=True,
    )

    issue_was_overridden = models.BooleanField(default=False)
    user_approved_override = models.BooleanField(default=False)
    override_notes = models.TextField(blank=True, default='')

    # User location
    user_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    user_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    user_address = models.CharField(max_length=500, blank=True, default='')

    # Pricing
    distance_km = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    distance_cost = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    issue_cost = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    total_cost = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )

    # Status & timestamps
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # ETA
    estimated_arrival_minutes = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'service_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"SR-{self.pk} | {self.user.username} | {self.get_status_display()}"

    @property
    def effective_issues(self):
        """Returns the actual issues if overridden, else the reported issues."""
        if self.issue_was_overridden and self.actual_issues.exists():
            return self.actual_issues.all()
        return self.reported_issues.all()

    @property
    def effective_issue(self):
        """Legacy single-issue accessor for backward compat."""
        if self.issue_was_overridden and self.actual_issue:
            return self.actual_issue
        return self.reported_issue

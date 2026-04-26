"""
Pricing engine for Moving Garage.
Business Rules:
- Total Bill = (Distance in KM × ₹15) + Sum of Fixed Issue Costs
- Distance Rate: ₹15 per KM
- If user selected 'Unknown Issue' (₹25 diagnostic fee) and mechanic
  identifies the real issue(s), the diagnostic fee is REMOVED and
  replaced by the actual repair cost(s).
"""
from decimal import Decimal

DISTANCE_RATE_PER_KM = Decimal('15.00')


def calculate_quote(distance_km, issues):
    """
    Calculate the cost breakdown for a service request.

    Args:
        distance_km: Distance in kilometers (Decimal or float)
        issues: QuerySet or list of IssueCatalog instances

    Returns:
        dict with distance_km, distance_cost, issue_cost, total_cost
    """
    distance_km = Decimal(str(distance_km))
    distance_cost = (distance_km * DISTANCE_RATE_PER_KM).quantize(Decimal('0.01'))
    issue_cost = sum(issue.fixed_cost for issue in issues)
    total_cost = distance_cost + issue_cost

    return {
        'distance_km': distance_km,
        'distance_cost': distance_cost,
        'issue_cost': issue_cost,
        'total_cost': total_cost,
    }


def calculate_quote_single(distance_km, issue):
    """Legacy single-issue wrapper for backward compat."""
    return calculate_quote(distance_km, [issue])


def recalculate_on_override(service_request, new_issues, notes=''):
    """
    Recalculate pricing when mechanic overrides the issue(s).

    The diagnostic fee (₹25 for 'Unknown Issue') is replaced by the
    actual repair cost(s) — not added to them.

    Args:
        service_request: ServiceRequest instance
        new_issues: list of IssueCatalog instances (the actual issues)
        notes: Optional mechanic notes

    Returns:
        Updated pricing dict
    """
    pricing = calculate_quote(service_request.distance_km, new_issues)

    service_request.actual_issues.set(new_issues)
    # Set legacy FK for backward compat
    if new_issues:
        service_request.actual_issue = new_issues[0] if isinstance(new_issues, list) else new_issues.first()
    service_request.issue_was_overridden = True
    service_request.user_approved_override = False
    service_request.issue_cost = pricing['issue_cost']
    service_request.total_cost = pricing['total_cost']
    service_request.distance_cost = pricing['distance_cost']
    service_request.status = 'quote_pending'
    service_request.override_notes = notes
    service_request.save()

    return pricing

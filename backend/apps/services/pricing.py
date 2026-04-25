"""
Pricing engine for Moving Garage.
Business Rules:
- Total Bill = (Distance in KM × ₹15) + Fixed Issue Cost
- Distance Rate: ₹15 per KM
- If user selected 'Unknown Issue' (₹100 diagnostic fee) and mechanic
  identifies the real issue, the diagnostic fee is REPLACED by the repair cost.
"""
from decimal import Decimal

DISTANCE_RATE_PER_KM = Decimal('15.00')


def calculate_quote(distance_km, issue):
    """
    Calculate the cost breakdown for a service request.

    Args:
        distance_km: Distance in kilometers (Decimal)
        issue: IssueCatalog instance

    Returns:
        dict with distance_km, distance_cost, issue_cost, total_cost
    """
    distance_km = Decimal(str(distance_km))
    distance_cost = (distance_km * DISTANCE_RATE_PER_KM).quantize(Decimal('0.01'))
    issue_cost = issue.fixed_cost
    total_cost = distance_cost + issue_cost

    return {
        'distance_km': distance_km,
        'distance_cost': distance_cost,
        'issue_cost': issue_cost,
        'total_cost': total_cost,
    }


def recalculate_on_override(service_request, new_issue):
    """
    Recalculate pricing when mechanic overrides the issue.

    The diagnostic fee (₹100 for 'Unknown Issue') is replaced by the
    actual repair cost — not added to it.

    Args:
        service_request: ServiceRequest instance
        new_issue: IssueCatalog instance (the actual issue)

    Returns:
        Updated pricing dict
    """
    pricing = calculate_quote(service_request.distance_km, new_issue)

    service_request.actual_issue = new_issue
    service_request.issue_was_overridden = True
    service_request.user_approved_override = False
    service_request.issue_cost = pricing['issue_cost']
    service_request.total_cost = pricing['total_cost']
    service_request.distance_cost = pricing['distance_cost']
    service_request.status = 'quote_pending'
    service_request.save()

    return pricing

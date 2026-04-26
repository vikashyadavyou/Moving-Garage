"""
Django signals for broadcasting service request events via WebSocket.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import ServiceRequest
from .serializers import ServiceRequestSerializer


@receiver(post_save, sender=ServiceRequest)
def broadcast_request_update(sender, instance, created, **kwargs):
    """Broadcast service request events to relevant WebSocket groups."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    serialized = ServiceRequestSerializer(instance).data

    if created:
        # Task 5: Only broadcast to online mechanics
        # The broadcast goes to the 'available_requests' group which only
        # online mechanics should be subscribed to. We also broadcast the
        # count of pending requests for badge updates.
        async_to_sync(channel_layer.group_send)(
            'available_requests',
            {
                'type': 'new_request',
                'request': serialized,
            }
        )
        # Also send a badge count update
        pending_count = ServiceRequest.objects.filter(status='pending').count()
        async_to_sync(channel_layer.group_send)(
            'available_requests',
            {
                'type': 'pending_count_update',
                'count': pending_count,
            }
        )
    else:
        request_group = f'request_{instance.pk}'

        if instance.status == 'quote_pending':
            # Mechanic overrode diagnosis → notify user
            actual_names = []
            if instance.actual_issues.exists():
                actual_names = list(instance.actual_issues.values_list('name', flat=True))
            elif instance.actual_issue:
                actual_names = [instance.actual_issue.name]

            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'quote_update',
                    'request_id': instance.pk,
                    'new_issue': ', '.join(actual_names),
                    'new_pricing': {
                        'distance_cost': str(instance.distance_cost),
                        'issue_cost': str(instance.issue_cost),
                        'total_cost': str(instance.total_cost),
                    },
                    'request': serialized,
                }
            )
        elif instance.status == 'pending_payment':
            # Mechanic requested payment → notify user to pay
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'payment_requested',
                    'request_id': instance.pk,
                    'request': serialized,
                }
            )
        elif instance.status == 'pending_cash':
            # User opted for cash → notify mechanic
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'cash_payment_pending',
                    'request_id': instance.pk,
                    'request': serialized,
                }
            )
        elif instance.status == 'completed':
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'request_completed',
                    'request_id': instance.pk,
                    'request': serialized,
                }
            )
            # Update pending count for mechanics since one request is now done
            pending_count = ServiceRequest.objects.filter(status='pending').count()
            async_to_sync(channel_layer.group_send)(
                'available_requests',
                {
                    'type': 'pending_count_update',
                    'count': pending_count,
                }
            )
        elif instance.status == 'accepted':
            # Request accepted → update badge count for other mechanics
            pending_count = ServiceRequest.objects.filter(status='pending').count()
            async_to_sync(channel_layer.group_send)(
                'available_requests',
                {
                    'type': 'pending_count_update',
                    'count': pending_count,
                }
            )
            # Also send status update to request group
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'status_update',
                    'request_id': instance.pk,
                    'status': instance.status,
                    'request': serialized,
                }
            )
        elif instance.status == 'cancelled':
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'request_cancelled',
                    'request_id': instance.pk,
                }
            )
            # Update badge count
            pending_count = ServiceRequest.objects.filter(status='pending').count()
            async_to_sync(channel_layer.group_send)(
                'available_requests',
                {
                    'type': 'pending_count_update',
                    'count': pending_count,
                }
            )
        else:
            # General status update
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'status_update',
                    'request_id': instance.pk,
                    'status': instance.status,
                    'request': serialized,
                }
            )

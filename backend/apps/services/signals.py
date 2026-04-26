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
        # New request → broadcast to all available mechanics
        async_to_sync(channel_layer.group_send)(
            'available_requests',
            {
                'type': 'new_request',
                'request': serialized,
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
        elif instance.status == 'completed':
            async_to_sync(channel_layer.group_send)(
                request_group,
                {
                    'type': 'request_completed',
                    'request_id': instance.pk,
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

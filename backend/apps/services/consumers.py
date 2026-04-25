import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ServiceRequestConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time service request updates.
    Handles:
    - Broadcasting new requests to available mechanics
    - Status updates for active requests
    - Quote update notifications
    - Mechanic location tracking
    """

    async def connect(self):
        self.request_id = self.scope['url_route']['kwargs'].get('request_id', None)

        if self.request_id:
            # Specific request channel
            self.room_group_name = f'request_{self.request_id}'
        else:
            # General broadcast channel for available requests
            self.room_group_name = 'available_requests'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            msg_type = data.get('type', '')

            if msg_type == 'location_update':
                # Mechanic sending location update
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'mechanic_location',
                        'latitude': data.get('latitude'),
                        'longitude': data.get('longitude'),
                        'eta_minutes': data.get('eta_minutes'),
                    }
                )
        except json.JSONDecodeError:
            pass

    # Event handlers for group messages

    async def new_request(self, event):
        """Broadcast a new service request to available mechanics."""
        await self.send(text_data=json.dumps({
            'type': 'new_request',
            'request': event['request'],
        }))

    async def status_update(self, event):
        """Send status update for a specific request."""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'request_id': event['request_id'],
            'status': event['status'],
            'request': event.get('request'),
        }))

    async def quote_update(self, event):
        """Send updated quote when mechanic overrides diagnosis."""
        await self.send(text_data=json.dumps({
            'type': 'quote_update',
            'request_id': event['request_id'],
            'new_issue': event['new_issue'],
            'new_pricing': event['new_pricing'],
            'request': event.get('request'),
        }))

    async def quote_approved(self, event):
        """Notify mechanic that user approved the quote."""
        await self.send(text_data=json.dumps({
            'type': 'quote_approved',
            'request_id': event['request_id'],
        }))

    async def request_completed(self, event):
        """Notify both parties that the request is completed."""
        await self.send(text_data=json.dumps({
            'type': 'request_completed',
            'request_id': event['request_id'],
            'request': event.get('request'),
        }))

    async def mechanic_location(self, event):
        """Broadcast mechanic's live location to user."""
        await self.send(text_data=json.dumps({
            'type': 'mechanic_location',
            'latitude': event['latitude'],
            'longitude': event['longitude'],
            'eta_minutes': event.get('eta_minutes'),
        }))

    async def request_cancelled(self, event):
        """Notify that the request has been cancelled."""
        await self.send(text_data=json.dumps({
            'type': 'request_cancelled',
            'request_id': event['request_id'],
        }))

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/requests/$', consumers.ServiceRequestConsumer.as_asgi()),
    re_path(r'ws/request/(?P<request_id>\d+)/$', consumers.ServiceRequestConsumer.as_asgi()),
]

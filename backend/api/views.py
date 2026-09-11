from rest_framework import viewsets
from social_media.models import (
    Channel, Event, Message, Source, ChannelConnection,
)
from .serializers import (
    ChannelSerializer, EventSerializer, MessageSerializer,
    SourceSerializer, ChannelConnectionSerializer,
)
from .filters import build_filterset


class ChannelViewSet(viewsets.ModelViewSet):
    queryset = Channel.objects.order_by('id')
    serializer_class = ChannelSerializer
    lookup_value_regex = '[^/]+'
    filterset_class = build_filterset(Channel)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.order_by('id')
    serializer_class = EventSerializer
    lookup_value_regex = '[^/]+'
    filterset_class = build_filterset(Event)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.order_by('id')
    serializer_class = MessageSerializer
    lookup_value_regex = '[^/]+'
    filterset_class = build_filterset(Message)


class SourceViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.order_by('id')
    serializer_class = SourceSerializer
    lookup_value_regex = '[^/]+'
    filterset_class = build_filterset(Source)


class ChannelConnectionViewSet(viewsets.ModelViewSet):
    queryset = ChannelConnection.objects.order_by('id')
    serializer_class = ChannelConnectionSerializer
    lookup_value_regex = '[^/]+'
    filterset_class = build_filterset(ChannelConnection)

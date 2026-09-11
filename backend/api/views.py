from rest_framework import viewsets
from social_media.models import (
    Channel, Event, Message, Source, ChannelConnection,
)
from .serializers import (
    ChannelSerializer, EventSerializer, MessageSerializer,
    SourceSerializer, ChannelConnectionSerializer,
)


class ChannelViewSet(viewsets.ModelViewSet):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer


class SourceViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    serializer_class = SourceSerializer


class ChannelConnectionViewSet(viewsets.ModelViewSet):
    queryset = ChannelConnection.objects.all()
    serializer_class = ChannelConnectionSerializer

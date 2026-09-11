from rest_framework import serializers
from social_media.models import (
    Channel, Event, Message, Source, ChannelConnection,
)


class ChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = ['id', 'joy', 'sadness']


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'duration', 'joy', 'sadness']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'channel', 'event', 'genre', 'views']


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ['id', 'message', 'source_name']


class ChannelConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelConnection
        fields = [
            'id', 'channel_1', 'channel_2',
            'weight_views', 'weight_messages', 'weight_forwards',
        ]

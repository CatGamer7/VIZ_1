from django.db import models


class Channel(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    joy = models.FloatField(null=True, blank=True)
    sadness = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'channels'

    def __str__(self):
        return self.id


class Event(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    duration = models.FloatField()
    joy = models.FloatField(null=True, blank=True)
    sadness = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'events'

    def __str__(self):
        return self.id


class Message(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    channel = models.ForeignKey(Channel, on_delete=models.PROTECT, db_column='channel_id')
    event = models.ForeignKey(Event, on_delete=models.PROTECT, db_column='event_id')
    genre = models.CharField(max_length=50)
    views = models.IntegerField()

    class Meta:
        db_table = 'messages'

    def __str__(self):
        return self.id


class Source(models.Model):
    message = models.ForeignKey(Message, on_delete=models.PROTECT, db_column='message_id')
    source_name = models.CharField(max_length=200)

    class Meta:
        db_table = 'sources'

    def __str__(self):
        return f"{self.message.id} -> {self.source_name}"


class ChannelConnection(models.Model):
    channel_1 = models.ForeignKey(
        Channel, on_delete=models.PROTECT, related_name='connections_from', db_column='id_1'
    )
    channel_2 = models.ForeignKey(
        Channel, on_delete=models.PROTECT, related_name='connections_to', db_column='id_2'
    )
    weight_views = models.FloatField()
    weight_messages = models.FloatField()
    weight_forwards = models.FloatField()

    class Meta:
        db_table = 'channel_connections'
        unique_together = ('channel_1', 'channel_2')

    def __str__(self):
        return f"{self.channel_1.id} <-> {self.channel_2.id}"
    
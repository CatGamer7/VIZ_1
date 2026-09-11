import csv
import io
from django.core.management.base import BaseCommand
from social_media.models import Channel, Event, Message, Source, ChannelConnection

BATCH_SIZE = 100_000
DB_BATCH_SIZE = 1_000


def read_csv_rows(path):
    raw = open(path, 'rb').read()
    for enc in ('utf-8-sig', 'cp1251'):
        try:
            return list(csv.DictReader(io.StringIO(raw.decode(enc))))
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"Could not decode {path}")


def to_float(v):
    return float(v) if v not in (None, '') else None


def to_int(v):
    return int(v) if v not in (None, '') else None


def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


class Command(BaseCommand):
    help = 'Import data from CSV files, silently dropping FK-violating rows'

    def handle(self, *args, **options):
        csv_files = {
            'channels': 'data/channels.csv',
            'events': 'data/events.csv',
            'messages': 'data/messages.csv',
            'sources': 'data/sources.csv',
            'connections': 'data/channel_connections.csv',
        }

        #  Channels
        channels_raw = read_csv_rows(csv_files['channels'])
        valid_channel_ids = set()
        for batch in chunks(channels_raw, BATCH_SIZE):
            objs = [
                Channel(id=r['id'], joy=to_float(r['joy']), sadness=to_float(r['sadness']))
                for r in batch
            ]
            Channel.objects.bulk_create(
                objs, ignore_conflicts=True, batch_size=DB_BATCH_SIZE,
            )
            valid_channel_ids.update(r['id'] for r in batch)
        self.stdout.write(f"Imported {len(valid_channel_ids)} channels")

        # Events
        events_raw = read_csv_rows(csv_files['events'])
        valid_event_ids = set()
        for batch in chunks(events_raw, BATCH_SIZE):
            objs = [
                Event(
                    id=r['id'],
                    duration=to_float(r['duration']),
                    joy=to_float(r['joy']),
                    sadness=to_float(r['sadness']),
                )
                for r in batch
            ]
            Event.objects.bulk_create(
                objs, ignore_conflicts=True, batch_size=DB_BATCH_SIZE,
            )
            valid_event_ids.update(r['id'] for r in batch)
        self.stdout.write(f"Imported {len(valid_event_ids)} events")

        # Messages
        messages_raw = read_csv_rows(csv_files['messages'])
        valid_message_ids = set()
        skipped_msg = 0
        imported_msg = 0
        for batch in chunks(messages_raw, BATCH_SIZE):
            objs = []
            for r in batch:
                if r['channel_id'] not in valid_channel_ids or r['event_id'] not in valid_event_ids:
                    skipped_msg += 1
                    continue
                objs.append(Message(
                    id=r['id'],
                    channel_id=r['channel_id'],
                    event_id=r['event_id'],
                    genre=r['genre'],
                    views=to_int(r['views']),
                ))
                valid_message_ids.add(r['id'])
            Message.objects.bulk_create(
                objs, ignore_conflicts=True, batch_size=DB_BATCH_SIZE,
            )
            imported_msg += len(objs)
        self.stdout.write(
            f"Imported {imported_msg} messages (skipped {skipped_msg} with missing FK)"
        )

        # Sources
        sources_raw = read_csv_rows(csv_files['sources'])
        skipped_src = 0
        imported_src = 0
        for batch in chunks(sources_raw, BATCH_SIZE):
            objs = []
            for r in batch:
                if r['message_id'] not in valid_message_ids:
                    skipped_src += 1
                    continue
                objs.append(Source(
                    message_id=r['message_id'],
                    source_name=r['source_name'],
                ))
            Source.objects.bulk_create(
                objs, ignore_conflicts=True, batch_size=DB_BATCH_SIZE,
            )
            imported_src += len(objs)
        self.stdout.write(
            f"Imported {imported_src} sources (skipped {skipped_src} with missing FK)"
        )

        # Channel Connections 
        conns_raw = read_csv_rows(csv_files['connections'])
        skipped_conn = 0
        imported_conn = 0
        for batch in chunks(conns_raw, BATCH_SIZE):
            objs = []
            for r in batch:
                if r['channel_id_1'] not in valid_channel_ids or r['channel_id_2'] not in valid_channel_ids:
                    skipped_conn += 1
                    continue
                objs.append(ChannelConnection(
                    channel_1_id=r['channel_id_1'],
                    channel_2_id=r['channel_id_2'],
                    weight_views=to_float(r['weight_views']),
                    weight_messages=to_float(r['weight_messages']),
                    weight_forwards=to_float(r['weight_forwards']),
                ))
            ChannelConnection.objects.bulk_create(
                objs, ignore_conflicts=True, batch_size=DB_BATCH_SIZE,
            )
            imported_conn += len(objs)
        self.stdout.write(
            f"Imported {imported_conn} channel connections (skipped {skipped_conn} with missing FK)"
        )

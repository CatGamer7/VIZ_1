#!/bin/sh
set -e

python manage.py migrate --noinput

exec gunicorn drf_back.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --access-logfile - \
    --error-logfile -

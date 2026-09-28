import numpy as np
import pandas as pd
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response

from social_media.models import (
    Channel, Event, Message, Source, ChannelConnection,
)
from . import stats


MODEL_MAP = {
    'channels': Channel,
    'events': Event,
    'messages': Message,
    'sources': Source,
    'channel-connections': ChannelConnection,
}


def _model_for(table_name: str):
    
    model = MODEL_MAP.get(table_name)
    if model is None:
        raise ValueError(f"Unknown table: {table_name!r}")
    return model


def _numeric_columns(model) -> list[str]:
    
    return [
        f.name for f in model._meta.get_fields()
        if isinstance(f, (models.FloatField, models.IntegerField))
        and not isinstance(f, models.AutoField)
    ]


class HistogramView(APIView):

    def get(self, request):
        table = request.query_params.get('table')
        column = request.query_params.get('column')
        bins = int(request.query_params.get('bins', 30))

        if not table or not column:
            return Response({'detail': 'table and column are required'}, status=400)
        
        try:
            model = _model_for(table)

        except ValueError as e:
            return Response({'detail': str(e)}, status=400)

        if column not in _numeric_columns(model):
            return Response(
                {'detail': f'{column!r} is not a numeric column of {table!r}'},
                status=400,
            )

        qs = model.objects.filter(
            **{f'{column}__isnull': False}
        ).values_list(column, flat=True)

        values = list(qs)

        if not values:
            return Response({'detail': 'No non-null values in column'}, status=400)

        arr = np.asarray(values, dtype=float)
        result = stats.compute_histogram(arr, bins=bins)

        return Response({
            'table': table,
            'column': column,
            'rows_analyzed': len(values),
            'x_label': column,
            'y_label': 'Count',
            'title': f'Histogram - {table}.{column}',
            **result,
        })


class QQView(APIView):

    def get(self, request):
        table = request.query_params.get('table')
        column = request.query_params.get('column')

        if not table or not column:
            return Response({'detail': 'table and column are required'}, status=400)
        try:
            model = _model_for(table)
        except ValueError as e:
            return Response({'detail': str(e)}, status=400)

        if column not in _numeric_columns(model):
            return Response(
                {'detail': f'{column!r} is not a numeric column of {table!r}'},
                status=400,
            )

        qs = model.objects.filter(
            **{f'{column}__isnull': False}
        ).values_list(column, flat=True)

        values = list(qs)

        if not values:
            return Response({'detail': 'No non-null values in column'}, status=400)

        arr = np.asarray(values, dtype=float)
        result = stats.compute_qq(arr)

        return Response({
            'table': table,
            'column': column,
            'rows_analyzed': len(values),
            'x_label': 'Theoretical quantiles',
            'y_label': 'Sample quantiles',
            'title': f'Q-Q plot - {table}.{column}',
            **result,
        })


class CorrelationView(APIView):

    def get(self, request):
        table = request.query_params.get('table')
        method = request.query_params.get('method', 'pearson')

        if not table:
            return Response({'detail': 'table is required'}, status=400)
        
        if method not in ('pearson', 'spearman', 'kendall'):
            return Response(
                {'detail': 'method must be one of: pearson, spearman, kendall'},
                status=400,
            )
        
        try:
            model = _model_for(table)

        except ValueError as e:
            return Response({'detail': str(e)}, status=400)

        columns = _numeric_columns(model)

        if len(columns) < 2:
            return Response(
                {'detail': f'{table!r} has fewer than 2 numeric columns'},
                status=400,
            )

        filters = {f'{c}__isnull': False for c in columns}
        qs = model.objects.filter(**filters).values_list(*columns)
        rows = list(qs)

        if not rows:
            return Response({'detail': 'No complete rows available'}, status=400)

        df = pd.DataFrame(rows, columns=columns)
        result = stats.compute_correlation(df, method)

        return Response({
            'table': table,
            'method': method,
            'rows_analyzed': len(rows),
            'title': f'{method.capitalize()} correlation - {table}',
            **result,
        })

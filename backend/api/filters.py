import django_filters
from django.db import models


def build_filterset(model):

    declared = {}
    fields_map = {}

    for field in model._meta.get_fields():
        if not isinstance(field, models.Field):
            continue

        if isinstance(field, (models.FloatField, models.IntegerField)):
            fields_map[field.name] = ["exact", "gt", "gte", "lt", "lte"]
            declared[f"{field.name}__ne"] = django_filters.NumberFilter(
                field_name=field.name, exclude=True, label=f"{field.name} !=",
            )

        elif isinstance(field, models.ForeignKey):
            fields_map[field.name] = ["exact"]

        elif isinstance(field, models.CharField):
            fields_map[field.name] = ["icontains"]

    meta = type("Meta", (), {"model": model, "fields": fields_map})
    declared["Meta"] = meta
    return type(f"{model.__name__}FilterSet",
                (django_filters.FilterSet,), declared)

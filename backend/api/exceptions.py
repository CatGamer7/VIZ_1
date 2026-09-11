from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def protected_error_handler(exc, context):
    if isinstance(exc, ProtectedError):
        n = len(exc.protected_objects)
        return Response(
            {
                "detail": f"Cannot delete: {n} dependent record(s) reference this row. "
                f"Delete the dependents first."
            },
            status=status.HTTP_409_CONFLICT,
        )
    return exception_handler(exc, context)

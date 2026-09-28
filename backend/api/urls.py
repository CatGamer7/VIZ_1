from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ChannelViewSet, EventViewSet, MessageViewSet,
    SourceViewSet, ChannelConnectionViewSet,
)
from .stats_views import HistogramView, QQView, CorrelationView


router = DefaultRouter()
router.register(r'channels', ChannelViewSet)
router.register(r'events', EventViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'sources', SourceViewSet)
router.register(r'channel-connections', ChannelConnectionViewSet)

urlpatterns = router.urls + [
    path('stats/histogram/', HistogramView.as_view()),
    path('stats/qq/', QQView.as_view()),
    path('stats/correlation/', CorrelationView.as_view()),
]

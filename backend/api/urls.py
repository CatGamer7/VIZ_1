from rest_framework.routers import DefaultRouter
from .views import (
    ChannelViewSet, EventViewSet, MessageViewSet,
    SourceViewSet, ChannelConnectionViewSet,
)

router = DefaultRouter()
router.register(r'channels', ChannelViewSet)
router.register(r'events', EventViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'sources', SourceViewSet)
router.register(r'channel-connections', ChannelConnectionViewSet)

urlpatterns = router.urls

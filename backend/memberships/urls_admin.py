from rest_framework.routers import DefaultRouter
from .views_admin import MembershipViewSet

router = DefaultRouter()
router.register("memberships", MembershipViewSet, basename="memberships")

urlpatterns = router.urls

# backend/gym_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from machines.views import MachineViewSet
from reservations.views import ReservationViewSet
from core.views import LoginView, MeView

router = DefaultRouter()
router.register("machines", MachineViewSet, basename="machines")
router.register("reservations", ReservationViewSet, basename="reservations")

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/me/", MeView.as_view()),

    # API Routers
    path("api/", include(router.urls)),
]

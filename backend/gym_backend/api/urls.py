from django.urls import path, include

urlpatterns = [
    path("auth/", include("core.urls")),
    path("admin/", include("memberships.urls_admin")),
    path("machines/", include("machines.urls")),
    path("reservations/", include("reservations.urls")),
]

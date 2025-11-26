# backend/gym_backend/urls.py
from django.contrib import admin
from django.urls import path, include

from core.views import (
    LoginView, 
    MeView, 
    CreateUserView,
    UpdateUserView,  # ✅ AÑADIDO
    DeleteUserView   # ✅ AÑADIDO
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # AUTH
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/me/", MeView.as_view()),

    # ADMIN
    path("api/admin/create_user/", CreateUserView.as_view()),
    path("api/admin/update_user/<int:user_id>/", UpdateUserView.as_view()),  # ✅ AÑADIDO
    path("api/admin/delete_user/<int:user_id>/", DeleteUserView.as_view()),  # ✅ AÑADIDO

    # MÁQUINAS
    path("api/machines/", include("machines.urls")),

    # RESERVAS
    path("api/reservations/", include("reservations.urls")),

    # MEMBERSHIPS
    path("api/memberships/", include("memberships.urls")),
]
from django.urls import path
from .views import (
    MyReservationsView,
    CreateReservationView,
    ReservationHistoryView,
)

urlpatterns = [
    path("my/", MyReservationsView.as_view()),                   # GET → reservas del usuario
    path("create/", CreateReservationView.as_view()),            # POST → crear reserva
    path("history/", ReservationHistoryView.as_view()),          # GET → historial admin
]

from django.urls import path
from machines.views import MachineListView

urlpatterns = [
    path("", MachineListView.as_view()),
]

from django.urls import path
from .views import (
    AssignDaysView, 
    MyDaysView, 
    AllUsersWithDaysView,
    MembershipListCreateView,
    MembershipDeleteView
)

urlpatterns = [
    path("assign_days/", AssignDaysView.as_view()),
    path("my_days/", MyDaysView.as_view()),
    path("users_with_days/", AllUsersWithDaysView.as_view()),
    path("plans/", MembershipListCreateView.as_view()),
    path("plans/<int:pk>/", MembershipDeleteView.as_view()),
]
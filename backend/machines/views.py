from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Machine
from .serializers import MachineSerializer

class MachineListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        machines = Machine.objects.all()
        return Response(MachineSerializer(machines, many=True).data)

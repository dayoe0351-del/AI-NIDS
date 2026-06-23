from rest_framework import viewsets
from .models import Incident
from rest_framework import serializers

class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = '__all__'

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-timestamp')
    serializer_class = IncidentSerializer

from rest_framework import serializers, viewsets
from .models import SystemConfiguration


class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = '__all__'


class SystemConfigurationViewSet(viewsets.ModelViewSet):
    queryset = SystemConfiguration.objects.all().order_by('category', 'key')
    serializer_class = SystemConfigurationSerializer

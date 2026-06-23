from django.utils import timezone
from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AutomatedResponse, AppealRequest


class AutomatedResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomatedResponse
        fields = '__all__'


class AppealRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealRequest
        fields = '__all__'


class AutomatedResponseViewSet(viewsets.ModelViewSet):
    queryset = AutomatedResponse.objects.all().order_by('-executed_at')
    serializer_class = AutomatedResponseSerializer

    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        """Rollback/revoke an active response action."""
        resp = self.get_object()
        resp.status = 'ROLLED_BACK'
        resp.save()
        return Response({'detail': f'Response #{resp.id} rolled back successfully.'})

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """Escalate a response to the next severity level."""
        ESCALATION = {
            'MONITOR': 'CHALLENGE',
            'CHALLENGE': 'THROTTLE',
            'THROTTLE': 'REDIRECT',
            'REDIRECT': 'BLOCK',
            'BLOCK': 'ISOLATE',
            'ISOLATE': 'ISOLATE',
        }
        resp = self.get_object()
        new_action = ESCALATION.get(resp.action, resp.action)
        resp.action = new_action
        resp.status = 'ACTIVE'
        resp.explanation += f'\n[ESCALATED to {new_action} at {timezone.now().isoformat()}]'
        resp.save()
        return Response(AutomatedResponseSerializer(resp).data)


class AppealRequestViewSet(viewsets.ModelViewSet):
    queryset = AppealRequest.objects.all().order_by('-created_at')
    serializer_class = AppealRequestSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        appeal = self.get_object()
        appeal.status = 'APPROVED'
        appeal.reviewed_by = request.data.get('reviewed_by', 'system')
        appeal.review_notes = request.data.get('review_notes', '')
        appeal.resolved_at = timezone.now()
        appeal.save()
        # Also rollback the linked response
        appeal.response.status = 'ROLLED_BACK'
        appeal.response.save()
        return Response({'detail': 'Appeal approved and response rolled back.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        appeal = self.get_object()
        appeal.status = 'REJECTED'
        appeal.reviewed_by = request.data.get('reviewed_by', 'system')
        appeal.review_notes = request.data.get('review_notes', '')
        appeal.resolved_at = timezone.now()
        appeal.save()
        return Response({'detail': 'Appeal rejected.'})

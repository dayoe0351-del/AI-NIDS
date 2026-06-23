from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import FlowRecord
from rest_framework import serializers
from detection.models import Incident
from detection.ml_engine import evaluate_flow
from response.models import AutomatedResponse

class FlowRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlowRecord
        fields = '__all__'

class FlowRecordViewSet(viewsets.ModelViewSet):
    queryset = FlowRecord.objects.all().order_by('-timestamp')
    serializer_class = FlowRecordSerializer

    def create(self, request, *args, **kwargs):
        # Save the flow normally
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        flow_data = request.data

        # ML Inference — real-time threat detection
        try:
            attack_type, confidence, severity = evaluate_flow(flow_data)

            # Auto-generate incident if ML detects anomaly
            if attack_type != "Normal":
                inc = Incident.objects.create(
                    source_ip=flow_data.get('src_ip', '0.0.0.0'),
                    destination_ip=flow_data.get('dst_ip', '0.0.0.0'),
                    severity=severity,
                    confidence_score=confidence,
                    attack_type=attack_type,
                    description=f"ML Engine detected {attack_type} pattern with {confidence*100:.1f}% confidence. "
                                f"Flow: {flow_data.get('src_ip')}:{flow_data.get('src_port')} -> "
                                f"{flow_data.get('dst_ip')}:{flow_data.get('dst_port')} "
                                f"({flow_data.get('protocol')}, {flow_data.get('byte_count')} bytes, "
                                f"{flow_data.get('packet_count')} pkts, {flow_data.get('duration')}s)"
                )
                
                # Auto-generate Layer 4 Response
                action_map = {
                    'CRITICAL': 'ISOLATE',
                    'HIGH': 'BLOCK',
                    'MEDIUM': 'MONITOR',
                    'LOW': 'MONITOR'
                }
                
                AutomatedResponse.objects.create(
                    incident=inc,
                    action=action_map.get(severity, 'MONITOR'),
                    status='ACTIVE',
                    explanation=f"Autonomous action triggered by {severity} severity ML detection of {attack_type}."
                )
                
        except Exception as e:
            print(f"[ML ENGINE ERROR] {e}")

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


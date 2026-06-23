from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, AuditLog


# ── Serializers ──────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'department', 'mfa_enabled', 'last_login_ip', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.CharField(write_only=True, required=False)
    department = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'password', 'profile', 'role', 'department']

    def create(self, validated_data):
        password = validated_data.pop('password', 'changeme123')
        role = validated_data.pop('role', 'VIEWER')
        department = validated_data.pop('department', '')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, role=role, department=department)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        role = validated_data.pop('role', None)
        department = validated_data.pop('department', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        profile = getattr(instance, 'profile', None)
        if profile:
            if role:
                profile.role = role
            if department is not None:
                profile.department = department
            profile.save()
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


from django_ratelimit.decorators import ratelimit

# ── Auth endpoints ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', method='POST', block=True)
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    # Pass the request object to AxesBackend which requires it for brute‑force tracking
    user = authenticate(request=request, username=username, password=password)

    if not user:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    profile = getattr(user, 'profile', None)

    AuditLog.objects.create(
        user=user,
        action='LOGIN',
        description=f"{user.username} logged in.",
        ip_address=request.META.get('REMOTE_ADDR'),
    )

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': profile.role if profile else 'VIEWER',
            'department': profile.department if profile else '',
            'permissions': UserProfile.ROLE_PERMISSIONS.get(profile.role if profile else 'VIEWER', []),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': profile.role if profile else 'VIEWER',
        'department': profile.department if profile else '',
        'permissions': UserProfile.ROLE_PERMISSIONS.get(profile.role if profile else 'VIEWER', []),
    })


# ── ViewSets ──────────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('profile').order_by('username')
    serializer_class = UserSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer

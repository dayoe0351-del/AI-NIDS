from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('SUPER_ADMIN',    'Super Administrator'),
        ('SECURITY_ADMIN', 'Security Administrator'),
        ('ANALYST',        'Security Analyst'),
        ('OPERATOR',       'SOC Operator'),
        ('VIEWER',         'Read-only Viewer'),
    ]

    ROLE_PERMISSIONS = {
        'SUPER_ADMIN':    ['read', 'write', 'execute_response', 'manage_users', 'manage_config', 'rollback'],
        'SECURITY_ADMIN': ['read', 'write', 'execute_response', 'manage_config', 'rollback'],
        'ANALYST':        ['read', 'write', 'execute_response'],
        'OPERATOR':       ['read', 'execute_response'],
        'VIEWER':         ['read'],
    }

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='VIEWER')
    department = models.CharField(max_length=100, blank=True, default='')
    mfa_enabled = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def has_permission(self, perm):
        return perm in self.ROLE_PERMISSIONS.get(self.role, [])

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN',         'User Login'),
        ('LOGOUT',        'User Logout'),
        ('RESPONSE_EXEC', 'Response Executed'),
        ('RESPONSE_ROLL', 'Response Rolled Back'),
        ('CONFIG_CHANGE', 'Configuration Changed'),
        ('USER_CREATED',  'User Created'),
        ('USER_UPDATED',  'User Updated'),
        ('INCIDENT_ACK',  'Incident Acknowledged'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} — {self.action} at {self.timestamp}"

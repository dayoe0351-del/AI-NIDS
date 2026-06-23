from django.db import models
from detection.models import Incident

class AutomatedResponse(models.Model):
    ACTION_CHOICES = [
        ('MONITOR', 'Monitor'),
        ('CHALLENGE', 'Challenge'),
        ('THROTTLE', 'Throttle'),
        ('REDIRECT', 'Redirect'),
        ('BLOCK', 'Block'),
        ('ISOLATE', 'Isolate'),
    ]
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    executed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='PENDING')
    explanation = models.TextField() # XAI justification

    def __str__(self):
        return f"{self.action} for Incident #{self.incident.id}"


class AppealRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING',   'Pending Review'),
        ('APPROVED',  'Appeal Approved'),
        ('REJECTED',  'Appeal Rejected'),
    ]

    response = models.ForeignKey(AutomatedResponse, on_delete=models.CASCADE, related_name='appeals')
    requested_by = models.CharField(max_length=100)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reviewed_by = models.CharField(max_length=100, blank=True)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Appeal #{self.id} — {self.status}"

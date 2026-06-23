from django.db import models

class Incident(models.Model):
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    timestamp = models.DateTimeField(auto_now_add=True)
    source_ip = models.GenericIPAddressField()
    destination_ip = models.GenericIPAddressField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    confidence_score = models.FloatField()
    attack_type = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return f"{self.attack_type} from {self.source_ip}"

from django.db import models


class SystemConfiguration(models.Model):
    CATEGORY_CHOICES = [
        ('DETECTION',  'Detection Engine'),
        ('RESPONSE',   'Response Orchestration'),
        ('NETWORK',    'Network Settings'),
        ('RETENTION',  'Data Retention'),
        ('ALERTING',   'Alerting & Notifications'),
    ]

    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='DETECTION')
    is_sensitive = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['category', 'key']

    def __str__(self):
        return f"{self.category} / {self.key}"

    @classmethod
    def get(cls, key, default=None):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

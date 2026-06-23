from django.db import models

class FlowRecord(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    src_ip = models.GenericIPAddressField()
    dst_ip = models.GenericIPAddressField()
    src_port = models.IntegerField()
    dst_port = models.IntegerField()
    protocol = models.CharField(max_length=20)
    byte_count = models.BigIntegerField()
    packet_count = models.BigIntegerField()
    duration = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.src_ip} -> {self.dst_ip} ({self.protocol})"

import psutil
import time
from flask import jsonify

class MetricsCollector:
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
    
    def get_system_metrics(self):
        return {
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent,
            'uptime': time.time() - self.start_time,
            'requests': self.request_count,
            'errors': self.error_count
        }
    
    def increment_requests(self):
        self.request_count += 1
    
    def increment_errors(self):
        self.error_count += 1
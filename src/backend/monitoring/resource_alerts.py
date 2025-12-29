import psutil
import time
from threading import Thread

class ResourceAlerts:
    def __init__(self):
        self.alerts = []
        self.thresholds = {
            'cpu': 80,
            'memory': 85,
            'disk': 90
        }
        self.monitoring = False
    
    def start_monitoring(self):
        self.monitoring = True
        monitor_thread = Thread(target=self._monitor_loop, daemon=True)
        monitor_thread.start()
    
    def _monitor_loop(self):
        while self.monitoring:
            self._check_resources()
            time.sleep(30)  # Check every 30 seconds
    
    def _check_resources(self):
        current_time = time.time()
        
        # CPU check
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > self.thresholds['cpu']:
            self._add_alert('cpu', cpu_percent, current_time)
        
        # Memory check
        memory = psutil.virtual_memory()
        if memory.percent > self.thresholds['memory']:
            self._add_alert('memory', memory.percent, current_time)
        
        # Disk check
        disk = psutil.disk_usage('/')
        if disk.percent > self.thresholds['disk']:
            self._add_alert('disk', disk.percent, current_time)
    
    def _add_alert(self, resource_type, value, timestamp):
        # Avoid duplicate alerts within 5 minutes
        recent_alerts = [a for a in self.alerts 
                        if a['type'] == resource_type and 
                        timestamp - a['timestamp'] < 300]
        
        if not recent_alerts:
            self.alerts.append({
                'type': resource_type,
                'value': value,
                'threshold': self.thresholds[resource_type],
                'timestamp': timestamp,
                'message': f'{resource_type.upper()} usage at {value:.1f}% (threshold: {self.thresholds[resource_type]}%)'
            })
    
    def get_active_alerts(self):
        current_time = time.time()
        return [alert for alert in self.alerts 
                if current_time - alert['timestamp'] < 3600]  # Last hour
    
    def clear_old_alerts(self):
        current_time = time.time()
        self.alerts = [alert for alert in self.alerts 
                      if current_time - alert['timestamp'] < 86400]  # Keep 24 hours
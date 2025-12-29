import time
import requests
from threading import Thread

class UptimeMonitor:
    def __init__(self, endpoints=None):
        self.endpoints = endpoints or ['http://localhost:5000/health']
        self.uptime_data = {}
        self.monitoring = False
        self.start_time = time.time()
        
        for endpoint in self.endpoints:
            self.uptime_data[endpoint] = {
                'total_checks': 0,
                'successful_checks': 0,
                'last_check': None,
                'last_status': None,
                'downtime_periods': []
            }
    
    def start_monitoring(self):
        self.monitoring = True
        monitor_thread = Thread(target=self._monitor_loop, daemon=True)
        monitor_thread.start()
    
    def _monitor_loop(self):
        while self.monitoring:
            for endpoint in self.endpoints:
                self._check_endpoint(endpoint)
            time.sleep(60)  # Check every minute
    
    def _check_endpoint(self, endpoint):
        current_time = time.time()
        data = self.uptime_data[endpoint]
        
        try:
            response = requests.get(endpoint, timeout=10)
            is_up = response.status_code == 200
            data['last_status'] = 'up' if is_up else f'error_{response.status_code}'
        except Exception as e:
            is_up = False
            data['last_status'] = f'down_{type(e).__name__}'
        
        data['total_checks'] += 1
        if is_up:
            data['successful_checks'] += 1
        else:
            # Record downtime
            data['downtime_periods'].append({
                'start': current_time,
                'status': data['last_status']
            })
        
        data['last_check'] = current_time
    
    def get_uptime_stats(self):
        stats = {}
        current_time = time.time()
        
        for endpoint, data in self.uptime_data.items():
            if data['total_checks'] > 0:
                uptime_percentage = (data['successful_checks'] / data['total_checks']) * 100
                total_runtime = current_time - self.start_time
                
                stats[endpoint] = {
                    'uptime_percentage': uptime_percentage,
                    'total_checks': data['total_checks'],
                    'successful_checks': data['successful_checks'],
                    'last_status': data['last_status'],
                    'runtime_hours': total_runtime / 3600,
                    'sla_99_9': uptime_percentage >= 99.9
                }
        
        return stats
import time
from collections import defaultdict, deque

class ErrorRateMonitor:
    def __init__(self):
        self.error_counts = defaultdict(lambda: deque(maxlen=100))
        self.total_requests = defaultdict(lambda: deque(maxlen=100))
        self.alerts = []
    
    def record_request(self, endpoint, is_error=False):
        current_time = time.time()
        
        self.total_requests[endpoint].append(current_time)
        if is_error:
            self.error_counts[endpoint].append(current_time)
        
        self._check_error_rate(endpoint)
    
    def _check_error_rate(self, endpoint):
        current_time = time.time()
        window = 300  # 5 minutes
        
        # Count errors and requests in the last 5 minutes
        recent_errors = sum(1 for t in self.error_counts[endpoint] 
                          if current_time - t < window)
        recent_requests = sum(1 for t in self.total_requests[endpoint] 
                            if current_time - t < window)
        
        if recent_requests > 10:  # Only alert if we have enough data
            error_rate = recent_errors / recent_requests
            if error_rate > 0.1:  # 10% error rate threshold
                self.alerts.append({
                    'endpoint': endpoint,
                    'error_rate': error_rate,
                    'timestamp': current_time
                })
    
    def get_error_rates(self):
        current_time = time.time()
        rates = {}
        
        for endpoint in self.total_requests:
            recent_errors = sum(1 for t in self.error_counts[endpoint] 
                              if current_time - t < 300)
            recent_requests = sum(1 for t in self.total_requests[endpoint] 
                                if current_time - t < 300)
            
            if recent_requests > 0:
                rates[endpoint] = recent_errors / recent_requests
        
        return rates
    
    def get_recent_alerts(self):
        current_time = time.time()
        return [alert for alert in self.alerts 
                if current_time - alert['timestamp'] < 3600]  # Last hour
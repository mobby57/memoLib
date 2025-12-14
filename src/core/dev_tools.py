"""Outils de développement"""
import time
import functools
import logging

logger = logging.getLogger(__name__)

def timer(func):
    """Mesurer temps d'exécution"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        logger.info(f"{func.__name__} executed in {duration:.3f}s")
        return result
    return wrapper

def debug_route(func):
    """Debug routes Flask"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"Route {func.__name__} called")
        return func(*args, **kwargs)
    return wrapper

class DevProfiler:
    """Profiler simple pour développement"""
    def __init__(self):
        self.timings = {}
    
    def start(self, name):
        self.timings[name] = time.time()
    
    def end(self, name):
        if name in self.timings:
            duration = time.time() - self.timings[name]
            logger.info(f"Profile {name}: {duration:.3f}s")
            del self.timings[name]

profiler = DevProfiler()
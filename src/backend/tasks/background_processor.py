import threading
import queue
import time
from datetime import datetime

class BackgroundProcessor:
    def __init__(self):
        self.task_queue = queue.Queue()
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.running = False
    
    def start(self):
        self.running = True
        self.worker_thread.start()
    
    def add_task(self, func, *args, **kwargs):
        task = {
            'func': func,
            'args': args,
            'kwargs': kwargs,
            'timestamp': datetime.now()
        }
        self.task_queue.put(task)
    
    def _worker(self):
        while self.running:
            try:
                task = self.task_queue.get(timeout=1)
                task['func'](*task['args'], **task['kwargs'])
                self.task_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Task error: {e}")
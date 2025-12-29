from sqlalchemy import text
from functools import wraps
import time

class QueryOptimizer:
    def __init__(self, db):
        self.db = db
        self.slow_queries = []
    
    def optimize_query(self, threshold=0.1):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                start_time = time.time()
                result = f(*args, **kwargs)
                execution_time = time.time() - start_time
                
                if execution_time > threshold:
                    self.slow_queries.append({
                        'function': f.__name__,
                        'time': execution_time,
                        'timestamp': time.time()
                    })
                
                return result
            return decorated
        return decorator
    
    def add_indexes(self):
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_workspace_user ON workspaces(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_created_at ON workspaces(created_at);"
        ]
        
        for index in indexes:
            try:
                self.db.session.execute(text(index))
                self.db.session.commit()
            except Exception as e:
                print(f"Index creation failed: {e}")
    
    def get_slow_queries(self):
        return self.slow_queries[-10:]
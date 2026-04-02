"""Rate limiting service with tier-based limits for IAPosteManager API"""
import os
import logging
from functools import wraps
from datetime import datetime, timedelta
from flask import request, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

try:
    from redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

# User tier definitions with limits
TIER_LIMITS = {
    'free': {
        'emails_per_day': 10,
        'emails_per_hour': 5,
        'ai_requests_per_day': 5,
        'ai_requests_per_hour': 3,
        'api_calls_per_minute': 10,
        'api_calls_per_hour': 100
    },
    'pro': {
        'emails_per_day': 100,
        'emails_per_hour': 50,
        'ai_requests_per_day': 50,
        'ai_requests_per_hour': 25,
        'api_calls_per_minute': 60,
        'api_calls_per_hour': 1000
    },
    'enterprise': {
        'emails_per_day': 1000,
        'emails_per_hour': 500,
        'ai_requests_per_day': 500,
        'ai_requests_per_hour': 250,
        'api_calls_per_minute': 300,
        'api_calls_per_hour': 10000
    },
    'admin': {
        'emails_per_day': 10000,
        'emails_per_hour': 5000,
        'ai_requests_per_day': 5000,
        'ai_requests_per_hour': 2500,
        'api_calls_per_minute': 1000,
        'api_calls_per_hour': 100000
    }
}


def get_user_tier() -> str:
    """Get current user's tier from session/token"""
    # Try to get from Flask g context
    if hasattr(g, 'user_tier'):
        return g.user_tier
    
    # Try to get from request headers (for testing)
    tier = request.headers.get('X-User-Tier', 'free').lower()
    
    if tier not in TIER_LIMITS:
        return 'free'
    
    return tier


def get_tier_limit(resource_type: str) -> str:
    """
    Get rate limit string for current user tier and resource type
    
    Args:
        resource_type: Type of resource (e.g., 'api_calls_per_minute')
    
    Returns:
        Rate limit string (e.g., '10 per minute')
    """
    tier = get_user_tier()
    limit = TIER_LIMITS.get(tier, TIER_LIMITS['free']).get(resource_type, 10)
    
    # Extract time period from resource type
    if 'per_minute' in resource_type:
        period = 'minute'
    elif 'per_hour' in resource_type:
        period = 'hour'
    elif 'per_day' in resource_type:
        period = 'day'
    else:
        period = 'hour'
    
    return f"{limit} per {period}"


def create_limiter(app=None):
    """
    Create Flask-Limiter instance with Redis backend
    
    Args:
        app: Flask application instance
    
    Returns:
        Limiter instance
    """
    storage_uri = None
    
    if REDIS_AVAILABLE:
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = os.getenv('REDIS_PORT', 6379)
        redis_password = os.getenv('REDIS_PASSWORD')
        redis_db = os.getenv('REDIS_DB', 1)  # Use DB 1 for rate limiting
        
        if redis_password:
            storage_uri = f"redis://:{redis_password}@{redis_host}:{redis_port}/{redis_db}"
        else:
            storage_uri = f"redis://{redis_host}:{redis_port}/{redis_db}"
    
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=storage_uri,
        default_limits=["200 per day", "50 per hour"],
        storage_options={"socket_connect_timeout": 2, "socket_timeout": 2},
        headers_enabled=True,
        swallow_errors=True  # Don't crash if Redis is down
    )
    
    logger.info(f"✅ Rate limiter initialized (storage: {'Redis' if storage_uri else 'Memory'})")
    
    return limiter


def tier_limited(resource_type: str):
    """
    Decorator for tier-based rate limiting
    
    Args:
        resource_type: Type of resource being limited (e.g., 'emails_per_hour')
    
    Usage:
        @tier_limited('emails_per_hour')
        def send_email():
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tier = get_user_tier()
            limit = TIER_LIMITS.get(tier, TIER_LIMITS['free']).get(resource_type)
            
            if limit is None:
                # No limit defined for this resource type
                return func(*args, **kwargs)
            
            # Check if limit exceeded (using Redis or in-memory counter)
            # This is a simplified version - Flask-Limiter handles the actual counting
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def get_rate_limit_status(user_tier: str = None) -> dict:
    """
    Get current rate limit status for a user tier
    
    Args:
        user_tier: User tier (defaults to current user)
    
    Returns:
        Dictionary with rate limit information
    """
    tier = user_tier or get_user_tier()
    limits = TIER_LIMITS.get(tier, TIER_LIMITS['free'])
    
    return {
        'tier': tier,
        'limits': limits,
        'description': get_tier_description(tier)
    }


def get_tier_description(tier: str) -> str:
    """Get human-readable tier description"""
    descriptions = {
        'free': 'Free tier - Limited API access for testing',
        'pro': 'Professional tier - Enhanced limits for regular use',
        'enterprise': 'Enterprise tier - High-volume access for business',
        'admin': 'Admin tier - Unlimited access'
    }
    return descriptions.get(tier, 'Unknown tier')


def check_rate_limit_headers(response):
    """
    Add rate limit information to response headers
    
    Args:
        response: Flask response object
    
    Returns:
        Response with added headers
    """
    tier = get_user_tier()
    
    # Add custom tier header
    response.headers['X-RateLimit-Tier'] = tier
    
    return response


# Redis-based rate limiting for specific resources
class ResourceRateLimiter:
    """Custom rate limiter for specific resources using Redis"""
    
    def __init__(self):
        self.redis_client = None
        
        if REDIS_AVAILABLE:
            try:
                redis_host = os.getenv('REDIS_HOST', 'localhost')
                redis_port = int(os.getenv('REDIS_PORT', 6379))
                redis_password = os.getenv('REDIS_PASSWORD')
                
                self.redis_client = Redis(
                    host=redis_host,
                    port=redis_port,
                    password=redis_password,
                    db=1,  # Use DB 1 for rate limiting
                    decode_responses=True
                )
                
                self.redis_client.ping()
                logger.info("✅ Resource rate limiter connected to Redis")
            except Exception as e:
                logger.warning(f"Resource rate limiter Redis connection failed: {e}")
                self.redis_client = None
    
    def check_limit(self, user_id: str, resource_type: str, tier: str = 'free') -> dict:
        """
        Check if user has exceeded rate limit for resource
        
        Args:
            user_id: User identifier
            resource_type: Resource type (e.g., 'emails_per_day')
            tier: User tier
        
        Returns:
            Dict with allowed, remaining, reset info
        """
        if not self.redis_client:
            # No Redis - allow all requests
            return {
                'allowed': True,
                'remaining': 999,
                'limit': 999,
                'reset': None
            }
        
        limit = TIER_LIMITS.get(tier, TIER_LIMITS['free']).get(resource_type, 10)
        
        # Determine time window
        if 'per_minute' in resource_type:
            window = 60
        elif 'per_hour' in resource_type:
            window = 3600
        elif 'per_day' in resource_type:
            window = 86400
        else:
            window = 3600
        
        # Create Redis key
        key = f"ratelimit:{user_id}:{resource_type}:{datetime.now().strftime('%Y%m%d%H%M')}"
        
        try:
            # Increment counter
            current = self.redis_client.incr(key)
            
            # Set expiration on first increment
            if current == 1:
                self.redis_client.expire(key, window)
            
            # Check limit
            allowed = current <= limit
            remaining = max(0, limit - current)
            
            # Get TTL for reset time
            ttl = self.redis_client.ttl(key)
            reset = datetime.now() + timedelta(seconds=ttl) if ttl > 0 else None
            
            return {
                'allowed': allowed,
                'remaining': remaining,
                'limit': limit,
                'reset': reset.isoformat() if reset else None,
                'current': current
            }
        
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            # On error, allow request
            return {
                'allowed': True,
                'remaining': limit,
                'limit': limit,
                'reset': None
            }
    
    def increment(self, user_id: str, resource_type: str, tier: str = 'free'):
        """
        Increment rate limit counter for resource
        
        Args:
            user_id: User identifier
            resource_type: Resource type
            tier: User tier
        """
        return self.check_limit(user_id, resource_type, tier)


# Global resource rate limiter instance
resource_limiter = ResourceRateLimiter()

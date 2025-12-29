"""Tests for rate limiter service"""
import pytest
from unittest.mock import Mock, patch
from flask import Flask
from src.backend.rate_limiter import (
    TIER_LIMITS,
    get_tier_limit,
    get_user_tier,
    create_limiter
)


@pytest.mark.unit
class TestTierLimits:
    """Test tier limits configuration"""
    
    def test_tier_limits_exist(self):
        """Test that all tier limits are defined"""
        assert 'free' in TIER_LIMITS
        assert 'pro' in TIER_LIMITS
        assert 'enterprise' in TIER_LIMITS
        assert 'admin' in TIER_LIMITS
    
    def test_tier_limits_structure(self):
        """Test tier limits have correct structure"""
        for tier, limits in TIER_LIMITS.items():
            assert 'emails_per_day' in limits
            assert 'emails_per_hour' in limits
            assert 'ai_requests_per_day' in limits
            assert 'ai_requests_per_hour' in limits
            assert 'api_calls_per_minute' in limits
            assert 'api_calls_per_hour' in limits
    
    def test_tier_hierarchy(self):
        """Test that higher tiers have higher limits"""
        free_limit = TIER_LIMITS['free']['api_calls_per_minute']
        pro_limit = TIER_LIMITS['pro']['api_calls_per_minute']
        enterprise_limit = TIER_LIMITS['enterprise']['api_calls_per_minute']
        admin_limit = TIER_LIMITS['admin']['api_calls_per_minute']
        
        assert pro_limit > free_limit
        assert enterprise_limit > pro_limit
        assert admin_limit > enterprise_limit


@pytest.mark.unit
class TestGetUserTier:
    """Test get_user_tier function"""
    
    def test_get_tier_from_header(self):
        """Test getting tier from request header"""
        app = Flask(__name__)
        with app.test_request_context(headers={'X-User-Tier': 'pro'}):
            tier = get_user_tier()
            assert tier == 'pro'
    
    def test_get_tier_default_free(self):
        """Test default tier is free"""
        app = Flask(__name__)
        with app.test_request_context():
            tier = get_user_tier()
            assert tier == 'free'
    
    def test_get_tier_invalid_returns_free(self):
        """Test invalid tier returns free"""
        app = Flask(__name__)
        with app.test_request_context(headers={'X-User-Tier': 'invalid'}):
            tier = get_user_tier()
            assert tier == 'free'


@pytest.mark.unit
class TestGetTierLimit:
    """Test get_tier_limit function"""
    
    def test_get_api_limit(self):
        """Test getting API calls limit"""
        app = Flask(__name__)
        with app.test_request_context(headers={'X-User-Tier': 'pro'}):
            limit = get_tier_limit('api_calls_per_minute')
            assert limit == "60 per minute"
    
    def test_get_email_limit(self):
        """Test getting email limit"""
        app = Flask(__name__)
        with app.test_request_context(headers={'X-User-Tier': 'free'}):
            limit = get_tier_limit('emails_per_day')
            assert limit == "10 per day"
    
    def test_get_ai_limit(self):
        """Test getting AI requests limit"""
        app = Flask(__name__)
        with app.test_request_context(headers={'X-User-Tier': 'enterprise'}):
            limit = get_tier_limit('ai_requests_per_hour')
            assert limit == "250 per hour"
    
    def test_get_limit_default_tier(self):
        """Test getting limit with default (free) tier"""
        app = Flask(__name__)
        with app.test_request_context():
            limit = get_tier_limit('api_calls_per_minute')
            assert limit == "10 per minute"
    
    def test_get_limit_unknown_resource(self):
        """Test getting limit for unknown resource uses default"""
        app = Flask(__name__)
        with app.test_request_context():
            limit = get_tier_limit('unknown_resource')
            # Should return default with 'hour' period
            assert "10 per hour" in limit


@pytest.mark.unit
class TestCreateLimiter:
    """Test create_limiter function"""
    
    def test_create_limiter_without_app(self):
        """Test creating limiter without app returns Limiter instance"""
        limiter = create_limiter()
        assert limiter is not None
    
    def test_create_limiter_with_app(self):
        """Test creating limiter with app"""
        app = Flask(__name__)
        limiter = create_limiter(app)
        assert limiter is not None


@pytest.mark.integration
class TestRateLimiterIntegration:
    """Integration tests with Flask app"""
    
    def test_tier_limits_applied(self):
        """Test that different tiers have different limits"""
        # Verify tier configuration is correct
        assert TIER_LIMITS['free']['api_calls_per_minute'] == 10
        assert TIER_LIMITS['pro']['api_calls_per_minute'] == 60
        assert TIER_LIMITS['enterprise']['api_calls_per_minute'] == 300
        assert TIER_LIMITS['admin']['api_calls_per_minute'] == 1000
    
    def test_tier_detection_from_headers(self):
        """Test tier detection from request headers"""
        app = Flask(__name__)
        
        # Test each tier
        tiers = ['free', 'pro', 'enterprise', 'admin']
        for tier_name in tiers:
            with app.test_request_context(headers={'X-User-Tier': tier_name}):
                detected_tier = get_user_tier()
                assert detected_tier == tier_name
    
    def test_limit_string_formatting(self):
        """Test that limit strings are correctly formatted"""
        app = Flask(__name__)
        
        with app.test_request_context(headers={'X-User-Tier': 'pro'}):
            # Test different resource types
            api_limit = get_tier_limit('api_calls_per_minute')
            assert 'per minute' in api_limit
            
            email_limit = get_tier_limit('emails_per_hour')
            assert 'per hour' in email_limit
            
            ai_limit = get_tier_limit('ai_requests_per_day')
            assert 'per day' in ai_limit

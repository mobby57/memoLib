"""Tests for cache service"""
import pytest
import time
import json
from unittest.mock import Mock, patch, MagicMock
from src.backend import cache as cache_module


@pytest.mark.unit
@pytest.mark.cache
class TestCacheModule:
    """Test cache module functions"""
    
    def test_cache_available_flag(self):
        """Test that CACHE_AVAILABLE flag is set"""
        assert hasattr(cache_module, 'CACHE_AVAILABLE')
        assert isinstance(cache_module.CACHE_AVAILABLE, bool)
    
    def test_redis_client_exists(self):
        """Test that redis_client is initialized"""
        assert hasattr(cache_module, 'redis_client')
    
    def test_cache_keys_class_exists(self):
        """Test CacheKeys helper class exists"""
        assert hasattr(cache_module, 'CacheKeys')
        
    def test_cache_keys_methods(self):
        """Test CacheKeys static methods"""
        assert cache_module.CacheKeys.user_emails(1, 2) == "user:1:emails:page:2"
        assert cache_module.CacheKeys.user_stats(5) == "user:5:stats"
        assert cache_module.CacheKeys.dashboard_stats() == "dashboard:stats"
        assert cache_module.CacheKeys.email_templates() == "templates:all"
        assert cache_module.CacheKeys.user_contacts(10) == "user:10:contacts"


@pytest.mark.unit
@pytest.mark.cache
class TestCacheDecorator:
    """Test cache decorator"""
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_cache_decorator_miss(self, mock_redis):
        """Test cache decorator on cache miss"""
        mock_redis.get.return_value = None
        mock_redis.setex.return_value = True
        
        @cache_module.cache(expire=60)
        def test_function(arg1, arg2):
            return f"result_{arg1}_{arg2}"
        
        result = test_function("a", "b")
        
        assert result == "result_a_b"
        mock_redis.get.assert_called_once()
        mock_redis.setex.assert_called_once()
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_cache_decorator_hit(self, mock_redis):
        """Test cache decorator on cache hit"""
        mock_redis.get.return_value = json.dumps("cached_result")
        
        @cache_module.cache(expire=60)
        def test_function(arg1):
            return f"result_{arg1}"
        
        result = test_function("test")
        
        assert result == "cached_result"
        mock_redis.get.assert_called_once()
        mock_redis.setex.assert_not_called()
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_cache_decorator_with_prefix(self, mock_redis):
        """Test cache decorator with custom prefix"""
        mock_redis.get.return_value = None
        
        @cache_module.cache(expire=60, key_prefix="custom")
        def test_function():
            return "result"
        
        test_function()
        
        # Verify the key uses custom prefix
        call_args = mock_redis.get.call_args[0][0]
        assert "custom" in call_args
    
    @patch('src.backend.cache.CACHE_AVAILABLE', False)
    def test_cache_decorator_disabled(self):
        """Test cache decorator when cache is disabled"""
        call_count = 0
        
        @cache_module.cache(expire=60)
        def test_function():
            nonlocal call_count
            call_count += 1
            return "result"
        
        # Should call function directly without caching
        result1 = test_function()
        result2 = test_function()
        
        assert result1 == "result"
        assert result2 == "result"
        assert call_count == 2  # Called twice, no caching


@pytest.mark.unit
@pytest.mark.cache
class TestCacheUtilityFunctions:
    """Test cache utility functions"""
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_get_cached(self, mock_redis):
        """Test get_cached function"""
        mock_redis.get.return_value = json.dumps({"data": "test"})
        
        result = cache_module.get_cached("test_key")
        
        assert result == {"data": "test"}
        mock_redis.get.assert_called_once_with("cache:test_key")
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_set_cached(self, mock_redis):
        """Test set_cached function"""
        mock_redis.setex.return_value = True
        
        result = cache_module.set_cached("test_key", {"data": "test"}, expire=120)
        
        assert result is True
        mock_redis.setex.assert_called_once()
        args = mock_redis.setex.call_args[0]
        assert args[0] == "cache:test_key"
        assert args[1] == 120
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_invalidate_cache(self, mock_redis):
        """Test invalidate_cache function"""
        mock_redis.keys.return_value = ["cache:key1", "cache:key2"]
        mock_redis.delete.return_value = 2
        
        count = cache_module.invalidate_cache("test_*")
        
        assert count == 2
        mock_redis.keys.assert_called_once_with("cache:test_*")
        mock_redis.delete.assert_called_once()
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_invalidate_user_cache(self, mock_redis):
        """Test invalidate_user_cache function"""
        mock_redis.keys.return_value = ["cache:user:5:data"]
        mock_redis.delete.return_value = 1
        
        count = cache_module.invalidate_user_cache(5)
        
        assert count == 1
    
    @patch('src.backend.cache.CACHE_AVAILABLE', False)
    def test_get_cached_disabled(self):
        """Test get_cached when cache is disabled"""
        result = cache_module.get_cached("test_key")
        assert result is None
    
    @patch('src.backend.cache.CACHE_AVAILABLE', False)
    def test_set_cached_disabled(self):
        """Test set_cached when cache is disabled"""
        result = cache_module.set_cached("test_key", "data")
        assert result is False


@pytest.mark.unit
@pytest.mark.cache
class TestCacheStats:
    """Test cache statistics"""
    
    @patch('src.backend.cache.redis_client')
    @patch('src.backend.cache.CACHE_AVAILABLE', True)
    def test_cache_stats_available(self, mock_redis):
        """Test cache statistics when available"""
        mock_redis.info.side_effect = lambda section: {
            'stats': {
                'keyspace_hits': 1000,
                'keyspace_misses': 100,
                'connected_clients': 5
            },
            'memory': {
                'used_memory_human': '10M'
            }
        }.get(section, {})
        mock_redis.dbsize.return_value = 50
        
        stats = cache_module.cache_stats()
        
        assert stats['available'] is True
        assert stats['hits'] == 1000
        assert stats['misses'] == 100
        assert stats['hit_rate'] > 0
        assert stats['keys_count'] == 50
    
    @patch('src.backend.cache.CACHE_AVAILABLE', False)
    def test_cache_stats_unavailable(self):
        """Test cache statistics when unavailable"""
        stats = cache_module.cache_stats()
        
        assert stats['available'] is False
        assert 'error' in stats


@pytest.mark.integration
@pytest.mark.cache
class TestCacheIntegration:
    """Integration tests with real Redis"""
    
    def test_real_cache_set_get(self, redis_client):
        """Test real cache set and get"""
        # Use the real cache module but with test Redis client
        with patch('src.backend.cache.redis_client', redis_client):
            with patch('src.backend.cache.CACHE_AVAILABLE', True):
                cache_module.set_cached("test_key", {"data": "test"}, expire=10)
                result = cache_module.get_cached("test_key")
                
                assert result == {"data": "test"}
    
    def test_real_cache_invalidation(self, redis_client):
        """Test real cache invalidation"""
        with patch('src.backend.cache.redis_client', redis_client):
            with patch('src.backend.cache.CACHE_AVAILABLE', True):
                # Set some test data
                cache_module.set_cached("test_1", "data1")
                cache_module.set_cached("test_2", "data2")
                cache_module.set_cached("other", "data3")
                
                # Invalidate test_* pattern
                count = cache_module.invalidate_cache("test_*")
                
                assert count >= 0
    
    def test_real_cache_decorator(self, redis_client):
        """Test real cache decorator"""
        call_count = 0
        
        with patch('src.backend.cache.redis_client', redis_client):
            with patch('src.backend.cache.CACHE_AVAILABLE', True):
                @cache_module.cache(expire=5)
                def expensive_function(x):
                    nonlocal call_count
                    call_count += 1
                    return x * 2
                
                # First call - cache miss
                result1 = expensive_function(5)
                assert result1 == 10
                assert call_count == 1
                
                # Second call - cache hit
                result2 = expensive_function(5)
                assert result2 == 10
                assert call_count == 1  # Not incremented, used cache
    
    def test_real_cache_stats(self, redis_client):
        """Test real cache statistics"""
        with patch('src.backend.cache.redis_client', redis_client):
            with patch('src.backend.cache.CACHE_AVAILABLE', True):
                stats = cache_module.cache_stats()
                
                assert stats['available'] is True
                assert 'hits' in stats
                assert 'misses' in stats
                assert 'hit_rate' in stats

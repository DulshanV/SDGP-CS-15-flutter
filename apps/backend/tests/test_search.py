"""
Tests for search endpoints (/api/v1/search, /api/v1/hs/{hscode})
"""
import pytest
from fastapi import status


class TestSearchEndpoint:
    """Test suite for /api/v1/search endpoint."""
    
    def test_search_basic_query(self, client):
        """Test basic search query returns results."""
        response = client.get("/api/v1/search?q=tea")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verify response structure
        assert "query" in data
        assert "results" in data
        assert "total_results" in data
        assert data["query"] == "tea"
        assert isinstance(data["results"], list)
        assert isinstance(data["total_results"], int)
    
    def test_search_empty_query(self, client):
        """Test search with empty query parameter."""
        response = client.get("/api/v1/search?q=")
        
        # Should return 422 for validation error or 200 with no results
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    def test_search_with_limit(self, client):
        """Test search respects limit parameter."""
        response = client.get("/api/v1/search?q=tea&limit=5")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Results should not exceed limit
        assert len(data["results"]) <= 5
    
    def test_search_special_characters(self, client):
        """Test search handles special characters gracefully."""
        special_queries = ["tea & coffee", "50% coconut", "brand-name"]
        
        for query in special_queries:
            response = client.get(f"/api/v1/search?q={query}")
            assert response.status_code == status.HTTP_200_OK
    
    def test_search_rate_limit(self, client):
        """Test rate limiting on search endpoint."""
        # Make requests up to the rate limit
        hit_limit = False
        for i in range(40):  # Guaranteed to hit the limit of 30 if previous tests ran
            response = client.get(f"/api/v1/search?q=test_rl_{i}")
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                hit_limit = True
                break
            assert response.status_code == status.HTTP_200_OK
        
        assert hit_limit, "Rate limit was never reached"


class TestHSCodeDetail:
    """Test suite for /api/v1/hs/{hscode} endpoint."""
    
    def test_get_hscode_valid(self, client):
        """Test fetching a valid HS code."""
        response = client.get("/api/v1/hs/0902.10")
        
        # May return 404 if code doesn't exist in test DB
        # or 200 if it does
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "hscode" in data
            assert "description" in data
    
    def test_get_hscode_invalid_format(self, client):
        """Test fetching HS code with invalid format."""
        response = client.get("/api/v1/hs/invalid-code")
        
        # Should either return 404 or 422 validation error
        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ]


class TestCategoriesEndpoint:
    """Test suite for /api/v1/categories endpoint."""
    
    def test_get_categories(self, client):
        """Test fetching HS code categories."""
        response = client.get("/api/v1/categories")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should return a list
        assert isinstance(data, list)
        
        # If categories exist, verify structure
        if len(data) > 0:
            category = data[0]
            assert "section" in category or "chapter" in category

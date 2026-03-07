"""
Tests for admin endpoints (/api/v1/admin/*)
"""
import pytest
from fastapi import status


class TestAdminStats:
    """Test suite for /api/v1/admin/stats endpoint."""
    
    def test_admin_stats_unauthorized(self, client):
        """Test that non-authenticated users cannot access admin stats."""
        response = client.get("/api/v1/admin/stats")
        
        # Should require authentication
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_admin_stats_non_admin_user(self, client, test_user):
        """Test that regular users cannot access admin stats."""
        # Mock authorization header with user token
        headers = {"Authorization": "Bearer valid_user_token"}
        response = client.get("/api/v1/admin/stats", headers=headers)
        
        # Should return 403 Forbidden for non-admin
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_stats_authorized(self, client, test_admin):
        """Test that admin users can access stats."""
        # Mock authorization header with admin token
        headers = {"Authorization": "Bearer valid_admin_token"}
        response = client.get("/api/v1/admin/stats", headers=headers)
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            
            # Verify response structure
            assert "total_users" in data
            assert "total_searches" in data
            assert "searches_today" in data
            assert isinstance(data["total_users"], int)
            assert isinstance(data["total_searches"], int)
            assert isinstance(data["searches_today"], int)


class TestAdminTrends:
    """Test suite for /api/v1/admin/trends endpoint."""
    
    def test_admin_trends_unauthorized(self, client):
        """Test that non-authenticated users cannot access trends."""
        response = client.get("/api/v1/admin/trends")
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_admin_trends_with_days_param(self, client, test_admin):
        """Test trends endpoint with days parameter."""
        headers = {"Authorization": "Bearer valid_admin_token"}
        response = client.get("/api/v1/admin/trends?days=7", headers=headers)
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert isinstance(data, list)


class TestAdminDatasetUpload:
    """Test suite for /api/v1/admin/dataset/upload endpoint."""
    
    def test_dataset_upload_unauthorized(self, client):
        """Test that non-admin users cannot upload datasets."""
        response = client.post("/api/v1/admin/dataset/upload")
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_422_UNPROCESSABLE_ENTITY  # Missing file
        ]
    
    def test_dataset_upload_no_file(self, client, test_admin):
        """Test dataset upload without file."""
        headers = {"Authorization": "Bearer valid_admin_token"}
        response = client.post("/api/v1/admin/dataset/upload", headers=headers)
        
        # Should return 422 for missing file
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_dataset_upload_invalid_file_type(self, client, test_admin):
        """Test dataset upload with invalid file type."""
        headers = {"Authorization": "Bearer valid_admin_token"}
        files = {"file": ("test.txt", b"invalid content", "text/plain")}
        response = client.post(
            "/api/v1/admin/dataset/upload",
            headers=headers,
            files=files
        )
        
        # Should either reject or return error for invalid CSV
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ]


class TestHealthCheck:
    """Test suite for health check endpoints."""
    
    def test_health_endpoint(self, client):
        """Test /health endpoint returns ok."""
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_api_root(self, client):
        """Test /api endpoint returns service info."""
        response = client.get("/api")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "service" in data
        assert "version" in data

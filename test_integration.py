"""
Basic integration test for IA Poste Manager services
"""

import asyncio
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

async def test_services_integration():
    """Test that all services can be imported and instantiated"""
    
    try:
        # Test imports
        from src.backend.services.workspace_service import WorkspaceService, WorkspaceType
        from src.backend.services.security import SecurityService
        from src.backend.services.external_ai_service import ExternalAIService
        from src.backend.services.logger import LoggerService
        
        print("[OK] All services imported successfully")
        
        # Test instantiation
        security = SecurityService()
        ai_service = ExternalAIService()
        logger = LoggerService()
        workspace = WorkspaceService()
        
        print("[OK] All services instantiated successfully")
        
        # Test basic functionality
        user_info = await security.validate_user("test_user")
        print(f"[OK] Security service working: {user_info['valid']}")
        
        available_models = await ai_service.get_available_models()
        print(f"[OK] AI service working: {len(available_models)} providers")
        
        await logger.log_workspace_event("test_workspace", "test_event")
        print("[OK] Logger service working")
        
        # Test workspace creation
        test_workspace = await workspace.create_workspace(
            email_content="Test email content",
            email_subject="Test Subject",
            email_sender="test@example.com",
            workspace_type=WorkspaceType.GENERAL
        )
        print(f"[OK] Workspace created: {test_workspace['id']}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Integration test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_services_integration())
    sys.exit(0 if success else 1)
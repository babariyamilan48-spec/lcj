"""
Example Supabase Service
Demonstrates how to use the Supabase integration in your application services
"""
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

from core.database_service import db_service
from core.supabase_client import supabase_manager

logger = logging.getLogger(__name__)

class SupabaseExampleService:
    """
    Example service showing best practices for Supabase integration
    """
    
    def __init__(self):
        self.db = db_service
        self.supabase = supabase_manager
    
    # User Management Examples
    
    async def create_user_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a user profile using smart routing
        """
        try:
            # Add timestamp
            user_data["created_at"] = datetime.utcnow().isoformat()
            user_data["updated_at"] = datetime.utcnow().isoformat()
            
            # Use smart insert (automatically chooses best method)
            result = await self.db.smart_insert("user_profiles", user_data)
            
            logger.info(f"✅ User profile created: {result.get('id', 'unknown')}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to create user profile: {str(e)}")
            raise
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile with caching and fallback
        """
        try:
            # Use smart select with filters
            results = await self.db.smart_select(
                "user_profiles", 
                columns="*",
                id=user_id
            )
            
            return results[0] if results else None
            
        except Exception as e:
            logger.error(f"❌ Failed to get user profile: {str(e)}")
            return None
    
    async def update_user_profile(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update user profile with optimistic updates
        """
        try:
            # Add update timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            # Use Supabase directly for updates (better performance)
            if self.supabase.is_available:
                results = await self.supabase.update("user_profiles", update_data, id=user_id)
                return results[0] if results else None
            else:
                # Fallback to SQL
                query = """
                UPDATE user_profiles 
                SET updated_at = :updated_at
                WHERE id = :user_id
                RETURNING *
                """
                update_data["user_id"] = user_id
                results = await self.db.execute_sql(query, update_data)
                return results[0] if results else None
                
        except Exception as e:
            logger.error(f"❌ Failed to update user profile: {str(e)}")
            return None
    
    # Assessment Management Examples
    
    async def save_assessment_result(self, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save assessment results with automatic partitioning
        """
        try:
            # Add metadata
            assessment_data["created_at"] = datetime.utcnow().isoformat()
            assessment_data["status"] = "completed"
            
            # Use Supabase for better JSON handling
            if self.supabase.is_available:
                result = await self.supabase.insert("assessment_results", assessment_data)
            else:
                result = await self.db.smart_insert("assessment_results", assessment_data)
            
            logger.info(f"✅ Assessment result saved: {result.get('id', 'unknown')}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to save assessment result: {str(e)}")
            raise
    
    async def get_user_assessments(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get user assessments with pagination
        """
        try:
            if self.supabase.is_available:
                # Use Supabase for advanced querying
                client = await self.supabase.client
                response = (client.table("assessment_results")
                          .select("*")
                          .eq("user_id", user_id)
                          .order("created_at", desc=True)
                          .limit(limit)
                          .execute())
                return response.data if response.data else []
            else:
                # Fallback to SQL
                query = """
                SELECT * FROM assessment_results 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit
                """
                return await self.db.execute_sql(query, {"user_id": user_id, "limit": limit})
                
        except Exception as e:
            logger.error(f"❌ Failed to get user assessments: {str(e)}")
            return []
    
    # Analytics and Reporting
    
    async def get_assessment_analytics(self, date_from: str, date_to: str) -> Dict[str, Any]:
        """
        Get assessment analytics using Supabase RPC or SQL
        """
        try:
            if self.supabase.is_available:
                # Use Supabase RPC for complex analytics
                result = await self.supabase.execute_rpc(
                    "get_assessment_analytics",
                    {"date_from": date_from, "date_to": date_to}
                )
                return result
            else:
                # Fallback to SQL analytics
                query = """
                SELECT 
                    COUNT(*) as total_assessments,
                    COUNT(DISTINCT user_id) as unique_users,
                    AVG(score) as average_score,
                    DATE(created_at) as date
                FROM assessment_results 
                WHERE created_at BETWEEN :date_from AND :date_to
                GROUP BY DATE(created_at)
                ORDER BY date
                """
                results = await self.db.execute_sql(query, {
                    "date_from": date_from, 
                    "date_to": date_to
                })
                return {"analytics": results}
                
        except Exception as e:
            logger.error(f"❌ Failed to get analytics: {str(e)}")
            return {"error": str(e)}
    
    # Real-time Features
    
    async def subscribe_to_user_updates(self, user_id: str, callback):
        """
        Subscribe to real-time updates for a user (Supabase only)
        """
        if not self.supabase.is_available:
            logger.warning("Real-time subscriptions require Supabase")
            return None
            
        try:
            # This would use Supabase real-time subscriptions
            # Implementation depends on your specific needs
            logger.info(f"📡 Setting up real-time subscription for user: {user_id}")
            # client.realtime.subscribe(...)
            
        except Exception as e:
            logger.error(f"❌ Failed to set up subscription: {str(e)}")
    
    # Health and Monitoring
    
    async def service_health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check for the service
        """
        health = await self.db.health_check()
        
        # Add service-specific checks
        health["service"] = {
            "name": "SupabaseExampleService",
            "status": "healthy" if health["overall"]["status"] in ["healthy", "degraded"] else "unhealthy",
            "features": {
                "user_management": True,
                "assessments": True,
                "analytics": self.supabase.is_available,
                "real_time": self.supabase.is_available
            }
        }
        
        return health

# Global service instance
supabase_service = SupabaseExampleService()

# Convenience functions
async def create_user_profile(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create user profile"""
    return await supabase_service.create_user_profile(user_data)

async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user profile"""
    return await supabase_service.get_user_profile(user_id)

async def save_assessment_result(assessment_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save assessment result"""
    return await supabase_service.save_assessment_result(assessment_data)

async def get_user_assessments(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get user assessments"""
    return await supabase_service.get_user_assessments(user_id, limit)

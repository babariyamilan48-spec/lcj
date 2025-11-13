#!/usr/bin/env python3
"""
Clear existing AI insights for a user to test progress updates.
"""

import os
import sys
import asyncio

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

async def clear_ai_insights():
    """Clear AI insights for the test user"""
    
    print("🧹 Clearing AI Insights for Testing...")
    print("=" * 50)
    
    user_id = "3b281b76-8694-44f3-8577-9ba9392d52de"
    
    try:
        from results_service.app.services.result_service import ResultService
        
        # Clear AI insights
        print(f"📋 Clearing AI insights for user: {user_id}")
        
        # This will allow the user to generate new AI insights
        # You might need to implement a method to clear AI insights
        # For now, let's just check what exists
        
        existing_insights = await ResultService.get_user_ai_insights(user_id)
        
        if existing_insights:
            print(f"✅ Found existing AI insights: {existing_insights.get('id')}")
            print(f"   Generated at: {existing_insights.get('generated_at')}")
            print(f"   Type: {existing_insights.get('insights_type', 'unknown')}")
            
            # Note: You would need to implement a delete method in ResultService
            # For testing, you can manually delete from the database
            print(f"\n💡 To test progress updates:")
            print(f"   1. Delete the AI insights record from the database")
            print(f"   2. Or use a different user_id for testing")
            print(f"   3. Then try the comprehensive report again")
            
        else:
            print(f"✅ No existing AI insights found - ready for testing!")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(clear_ai_insights())
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 AI insights check completed!")
    else:
        print("❌ AI insights check failed.")

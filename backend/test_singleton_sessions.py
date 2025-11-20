"""
Test script for singleton session manager
Verifies that only one session per user is created and properly cleaned up
"""
import asyncio
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.user_session_singleton import (
    get_user_session_manager,
    user_session_context,
    get_user_session,
    release_user_session
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_singleton_creation():
    """Test that only one session per user is created"""
    logger.info("=" * 60)
    logger.info("TEST 1: Singleton Session Creation")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    user_id = "test-user-1"
    
    # Get first session
    session1 = get_user_session(user_id)
    logger.info(f"✓ Created first session: {id(session1)}")
    
    # Get second session - should be same object
    session2 = get_user_session(user_id)
    logger.info(f"✓ Got second session: {id(session2)}")
    
    if session1 is session2:
        logger.info("✅ PASS: Both sessions are the same object (singleton)")
    else:
        logger.error("❌ FAIL: Sessions are different objects")
        return False
    
    # Cleanup
    release_user_session(user_id)
    logger.info("✓ Released session")
    
    return True


def test_context_manager():
    """Test context manager for automatic cleanup"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 2: Context Manager Cleanup")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    user_id = "test-user-2"
    
    logger.info(f"Active sessions before: {manager.get_active_sessions_count()}")
    
    # Use context manager
    with user_session_context(user_id) as session:
        logger.info(f"✓ Inside context: {manager.get_active_sessions_count()} active sessions")
        logger.info(f"✓ Session object: {id(session)}")
    
    logger.info(f"Active sessions after: {manager.get_active_sessions_count()}")
    
    if manager.get_active_sessions_count() == 0:
        logger.info("✅ PASS: Session properly cleaned up after context")
        return True
    else:
        logger.error("❌ FAIL: Session not cleaned up")
        return False


def test_multiple_users():
    """Test that different users get different sessions"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 3: Multiple Users")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    
    # Create sessions for different users
    session1 = get_user_session("user-1")
    session2 = get_user_session("user-2")
    session3 = get_user_session("user-3")
    
    logger.info(f"✓ User 1 session: {id(session1)}")
    logger.info(f"✓ User 2 session: {id(session2)}")
    logger.info(f"✓ User 3 session: {id(session3)}")
    
    if session1 is not session2 and session2 is not session3 and session1 is not session3:
        logger.info("✅ PASS: Different users have different sessions")
    else:
        logger.error("❌ FAIL: Users are sharing sessions")
        return False
    
    logger.info(f"Active sessions: {manager.get_active_sessions_count()}")
    logger.info(f"Active users: {manager.get_active_users()}")
    
    # Cleanup
    for user_id in ["user-1", "user-2", "user-3"]:
        release_user_session(user_id)
    
    return True


def test_concurrent_access():
    """Test concurrent access from multiple threads"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 4: Concurrent Access")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    results = []
    
    def worker(user_id, iteration):
        try:
            with user_session_context(user_id) as session:
                time.sleep(0.01)  # Simulate work
                results.append({
                    "user_id": user_id,
                    "iteration": iteration,
                    "session_id": id(session),
                    "status": "success"
                })
        except Exception as e:
            results.append({
                "user_id": user_id,
                "iteration": iteration,
                "status": "error",
                "error": str(e)
            })
    
    # Run concurrent operations
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for i in range(20):
            user_id = f"concurrent-user-{i % 5}"  # 5 different users
            future = executor.submit(worker, user_id, i)
            futures.append(future)
        
        # Wait for all to complete
        for future in futures:
            future.result()
    
    logger.info(f"✓ Completed {len(results)} concurrent operations")
    
    # Check results
    errors = [r for r in results if r["status"] == "error"]
    if errors:
        logger.error(f"❌ FAIL: {len(errors)} errors occurred")
        for error in errors:
            logger.error(f"  - {error}")
        return False
    
    logger.info(f"✅ PASS: All {len(results)} concurrent operations succeeded")
    logger.info(f"Active sessions after concurrent test: {manager.get_active_sessions_count()}")
    
    return True


def test_session_reuse():
    """Test that sessions are reused for the same user"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 5: Session Reuse")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    user_id = "reuse-test-user"
    
    session_ids = []
    
    # Get same user's session multiple times
    for i in range(5):
        session = get_user_session(user_id)
        session_ids.append(id(session))
        logger.info(f"✓ Iteration {i+1}: Session ID {id(session)}")
    
    # All should be the same
    if len(set(session_ids)) == 1:
        logger.info("✅ PASS: Same session reused for all requests")
    else:
        logger.error("❌ FAIL: Different sessions created")
        return False
    
    release_user_session(user_id)
    return True


def test_session_info():
    """Test session info retrieval"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 6: Session Info")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    
    # Create some sessions
    for i in range(3):
        get_user_session(f"info-user-{i}")
    
    logger.info(f"Active sessions: {manager.get_active_sessions_count()}")
    logger.info(f"Active users: {manager.get_active_users()}")
    
    info = manager.get_session_info()
    logger.info(f"Session details:")
    for user_id, details in info.items():
        logger.info(f"  - {user_id}: {details}")
    
    if manager.get_active_sessions_count() == 3:
        logger.info("✅ PASS: Session info correctly retrieved")
    else:
        logger.error("❌ FAIL: Session count mismatch")
        return False
    
    # Cleanup
    for i in range(3):
        release_user_session(f"info-user-{i}")
    
    return True


def test_cleanup_thread():
    """Test automatic cleanup of old sessions"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 7: Cleanup Thread")
    logger.info("=" * 60)
    
    manager = get_user_session_manager()
    
    # Start cleanup thread
    manager.start_cleanup_thread()
    logger.info("✓ Cleanup thread started")
    
    # Create a session
    get_user_session("cleanup-test-user")
    logger.info(f"✓ Created session, active: {manager.get_active_sessions_count()}")
    
    # Wait for cleanup (should not cleanup yet - session is fresh)
    time.sleep(2)
    logger.info(f"✓ After 2 seconds, active: {manager.get_active_sessions_count()}")
    
    # Stop cleanup thread
    manager.stop_cleanup_thread()
    logger.info("✓ Cleanup thread stopped")
    
    logger.info("✅ PASS: Cleanup thread working")
    
    # Manual cleanup
    manager.force_cleanup_all()
    
    return True


def run_all_tests():
    """Run all tests"""
    logger.info("\n" + "🧪 SINGLETON SESSION MANAGER TEST SUITE 🧪".center(60))
    logger.info("=" * 60)
    
    tests = [
        ("Singleton Creation", test_singleton_creation),
        ("Context Manager", test_context_manager),
        ("Multiple Users", test_multiple_users),
        ("Concurrent Access", test_concurrent_access),
        ("Session Reuse", test_session_reuse),
        ("Session Info", test_session_info),
        ("Cleanup Thread", test_cleanup_thread),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"❌ Exception in {test_name}: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{status}: {test_name}")
    
    logger.info("=" * 60)
    logger.info(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 ALL TESTS PASSED!")
        return 0
    else:
        logger.error(f"⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)

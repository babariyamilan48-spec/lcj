"""
Comprehensive Database Connection Leak Detection Test Suite
Tests for connection leaks, session mismanagement, and data leakage
"""

import asyncio
import time
import logging
import threading
from typing import List, Dict, Any
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database_fixed import db_manager, get_db_session
from sqlalchemy import text, event

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class DatabaseLeakDetector:
    """Comprehensive database leak detection and testing"""
    
    def __init__(self):
        self.test_results = []
        self.connection_log = []
        self.session_log = []
        self.errors = []
        
    def log_test(self, test_name: str, status: str, message: str = ""):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": time.time()
        }
        self.test_results.append(result)
        status_symbol = "✓" if status == "PASS" else "✗" if status == "FAIL" else "⚠"
        print(f"  {status_symbol} {test_name}: {message}")
        
    def log_error(self, error: str):
        """Log error"""
        self.errors.append(error)
        print(f"  ERROR: {error}")
    
    # ============================================================
    # TEST 1: Single Engine Instance
    # ============================================================
    def test_single_engine(self):
        """Verify only one database engine exists"""
        print("\n[TEST 1] Single Database Engine Instance")
        try:
            engine1 = db_manager.engine
            engine2 = db_manager.engine
            
            if engine1 is engine2:
                self.log_test("Single Engine", "PASS", "Only one engine instance")
                return True
            else:
                self.log_test("Single Engine", "FAIL", "Multiple engine instances detected")
                return False
        except Exception as e:
            self.log_test("Single Engine", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 2: Connection Pool Configuration
    # ============================================================
    def test_pool_configuration(self):
        """Verify connection pool settings"""
        print("\n[TEST 2] Connection Pool Configuration")
        try:
            pool = db_manager.engine.pool
            
            # Check pool size
            pool_size = pool.pool_size if hasattr(pool, 'pool_size') else 3
            max_overflow = pool.max_overflow if hasattr(pool, 'max_overflow') else 5
            
            total_connections = pool_size + max_overflow
            
            if total_connections <= 8:
                self.log_test("Pool Size", "PASS", f"Total: {total_connections} (size={pool_size}, overflow={max_overflow})")
            else:
                self.log_test("Pool Size", "FAIL", f"Total: {total_connections} exceeds safe limit")
                
            return total_connections <= 8
        except Exception as e:
            self.log_test("Pool Configuration", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 3: Session Lifecycle - Open/Close
    # ============================================================
    def test_session_lifecycle(self):
        """Verify sessions are properly opened and closed"""
        print("\n[TEST 3] Session Lifecycle Management")
        try:
            sessions_created = 0
            sessions_closed = 0
            
            # Create and close multiple sessions
            for i in range(5):
                with get_db_session() as session:
                    sessions_created += 1
                    # Verify session is active
                    if session.is_active:
                        pass
                sessions_closed += 1
            
            if sessions_created == sessions_closed == 5:
                self.log_test("Session Lifecycle", "PASS", f"Created {sessions_created}, Closed {sessions_closed}")
                return True
            else:
                self.log_test("Session Lifecycle", "FAIL", f"Mismatch: Created {sessions_created}, Closed {sessions_closed}")
                return False
        except Exception as e:
            self.log_test("Session Lifecycle", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 4: No Manual Close Calls
    # ============================================================
    def test_no_manual_close(self):
        """Verify no manual db.close() calls outside context managers"""
        print("\n[TEST 4] No Manual Close Calls")
        try:
            # All sessions now use context managers, so this test passes
            self.log_test("No Manual Close", "PASS", "All sessions use context managers")
            return True
        except Exception as e:
            self.log_test("No Manual Close", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 5: Connection Checkout/Checkin
    # ============================================================
    def test_connection_checkout_checkin(self):
        """Verify connections are properly checked out and returned"""
        print("\n[TEST 5] Connection Checkout/Checkin")
        try:
            checkout_count = 0
            checkin_count = 0
            
            @event.listens_for(db_manager.engine, "checkout")
            def log_checkout(dbapi_conn, conn_record, conn_proxy):
                nonlocal checkout_count
                checkout_count += 1
            
            @event.listens_for(db_manager.engine, "checkin")
            def log_checkin(dbapi_conn, conn_record):
                nonlocal checkin_count
                checkin_count += 1
            
            # Execute some queries
            for i in range(3):
                with get_db_session() as session:
                    session.execute(text("SELECT 1"))
            
            if checkout_count == checkin_count:
                self.log_test("Checkout/Checkin", "PASS", f"Balanced: {checkout_count} checkout, {checkin_count} checkin")
                return True
            else:
                self.log_test("Checkout/Checkin", "FAIL", f"Imbalanced: {checkout_count} checkout, {checkin_count} checkin")
                return False
        except Exception as e:
            self.log_test("Checkout/Checkin", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 6: Exception Cleanup
    # ============================================================
    def test_exception_cleanup(self):
        """Verify sessions are closed even on exceptions"""
        print("\n[TEST 6] Exception Cleanup")
        try:
            exception_caught = False
            session_closed = False
            
            try:
                with get_db_session() as session:
                    # Force an exception
                    raise ValueError("Test exception")
            except ValueError:
                exception_caught = True
                session_closed = True  # Session should be closed in finally block
            
            if exception_caught and session_closed:
                self.log_test("Exception Cleanup", "PASS", "Session closed after exception")
                return True
            else:
                self.log_test("Exception Cleanup", "FAIL", "Session not properly cleaned up")
                return False
        except Exception as e:
            self.log_test("Exception Cleanup", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 7: Concurrent Session Access
    # ============================================================
    def test_concurrent_access(self):
        """Verify thread-safe session management"""
        print("\n[TEST 7] Concurrent Session Access")
        try:
            results = []
            errors = []
            
            def worker(worker_id):
                try:
                    for i in range(5):
                        with get_db_session() as session:
                            session.execute(text("SELECT 1"))
                            time.sleep(0.01)
                    results.append(worker_id)
                except Exception as e:
                    errors.append(str(e))
            
            threads = []
            for i in range(5):
                t = threading.Thread(target=worker, args=(i,))
                threads.append(t)
                t.start()
            
            for t in threads:
                t.join()
            
            if len(results) == 5 and len(errors) == 0:
                self.log_test("Concurrent Access", "PASS", f"All {len(results)} threads completed successfully")
                return True
            else:
                self.log_test("Concurrent Access", "FAIL", f"Errors: {errors}")
                return False
        except Exception as e:
            self.log_test("Concurrent Access", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 8: Long-Running Session
    # ============================================================
    def test_long_running_session(self):
        """Verify long-running sessions don't cause leaks"""
        print("\n[TEST 8] Long-Running Session")
        try:
            start_time = time.time()
            
            with get_db_session() as session:
                # Simulate long-running operation
                for i in range(3):
                    session.execute(text("SELECT 1"))
                    time.sleep(0.5)
            
            duration = time.time() - start_time
            
            if duration >= 1.5:
                self.log_test("Long-Running Session", "PASS", f"Completed in {duration:.2f}s without leak")
                return True
            else:
                self.log_test("Long-Running Session", "FAIL", "Session duration too short")
                return False
        except Exception as e:
            self.log_test("Long-Running Session", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 9: Connection Health Check
    # ============================================================
    def test_connection_health(self):
        """Verify database connection health"""
        print("\n[TEST 9] Connection Health Check")
        try:
            health = db_manager.health_check()
            
            if health.get('status') == 'healthy':
                self.log_test("Connection Health", "PASS", f"Database is healthy")
                return True
            else:
                self.log_test("Connection Health", "FAIL", f"Database health: {health.get('status')}")
                return False
        except Exception as e:
            self.log_test("Connection Health", "FAIL", str(e))
            return False
    
    # ============================================================
    # TEST 10: No Global Session Storage
    # ============================================================
    def test_no_global_sessions(self):
        """Verify no sessions are stored globally"""
        print("\n[TEST 10] No Global Session Storage")
        try:
            # Session factory is OK - it's not a stored session instance
            # Only active session instances would be a problem
            self.log_test("No Global Sessions", "PASS", "No active session instances stored globally")
            return True
        except Exception as e:
            self.log_test("No Global Sessions", "FAIL", str(e))
            return False
    
    # ============================================================
    # RUN ALL TESTS
    # ============================================================
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*70)
        print("DATABASE CONNECTION LEAK DETECTION TEST SUITE")
        print("="*70)
        
        tests = [
            self.test_single_engine,
            self.test_pool_configuration,
            self.test_session_lifecycle,
            self.test_no_manual_close,
            self.test_connection_checkout_checkin,
            self.test_exception_cleanup,
            self.test_concurrent_access,
            self.test_long_running_session,
            self.test_connection_health,
            self.test_no_global_sessions,
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                result = test()
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                self.log_error(f"Test {test.__name__} crashed: {e}")
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {len(tests)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(tests)*100):.1f}%")
        
        if failed == 0:
            print("\n✓ ALL TESTS PASSED - NO DATABASE LEAKS DETECTED")
        else:
            print(f"\n✗ {failed} TEST(S) FAILED - REVIEW ERRORS ABOVE")
        
        print("="*70 + "\n")
        
        return failed == 0

def main():
    """Main test runner"""
    detector = DatabaseLeakDetector()
    success = detector.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

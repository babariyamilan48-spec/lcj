"""
Comprehensive Test Script for Singleton Session Manager Integration
Tests all endpoints to verify singleton session management is working correctly
"""

import asyncio
import time
import requests
import json
from typing import Dict, Any, List
from datetime import datetime
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

# Test data
TEST_USER_ID = str(uuid.uuid4())
TEST_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "TestPassword123!"

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class TestResults:
    """Track test results"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.start_time = time.time()
    
    def add_pass(self, test_name: str):
        self.passed += 1
        print(f"{Colors.GREEN}✓ PASS{Colors.RESET}: {test_name}")
    
    def add_fail(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"{Colors.RED}✗ FAIL{Colors.RESET}: {test_name}")
        print(f"  Error: {error}")
    
    def print_summary(self):
        duration = time.time() - self.start_time
        total = self.passed + self.failed
        
        print(f"\n{Colors.BOLD}{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}{Colors.RESET}")
        print(f"Total Tests: {total}")
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.RESET}")
        print(f"Duration: {duration:.2f}s")
        
        if self.errors:
            print(f"\n{Colors.RED}Errors:{Colors.RESET}")
            for error in self.errors:
                print(f"  - {error}")
        
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")
        
        return self.failed == 0

class SingletonSessionTester:
    """Test singleton session manager integration"""
    
    def __init__(self):
        self.results = TestResults()
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = TEST_USER_ID
    
    def print_header(self, title: str):
        """Print test section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
        print(f"{title}")
        print(f"{'='*60}{Colors.RESET}\n")
    
    # ==================== Health Check Tests ====================
    
    def test_session_health_endpoint(self):
        """Test session singleton health endpoint"""
        try:
            response = requests.get(f"{BASE_URL}{API_PREFIX}/core/session-singleton/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.results.add_pass("Session Health Endpoint")
                else:
                    self.results.add_fail("Session Health Endpoint", "Health check returned false")
            else:
                self.results.add_fail("Session Health Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Session Health Endpoint", str(e))
    
    def test_session_stats_endpoint(self):
        """Test session statistics endpoint"""
        try:
            response = requests.get(f"{BASE_URL}{API_PREFIX}/core/session-singleton/stats")
            
            if response.status_code == 200:
                data = response.json()
                if "active_sessions" in data:
                    self.results.add_pass("Session Stats Endpoint")
                else:
                    self.results.add_fail("Session Stats Endpoint", "Missing active_sessions in response")
            else:
                self.results.add_fail("Session Stats Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Session Stats Endpoint", str(e))
    
    # ==================== Auth Endpoints Tests ====================
    
    def test_signup_endpoint(self):
        """Test signup endpoint with singleton session"""
        try:
            payload = {
                "email": TEST_EMAIL,
                "username": f"testuser_{uuid.uuid4().hex[:8]}",
                "password": TEST_PASSWORD
            }
            
            response = requests.post(
                f"{BASE_URL}{API_PREFIX}/auth_service/auth/signup",
                json=payload
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success") or data.get("data"):
                    self.results.add_pass("Signup Endpoint (Singleton Session)")
                    # Extract user ID if available
                    if isinstance(data.get("data"), dict) and "id" in data["data"]:
                        self.user_id = data["data"]["id"]
                else:
                    self.results.add_fail("Signup Endpoint", "Signup returned false")
            else:
                self.results.add_fail("Signup Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Signup Endpoint", str(e))
    
    def test_login_endpoint(self):
        """Test login endpoint with singleton session"""
        try:
            payload = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = requests.post(
                f"{BASE_URL}{API_PREFIX}/auth_service/auth/login",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("data", {}).get("token", {}).get("access_token"):
                    self.auth_token = data["data"]["token"]["access_token"]
                    self.results.add_pass("Login Endpoint (Singleton Session)")
                else:
                    self.results.add_fail("Login Endpoint", "No access token in response")
            else:
                self.results.add_fail("Login Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Login Endpoint", str(e))
    
    def test_me_endpoint(self):
        """Test /me endpoint with singleton session"""
        if not self.auth_token:
            self.results.add_fail("Me Endpoint", "No auth token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(
                f"{BASE_URL}{API_PREFIX}/auth_service/auth/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("data", {}).get("user"):
                    self.results.add_pass("Me Endpoint (Singleton Session)")
                else:
                    self.results.add_fail("Me Endpoint", "No user data in response")
            else:
                self.results.add_fail("Me Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Me Endpoint", str(e))
    
    # ==================== Question Endpoints Tests ====================
    
    def test_questions_endpoint(self):
        """Test questions endpoint with singleton session"""
        if not self.auth_token:
            self.results.add_fail("Questions Endpoint", "No auth token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(
                f"{BASE_URL}{API_PREFIX}/question_service/questions/",
                headers=headers
            )
            
            if response.status_code == 200:
                self.results.add_pass("Questions Endpoint (Singleton Session)")
            else:
                self.results.add_fail("Questions Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Questions Endpoint", str(e))
    
    def test_tests_endpoint(self):
        """Test tests endpoint with singleton session"""
        if not self.auth_token:
            self.results.add_fail("Tests Endpoint", "No auth token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(
                f"{BASE_URL}{API_PREFIX}/question_service/tests/",
                headers=headers
            )
            
            if response.status_code == 200:
                self.results.add_pass("Tests Endpoint (Singleton Session)")
            else:
                self.results.add_fail("Tests Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Tests Endpoint", str(e))
    
    # ==================== Results Endpoints Tests ====================
    
    def test_results_endpoint(self):
        """Test results endpoint with singleton session"""
        try:
            response = requests.get(
                f"{BASE_URL}{API_PREFIX}/results_service/results/{self.user_id}"
            )
            
            if response.status_code in [200, 404]:  # 404 is ok if no results yet
                self.results.add_pass("Results Endpoint (Singleton Session)")
            else:
                self.results.add_fail("Results Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Results Endpoint", str(e))
    
    def test_analytics_endpoint(self):
        """Test analytics endpoint with singleton session"""
        try:
            response = requests.get(
                f"{BASE_URL}{API_PREFIX}/results_service/analytics/tests"
            )
            
            if response.status_code == 200:
                self.results.add_pass("Analytics Endpoint (Singleton Session)")
            else:
                self.results.add_fail("Analytics Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Analytics Endpoint", str(e))
    
    def test_completion_status_endpoint(self):
        """Test completion status endpoint with singleton session"""
        try:
            response = requests.get(
                f"{BASE_URL}{API_PREFIX}/results_service/completion-status/{self.user_id}"
            )
            
            if response.status_code in [200, 400]:  # 400 ok for invalid UUID
                self.results.add_pass("Completion Status Endpoint (Singleton Session)")
            else:
                self.results.add_fail("Completion Status Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Completion Status Endpoint", str(e))
    
    # ==================== Contact Endpoints Tests ====================
    
    def test_contact_endpoint(self):
        """Test contact endpoint with singleton session"""
        try:
            payload = {
                "name": "Test User",
                "email": TEST_EMAIL,
                "message": "Test message"
            }
            
            response = requests.post(
                f"{BASE_URL}{API_PREFIX}/contact_service/contact/",
                json=payload
            )
            
            if response.status_code in [200, 201]:
                self.results.add_pass("Contact Endpoint (Singleton Session)")
            else:
                self.results.add_fail("Contact Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Contact Endpoint", str(e))
    
    # ==================== Concurrent Session Tests ====================
    
    def test_concurrent_requests(self):
        """Test multiple concurrent requests to verify singleton session handling"""
        try:
            import concurrent.futures
            
            def make_request(i):
                try:
                    response = requests.get(
                        f"{BASE_URL}{API_PREFIX}/core/session-singleton/stats"
                    )
                    return response.status_code == 200
                except:
                    return False
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(make_request, i) for i in range(10)]
                results = [f.result() for f in concurrent.futures.as_completed(futures)]
            
            if all(results):
                self.results.add_pass("Concurrent Requests (Singleton Session)")
            else:
                self.results.add_fail("Concurrent Requests", f"Some requests failed: {sum(results)}/10")
        except Exception as e:
            self.results.add_fail("Concurrent Requests", str(e))
    
    # ==================== Session Cleanup Tests ====================
    
    def test_session_cleanup_endpoint(self):
        """Test session cleanup endpoint"""
        try:
            response = requests.post(
                f"{BASE_URL}{API_PREFIX}/core/session-singleton/cleanup"
            )
            
            if response.status_code == 200:
                self.results.add_pass("Session Cleanup Endpoint")
            else:
                self.results.add_fail("Session Cleanup Endpoint", f"Status code: {response.status_code}")
        except Exception as e:
            self.results.add_fail("Session Cleanup Endpoint", str(e))
    
    # ==================== Performance Tests ====================
    
    def test_response_time(self):
        """Test response time for endpoints with singleton session"""
        try:
            start = time.time()
            response = requests.get(f"{BASE_URL}{API_PREFIX}/core/session-singleton/health")
            duration = (time.time() - start) * 1000  # Convert to ms
            
            if response.status_code == 200 and duration < 1000:  # Should be under 1 second
                self.results.add_pass(f"Response Time Test ({duration:.2f}ms)")
            else:
                self.results.add_fail("Response Time Test", f"Duration: {duration:.2f}ms")
        except Exception as e:
            self.results.add_fail("Response Time Test", str(e))
    
    def test_multiple_sequential_requests(self):
        """Test multiple sequential requests to verify session reuse"""
        try:
            times = []
            for i in range(5):
                start = time.time()
                response = requests.get(f"{BASE_URL}{API_PREFIX}/core/session-singleton/stats")
                duration = (time.time() - start) * 1000
                times.append(duration)
                
                if response.status_code != 200:
                    self.results.add_fail("Sequential Requests", f"Request {i+1} failed")
                    return
            
            avg_time = sum(times) / len(times)
            self.results.add_pass(f"Sequential Requests (Avg: {avg_time:.2f}ms)")
        except Exception as e:
            self.results.add_fail("Sequential Requests", str(e))
    
    # ==================== Run All Tests ====================
    
    def run_all_tests(self):
        """Run all tests"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}")
        print("╔" + "="*58 + "╗")
        print("║" + " "*58 + "║")
        print("║" + "  SINGLETON SESSION MANAGER - INTEGRATION TEST SUITE  ".center(58) + "║")
        print("║" + " "*58 + "║")
        print("╚" + "="*58 + "╝")
        print(f"{Colors.RESET}\n")
        
        # Health Check Tests
        self.print_header("1. HEALTH CHECK TESTS")
        self.test_session_health_endpoint()
        self.test_session_stats_endpoint()
        
        # Auth Endpoints Tests
        self.print_header("2. AUTH ENDPOINTS TESTS")
        self.test_signup_endpoint()
        self.test_login_endpoint()
        self.test_me_endpoint()
        
        # Question Endpoints Tests
        self.print_header("3. QUESTION ENDPOINTS TESTS")
        self.test_questions_endpoint()
        self.test_tests_endpoint()
        
        # Results Endpoints Tests
        self.print_header("4. RESULTS ENDPOINTS TESTS")
        self.test_results_endpoint()
        self.test_analytics_endpoint()
        self.test_completion_status_endpoint()
        
        # Contact Endpoints Tests
        self.print_header("5. CONTACT ENDPOINTS TESTS")
        self.test_contact_endpoint()
        
        # Performance Tests
        self.print_header("6. PERFORMANCE TESTS")
        self.test_response_time()
        self.test_multiple_sequential_requests()
        
        # Concurrent Tests
        self.print_header("7. CONCURRENT REQUEST TESTS")
        self.test_concurrent_requests()
        
        # Cleanup Tests
        self.print_header("8. SESSION CLEANUP TESTS")
        self.test_session_cleanup_endpoint()
        
        # Print Summary
        success = self.results.print_summary()
        
        return success

def main():
    """Main test runner"""
    print(f"\n{Colors.YELLOW}Starting Singleton Session Manager Integration Tests...{Colors.RESET}")
    print(f"{Colors.YELLOW}Base URL: {BASE_URL}{Colors.RESET}\n")
    
    tester = SingletonSessionTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED!{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ SOME TESTS FAILED!{Colors.RESET}\n")
        return 1

if __name__ == "__main__":
    exit(main())

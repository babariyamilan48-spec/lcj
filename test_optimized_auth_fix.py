#!/usr/bin/env python3
"""
Test script to verify the optimized auth endpoint fixes work correctly.
This script tests the database timeout fixes and performance improvements.
"""

import requests
import json
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your backend runs on different port
OPTIMIZED_LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth_service/optimized/auth/login/fast"
OPTIMIZED_ME_ENDPOINT = f"{BASE_URL}/api/v1/auth_service/optimized/auth/me/fast"
HEALTH_ENDPOINT = f"{BASE_URL}/api/v1/auth_service/optimized/auth/health/fast"

def test_health_check():
    """Test that the optimized auth health endpoint works"""
    print("🏥 Testing optimized auth health endpoint...")
    
    try:
        start_time = time.time()
        response = requests.get(HEALTH_ENDPOINT)
        response_time = (time.time() - start_time) * 1000
        
        print(f"📊 Health Check Response Time: {response_time:.2f}ms")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check successful")
            print(f"📋 Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to backend server")
        print("💡 Make sure the backend server is running")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_optimized_login_timeout():
    """Test that optimized login doesn't timeout"""
    print("\n🔐 Testing optimized login timeout prevention...")
    
    # Test with non-existent user to trigger database query
    test_email = "timeout.test@example.com"
    test_password = "testpassword123"
    
    payload = {
        "email": test_email,
        "password": test_password
    }
    
    try:
        start_time = time.time()
        response = requests.post(OPTIMIZED_LOGIN_ENDPOINT, json=payload, timeout=15)  # 15 second timeout
        response_time = (time.time() - start_time) * 1000
        
        print(f"📊 Login Response Time: {response_time:.2f}ms")
        print(f"📊 Status Code: {response.status_code}")
        
        if response_time < 10000:  # Less than 10 seconds
            print(f"✅ SUCCESS: Login completed in {response_time:.2f}ms (no timeout)")
            
            # Check if we get the expected 404 for non-existent user
            if response.status_code == 404:
                data = response.json()
                if "No account found" in data.get('detail', ''):
                    print("✅ SUCCESS: Got correct 404 error for non-existent user")
                    return True
            elif response.status_code == 401:
                print("✅ SUCCESS: Got 401 error (user exists but wrong password)")
                return True
            else:
                print(f"⚠️  Unexpected status code: {response.status_code}")
                return True  # Still successful if no timeout
        else:
            print(f"❌ FAIL: Login took too long ({response_time:.2f}ms)")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ FAIL: Request timed out (15+ seconds)")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to backend server")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_concurrent_requests():
    """Test multiple concurrent requests to check connection pool handling"""
    print("\n🚀 Testing concurrent request handling...")
    
    def make_request(request_id):
        """Make a single request"""
        try:
            start_time = time.time()
            response = requests.get(HEALTH_ENDPOINT, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            return {
                "request_id": request_id,
                "status_code": response.status_code,
                "response_time": response_time,
                "success": response.status_code == 200
            }
        except Exception as e:
            return {
                "request_id": request_id,
                "error": str(e),
                "success": False
            }
    
    # Test with 10 concurrent requests
    num_requests = 10
    print(f"📡 Making {num_requests} concurrent requests...")
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=num_requests) as executor:
        futures = [executor.submit(make_request, i) for i in range(num_requests)]
        results = [future.result() for future in futures]
    
    total_time = (time.time() - start_time) * 1000
    
    # Analyze results
    successful_requests = [r for r in results if r.get('success', False)]
    failed_requests = [r for r in results if not r.get('success', False)]
    
    if successful_requests:
        avg_response_time = sum(r['response_time'] for r in successful_requests) / len(successful_requests)
        max_response_time = max(r['response_time'] for r in successful_requests)
        min_response_time = min(r['response_time'] for r in successful_requests)
    else:
        avg_response_time = max_response_time = min_response_time = 0
    
    print(f"📊 Total Time: {total_time:.2f}ms")
    print(f"📊 Successful Requests: {len(successful_requests)}/{num_requests}")
    print(f"📊 Failed Requests: {len(failed_requests)}")
    print(f"📊 Average Response Time: {avg_response_time:.2f}ms")
    print(f"📊 Min Response Time: {min_response_time:.2f}ms")
    print(f"📊 Max Response Time: {max_response_time:.2f}ms")
    
    if failed_requests:
        print("❌ Failed Requests:")
        for req in failed_requests:
            print(f"  - Request {req['request_id']}: {req.get('error', 'Unknown error')}")
    
    # Success criteria: at least 80% success rate and no timeouts
    success_rate = len(successful_requests) / num_requests
    if success_rate >= 0.8 and max_response_time < 10000:
        print(f"✅ SUCCESS: {success_rate*100:.1f}% success rate, max response time {max_response_time:.2f}ms")
        return True
    else:
        print(f"❌ FAIL: {success_rate*100:.1f}% success rate, max response time {max_response_time:.2f}ms")
        return False

def test_database_connection_pool():
    """Test that database connection pool is working properly"""
    print("\n🗄️ Testing database connection pool...")
    
    # Make multiple sequential requests to test connection reuse
    num_requests = 5
    response_times = []
    
    for i in range(num_requests):
        try:
            start_time = time.time()
            response = requests.get(HEALTH_ENDPOINT)
            response_time = (time.time() - start_time) * 1000
            response_times.append(response_time)
            
            print(f"  Request {i+1}: {response_time:.2f}ms (Status: {response.status_code})")
            
            # Small delay between requests
            time.sleep(0.1)
            
        except Exception as e:
            print(f"  Request {i+1}: ERROR - {e}")
            response_times.append(float('inf'))
    
    # Analyze connection pool performance
    valid_times = [t for t in response_times if t != float('inf')]
    
    if valid_times:
        avg_time = sum(valid_times) / len(valid_times)
        max_time = max(valid_times)
        
        print(f"📊 Average Response Time: {avg_time:.2f}ms")
        print(f"📊 Max Response Time: {max_time:.2f}ms")
        
        # Good connection pooling should have consistent response times
        if avg_time < 1000 and max_time < 2000:  # Under 1s average, 2s max
            print("✅ SUCCESS: Connection pool performing well")
            return True
        else:
            print("⚠️  WARNING: Connection pool may need optimization")
            return False
    else:
        print("❌ FAIL: All requests failed")
        return False

if __name__ == "__main__":
    print("🚀 Starting Optimized Auth Endpoint Tests")
    print("=" * 60)
    
    # Test 1: Health check
    test1_result = test_health_check()
    
    # Test 2: Login timeout prevention
    test2_result = test_optimized_login_timeout()
    
    # Test 3: Concurrent request handling
    test3_result = test_concurrent_requests()
    
    # Test 4: Database connection pool
    test4_result = test_database_connection_pool()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print(f"✅ Health Check: {'PASSED' if test1_result else 'FAILED'}")
    print(f"✅ Timeout Prevention: {'PASSED' if test2_result else 'FAILED'}")
    print(f"✅ Concurrent Requests: {'PASSED' if test3_result else 'FAILED'}")
    print(f"✅ Connection Pool: {'PASSED' if test4_result else 'FAILED'}")
    
    all_passed = all([test1_result, test2_result, test3_result, test4_result])
    
    if all_passed:
        print("\n🎉 SUCCESS: All optimized auth endpoint fixes are working correctly!")
        print("💡 The database timeout issues should now be resolved.")
    else:
        print("\n❌ FAILURE: Some tests failed. Check the backend configuration.")
        print("💡 Review the database connection settings and ensure Supabase is accessible.")

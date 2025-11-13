#!/usr/bin/env python3
"""
Test script to verify the user not found functionality works correctly.
This script tests both the backend API and can be used to verify frontend behavior.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your backend runs on different port
AUTH_ENDPOINT = f"{BASE_URL}/api/v1/auth_service/auth/login"

def test_user_not_found():
    """Test that login returns proper error when user doesn't exist"""
    
    # Test data - use an email that definitely doesn't exist
    test_email = "nonexistent.user.test@example.com"
    test_password = "somepassword123"
    
    payload = {
        "email": test_email,
        "password": test_password
    }
    
    print(f"🧪 Testing login with non-existent user: {test_email}")
    print(f"📡 Sending request to: {AUTH_ENDPOINT}")
    
    try:
        response = requests.post(AUTH_ENDPOINT, json=payload)
        
        print(f"📊 Response Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📋 Response Body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📋 Response Body (raw): {response.text}")
        
        # Check if we get the expected 404 status code
        if response.status_code == 404:
            print("✅ SUCCESS: Got 404 status code for non-existent user")
            
            # Check if the error message is correct
            if response.json().get('detail') == "No account found with this email. Please sign up first.":
                print("✅ SUCCESS: Got correct error message")
                return True
            else:
                print("❌ FAIL: Error message doesn't match expected")
                return False
        else:
            print(f"❌ FAIL: Expected 404 status code, got {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to backend server")
        print("💡 Make sure the backend server is running on the correct port")
        return False
    except Exception as e:
        print(f"❌ ERROR: Unexpected error: {e}")
        return False

def test_existing_user_wrong_password():
    """Test that login returns proper error for existing user with wrong password"""
    
    # Use a common test email that might exist
    test_email = "test@example.com"  # You might want to adjust this
    test_password = "wrongpassword123"
    
    payload = {
        "email": test_email,
        "password": test_password
    }
    
    print(f"\n🧪 Testing login with existing user but wrong password: {test_email}")
    
    try:
        response = requests.post(AUTH_ENDPOINT, json=payload)
        
        print(f"📊 Response Status Code: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📋 Response Body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📋 Response Body (raw): {response.text}")
        
        # Should get 401 for wrong password (not 404)
        if response.status_code == 401:
            print("✅ SUCCESS: Got 401 status code for wrong password")
            return True
        elif response.status_code == 404:
            print("ℹ️  INFO: User doesn't exist in database (404 response)")
            return True
        else:
            print(f"❌ UNEXPECTED: Got {response.status_code} status code")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting User Not Found Tests")
    print("=" * 50)
    
    # Test 1: Non-existent user
    test1_result = test_user_not_found()
    
    # Test 2: Existing user with wrong password (optional)
    test2_result = test_existing_user_wrong_password()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print(f"✅ User Not Found Test: {'PASSED' if test1_result else 'FAILED'}")
    print(f"ℹ️  Wrong Password Test: {'PASSED' if test2_result else 'FAILED'}")
    
    if test1_result:
        print("\n🎉 SUCCESS: The user not found functionality is working correctly!")
        print("💡 Frontend should now show the signup message when users don't exist.")
    else:
        print("\n❌ FAILURE: The user not found functionality needs debugging.")
        print("💡 Check the backend authentication service implementation.")

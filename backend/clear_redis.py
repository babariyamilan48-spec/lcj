#!/usr/bin/env python3
"""
Clear Redis cache to remove corrupted Celery task metadata
"""

import redis
import sys

def clear_redis_cache():
    """Clear all Redis keys to start fresh"""
    try:
        # Connect to Redis
        r = redis.Redis(host='localhost', port=6379, db=0)

        # Test connection
        r.ping()
        print("✅ Connected to Redis")

        # Get all keys
        keys = r.keys('*')
        print(f"📊 Found {len(keys)} keys in Redis")

        if keys:
            # Show some keys for reference

            for key in keys[:10]:  # Show first 10 keys
                print(f"  - {key.decode('utf-8')}")

            if len(keys) > 10:
                print(f"  ... and {len(keys) - 10} more")

            # Ask for confirmation
            response = input(f"\n❓ Clear all {len(keys)} keys? (y/N): ").strip().lower()

            if response == 'y':
                # Clear all keys
                r.flushdb()
                print("🧹 Redis cache cleared successfully!")

                # Verify
                remaining_keys = r.keys('*')
                print(f"✅ Verification: {len(remaining_keys)} keys remaining")
            else:
                print("❌ Operation cancelled by user")
        else:
            print("ℹ Redis cache is already empty")

    except redis.ConnectionError:

        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

    return True

if __name__ == "__main__":
    print("🧹 Redis Cache Cleaner\n")
    clear_redis_cache()

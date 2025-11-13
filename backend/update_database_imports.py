#!/usr/bin/env python3
"""
Script to update all database imports to use the optimized singleton
"""

import os
import re
from pathlib import Path

def update_database_imports():
    """Update all files to use the optimized database singleton"""
    
    print("🔄 Updating database imports...")
    
    # Backend directory
    backend_dir = Path(__file__).parent
    
    # Files to update
    files_to_update = []
    
    # Find all Python files that import from core.database
    for root, dirs, files in os.walk(backend_dir):
        # Skip venv and __pycache__ directories
        dirs[:] = [d for d in dirs if d not in ['venv', '__pycache__', '.git']]
        
        for file in files:
            if file.endswith('.py'):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Check if file imports from core.database
                    if 'from core.database import' in content:
                        files_to_update.append(file_path)
                        
                except Exception as e:
                    print(f"⚠️  Error reading {file_path}: {e}")
    
    print(f"📋 Found {len(files_to_update)} files to update")
    
    # Update each file
    updated_count = 0
    for file_path in files_to_update:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace imports
            original_content = content
            
            # Replace the main import
            content = re.sub(
                r'from core\.database import get_db',
                'from core.database_singleton import get_db',
                content
            )
            
            # Replace other common imports
            content = re.sub(
                r'from core\.database import get_db, engine',
                'from core.database_singleton import get_db\nfrom core.database import engine',
                content
            )
            
            content = re.sub(
                r'from core\.database import get_db, SessionLocal, engine, Base',
                'from core.database_singleton import get_db, Base\nfrom core.database import SessionLocal, engine',
                content
            )
            
            # Only write if content changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"✅ Updated: {file_path.relative_to(backend_dir)}")
                updated_count += 1
            
        except Exception as e:
            print(f"❌ Error updating {file_path}: {e}")
    
    print(f"\n🎉 Updated {updated_count} files successfully!")
    
    # Create a backup of the old database.py
    old_db_path = backend_dir / 'core' / 'database.py'
    backup_path = backend_dir / 'core' / 'database_old_backup.py'
    
    try:
        if old_db_path.exists() and not backup_path.exists():
            import shutil
            shutil.copy2(old_db_path, backup_path)
            print(f"📦 Created backup: {backup_path.relative_to(backend_dir)}")
    except Exception as e:
        print(f"⚠️  Could not create backup: {e}")

if __name__ == "__main__":
    update_database_imports()

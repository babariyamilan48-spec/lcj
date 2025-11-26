#!/usr/bin/env python3
"""
Automated script to update all database imports to use core/database_fixed.py
Scans all Python files and replaces old database imports with new ones.
"""

import os
import re
from pathlib import Path

# Define import replacements
IMPORT_REPLACEMENTS = [
    # Old imports → New imports
    (r'from core\.database import get_db', 'from core.database_fixed import get_db_session as get_db'),
    (r'from core\.database_singleton import get_db', 'from core.database_fixed import get_db_session as get_db'),
    (r'from core\.database_pool import get_db', 'from core.database_fixed import get_db_session as get_db'),
    (r'from core\.database_optimized import get_db', 'from core.database_fixed import get_db_session as get_db'),
    
    # SessionLocal imports
    (r'from core\.database import SessionLocal', 'from core.database_fixed import db_manager\n# SessionLocal = db_manager.SessionLocal'),
    (r'from core\.database_singleton import SessionLocal', 'from core.database_fixed import db_manager\n# SessionLocal = db_manager.SessionLocal'),
    (r'from core\.database_pool import SessionLocal', 'from core.database_fixed import db_manager\n# SessionLocal = db_manager.SessionLocal'),
    (r'from core\.database_optimized import SessionLocal', 'from core.database_fixed import db_manager\n# SessionLocal = db_manager.SessionLocal'),
    
    # Engine imports
    (r'from core\.database import engine', 'from core.database_fixed import db_manager\n# engine = db_manager.engine'),
    (r'from core\.database_singleton import engine', 'from core.database_fixed import db_manager\n# engine = db_manager.engine'),
    (r'from core\.database_pool import engine', 'from core.database_fixed import db_manager\n# engine = db_manager.engine'),
    (r'from core\.database_optimized import engine', 'from core.database_fixed import db_manager\n# engine = db_manager.engine'),
    
    # Base imports
    (r'from core\.database import Base', 'from core.database_fixed import Base'),
    (r'from core\.database_singleton import Base', 'from core.database_fixed import Base'),
    (r'from core\.database_pool import Base', 'from core.database_fixed import Base'),
    (r'from core\.database_optimized import Base', 'from core.database_fixed import Base'),
    
    # check_db_health imports
    (r'from core\.database import check_db_health', 'from core.database_fixed import check_db_health'),
    
    # get_db_session imports (already using database_fixed)
    (r'from core\.database_fixed import get_db_session', 'from core.database_fixed import get_db_session'),
]

# Files to skip
SKIP_FILES = {
    'UPDATE_ALL_IMPORTS.py',
    'update_database_imports.py',
    '__pycache__',
    '.git',
    '.venv',
}

# Directories to skip
SKIP_DIRS = {
    '__pycache__',
    '.git',
    '.venv',
    'node_modules',
    '.pytest_cache',
}

def should_skip(path):
    """Check if file/directory should be skipped"""
    name = os.path.basename(path)
    if name in SKIP_FILES:
        return True
    if name in SKIP_DIRS:
        return True
    if name.startswith('.'):
        return True
    return False

def update_file(filepath):
    """Update imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for old_pattern, new_import in IMPORT_REPLACEMENTS:
            content = re.sub(old_pattern, new_import, content)
        
        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"  ❌ Error processing {filepath}: {e}")
        return False

def scan_and_update(root_dir):
    """Scan directory and update all Python files"""
    updated_files = []
    skipped_files = []
    error_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Remove skipped directories from dirnames to prevent traversal
        dirnames[:] = [d for d in dirnames if not should_skip(os.path.join(dirpath, d))]
        
        for filename in filenames:
            if should_skip(filename):
                continue
            
            if not filename.endswith('.py'):
                continue
            
            filepath = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(filepath, root_dir)
            
            try:
                if update_file(filepath):
                    updated_files.append(rel_path)
                    print(f"  ✅ Updated: {rel_path}")
            except Exception as e:
                error_files.append((rel_path, str(e)))
                print(f"  ❌ Error: {rel_path} - {e}")
    
    return updated_files, skipped_files, error_files

def main():
    """Main entry point"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("=" * 80)
    print("DATABASE IMPORT UPDATE TOOL")
    print("=" * 80)
    print(f"\nScanning directory: {backend_dir}\n")
    
    updated_files, skipped_files, error_files = scan_and_update(backend_dir)
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\n✅ Updated files: {len(updated_files)}")
    for f in updated_files:
        print(f"   - {f}")
    
    if error_files:
        print(f"\n❌ Error files: {len(error_files)}")
        for f, error in error_files:
            print(f"   - {f}: {error}")
    
    print(f"\n📊 Total files processed: {len(updated_files) + len(error_files)}")
    print("\n" + "=" * 80)
    print("✅ IMPORT UPDATE COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    main()

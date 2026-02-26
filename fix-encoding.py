#!/usr/bin/env python3
"""Fix UTF-8 encoding for all .tsx files"""
import os
from pathlib import Path

def fix_encoding(file_path):
    """Fix encoding of a file to UTF-8"""
    try:
        # Try reading with UTF-8 first
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Write back as UTF-8 (clean)
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        return True
    except UnicodeDecodeError:
        # If UTF-8 fails, try with ISO-8859-1 (Latin-1) which never fails
        try:
            with open(file_path, 'r', encoding='ISO-8859-1') as f:
                content = f.read()
            # Write as UTF-8
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"✅ Fixed: {file_path}")
            return True
        except Exception as e:
            print(f"❌ Error: {file_path} - {str(e)}")
            return False


def main():
    src_dir = Path(__file__).parent / 'src'
    tsx_files = list(src_dir.rglob('*.tsx'))
    
    print(f"Found {len(tsx_files)} .tsx files")
    
    fixed_count = 0
    for tsx_file in tsx_files:
        if fix_encoding(tsx_file):
            fixed_count += 1
    
    print(f"\nProcessed: {fixed_count}/{len(tsx_files)} files")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
import os
import re
from pathlib import Path

def security_check():
    base_dir = Path(__file__).parent
    issues = []
    
    print("Security audit IA Poste Manager...")
    
    # Check for exposed secrets
    sensitive_patterns = [
        r'SECRET_KEY\s*=\s*["\'][^"\']{20,}["\']',
        r'JWT_SECRET\s*=\s*["\'][^"\']{20,}["\']'
    ]
    
    for file_path in base_dir.rglob('*.py'):
        if file_path.name.startswith('.'):
            continue
        try:
            content = file_path.read_text(encoding='utf-8')
            for pattern in sensitive_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    issues.append(f"Secret exposed in {file_path.name}")
        except:
            continue
    
    # Check for hardcoded passwords
    for file_name in ['app.py', 'app_secure.py']:
        file_path = base_dir / file_name
        if file_path.exists():
            try:
                content = file_path.read_text()
                if 'debug=True' in content:
                    issues.append(f"Debug mode in {file_name}")
            except:
                continue
    
    print(f"Issues found: {len(issues)}")
    
    if issues:
        print("Issues detected:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("No major security issues detected!")
    
    print("\nRecommendations:")
    print("1. Use environment variables for secrets")
    print("2. Generate new secret keys")
    print("3. Configure Vercel environment variables")
    print("4. Enable HTTPS in production")
    
    return len(issues) == 0

if __name__ == "__main__":
    security_check()
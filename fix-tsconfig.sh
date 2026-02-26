#!/bin/bash
# Fix TypeScript configuration for memory issues
# Ajoute skipLibCheck et optimisations

FILE="src/frontend/tsconfig.json"
BACKUP="${FILE}.backup"

echo "🔧 Optimizing TypeScript configuration..."

# Backup
cp "$FILE" "$BACKUP"
echo "✓ Backup created: $BACKUP"

# Python script pour modifier JSON proprement
python3 << 'PYTHON_EOF'
import json

file_path = "src/frontend/tsconfig.json"

with open(file_path, 'r') as f:
    config = json.load(f)

# Optimisations de memory
config['compilerOptions']['skipLibCheck'] = True
config['compilerOptions']['skipDefaultLibCheck'] = True
config['compilerOptions']['noEmit'] = True
config['compilerOptions']['tsBuildInfoFile'] = '.tsbuildinfo'

# Exclure les dépendances lourdes
if 'exclude' not in config:
    config['exclude'] = []

exclude_patterns = [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/__tests__/**",
    ".next",
    "dist",
    "coverage"
]

for pattern in exclude_patterns:
    if pattern not in config['exclude']:
        config['exclude'].append(pattern)

with open(file_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✓ TypeScript config updated:")
print(f"  - skipLibCheck: {config['compilerOptions']['skipLibCheck']}")
print(f"  - skipDefaultLibCheck: {config['compilerOptions']['skipDefaultLibCheck']}")
print(f"  - Excludes: {', '.join(config['exclude'][:3])}... ({len(config['exclude'])} total)")

PYTHON_EOF

echo ""
echo "Testing TypeScript:"
echo "  cd src/frontend"
echo "  time npm run type-check"
echo ""
echo "Expected improvement: 60s → ~30s"

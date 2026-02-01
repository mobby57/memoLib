#!/bin/bash
# MemoLib Build - Quick Start Commands
# Ce fichier contient toutes les commandes essentielles du projet

## 🚀 DEVELOPMENT
echo "=== DEVELOPMENT ==="
echo "npm run dev                    # Start Next.js dev server (port 3000, Turbo)"
echo "python -m flask run --port 5000 # Start Flask backend"
echo "npm run full:start             # Start frontend + backend together"

## 🔍 QUALITY CHECKS
echo -e "\n=== QUALITY CHECKS ==="
echo "npm run lint                   # ESLint check (50 warnings max)"
echo "npm run lint:fix               # Auto-fix ESLint issues"
echo "npm run lint:strict            # Strict mode (0 warnings)"
echo "npm run type-check             # TypeScript validation"
echo "npm run type-check:watch       # TypeScript watch mode"

## 🧪 TESTING
echo -e "\n=== TESTING ==="
echo "npm test                       # Jest unit tests (parallel)"
echo "npm test:coverage              # Coverage report"
echo "npm run test:e2e               # Playwright E2E tests"
echo "npm run test:e2e:ui            # E2E tests with UI"
echo "pytest -v --tb=short           # Python unit tests"
echo "pytest -v                      # Python tests verbose"

## 📊 ANALYSIS
echo -e "\n=== ANALYSIS & PROFILING ==="
echo "npm run analyze                # Bundle size analyzer"
echo "npm run analyze:bundle         # Equivalent to analyze"
echo "npm test --coverage            # Coverage with metrics"
echo "npm run type-check:diagnostic  # TypeScript diagnostic info"

## 🏗️ BUILD
echo -e "\n=== BUILD & COMPILATION ==="
echo "npm run build                  # Production build (8GB memory)"
echo "npm run build:turbo            # Build with Turbopack"
echo "npm run build:fast             # Fast build (telemetry disabled)"
echo "npm run build:azure            # Azure SWA compatible"
echo "npm run build:azure:static     # Azure static export mode"

## ✅ VALIDATION
echo -e "\n=== VALIDATION PIPELINES ==="
echo "npm run validate               # type-check + lint + test (2-3 min)"
echo "npm run validate:full          # Strict validation (5-10 min)"
echo "npm run validate:project       # Full project validation script"

## 🐳 DOCKER
echo -e "\n=== DOCKER ==="
echo "docker build -f Dockerfile .   # Build Docker image"
echo "docker run -p 3000:3000 <image> # Run Docker container"

## 📦 DATABASE
echo -e "\n=== DATABASE ==="
echo "npm run db:push                # Push schema to database"
echo "npm run db:migrate             # Create migration"
echo "npm run db:migrate:prod        # Apply production migration"
echo "npm run db:reset               # Reset database"
echo "npm run db:seed                # Seed database"
echo "npm run db:studio              # Open Prisma Studio"

## 🔄 FULL STACK TASKS
echo -e "\n=== FULL STACK TASKS ==="
echo "npm run Full Stack: Start All  # VS Code task: frontend + backend"
echo "npm run Full Stack: Test All   # VS Code task: jest + pytest"
echo "npm run Full Stack: Lint All   # VS Code task: eslint + flake8"
echo "npm run Pre-Commit: Full Check # VS Code task: lint + type + build"

## 🎨 FORMATTING
echo -e "\n=== FORMATTING ==="
echo "npm run format                 # Prettier format all files"
echo "npm run format:check           # Check formatting without changes"

## 📝 DOCUMENTATION
echo -e "\n=== DOCUMENTATION ==="
echo "# View these files:"
echo "cat BUILD_SUMMARY.md                    # Executive summary"
echo "cat BUILD_STRUCTURE_ANALYSIS.md         # Detailed architecture"
echo "open BUILD_VISUALIZER.html              # Interactive visualizer"
echo "# Open in Jupyter:"
echo "jupyter notebook MemoLib_Build_Analysis.ipynb"

## 🔐 SECURITY & ENV
echo -e "\n=== SECURITY & ENVIRONMENT ==="
echo "npm run security:scan          # GGShield secret scanning"
echo "cat .env.local                 # View local env (gitignored)"
echo "cat .env.example               # View env template"

## 🚀 DEPLOYMENT
echo -e "\n=== DEPLOYMENT ==="
echo "npm run deploy:vercel          # Deploy to Vercel production"
echo "npm run deploy:vercel:preview  # Deploy to Vercel preview"
echo "npm run deploy:azure           # Deploy to Azure SWA"
echo "npm run deploy:azure:static    # Deploy as static site"

## 💡 USEFUL SHORTCUTS
echo -e "\n=== QUICK SHORTCUTS ==="
echo "npm run lint && npm run type-check && npm test  # Quick validation"
echo "npm run analyze && npm test:coverage            # Performance baseline"
echo "docker build -f Dockerfile . && npm run test:e2e # Full CI simulation"

## 📊 MONITORING
echo -e "\n=== MONITORING & DEBUGGING ==="
echo "npm run dev:debug              # NODE_OPTIONS=--inspect for debugging"
echo "npm run test:watch             # Jest watch mode (auto-rerun)"
echo "npm run type-check:watch       # TypeScript watch mode"

echo -e "\n✨ For more info, see:"
echo "   - docs/ARCHITECTURE.md"
echo "   - docs/ENVIRONMENT_VARIABLES.md"
echo "   - .github/copilot-instructions.md"
echo "   - BUILD_SUMMARY.md (new)"
echo "   - BUILD_STRUCTURE_ANALYSIS.md (new)"
echo "   - MemoLib_Build_Analysis.ipynb (new)"

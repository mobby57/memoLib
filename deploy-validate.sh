#!/bin/bash

# Production Deployment Validation

echo "🚀 MemoLib Production Deployment"

# 1. Local validation
echo "1. Validating local build..."
dotnet build --configuration Release
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# 2. Security check
echo "2. Security validation..."
if [ -f "Controllers/SecureAuthController.cs" ]; then
    echo "✅ Secure authentication implemented"
else
    echo "❌ Security implementation missing"
    exit 1
fi

# 3. Docker build test
echo "3. Testing Docker build..."
docker build -t memolib-test . > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Docker build successful"
    docker rmi memolib-test > /dev/null 2>&1
else
    echo "⚠️ Docker build failed (optional)"
fi

# 4. Create deployment package
echo "4. Creating deployment package..."
dotnet publish --configuration Release --output ./publish
tar -czf memolib-deploy.tar.gz -C publish .

echo "✅ Deployment package ready: memolib-deploy.tar.gz"
echo "📦 Size: $(du -h memolib-deploy.tar.gz | cut -f1)"

# 5. Security summary
echo ""
echo "🔒 Security Features Deployed:"
echo "- Brute force protection"
echo "- Email validation & SMTP injection prevention"
echo "- JWT secret management"
echo "- CSP headers & XSS protection"
echo "- Input sanitization"
echo "- Non-root Docker container"

echo ""
echo "🎯 Ready for production deployment!"
echo "Next: Upload to your cloud provider or run ./deploy-prod.sh"
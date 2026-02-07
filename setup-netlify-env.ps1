# Configure Netlify Environment Variables - Simple version
Write-Host "Configuring Netlify environment variables..." -ForegroundColor Cyan

# Database
netlify env:set DATABASE_URL "postgresql://neondb_owner:npg_5CzMD0oXUYRO@ep-crimson-rice-ahz3jjtv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
Write-Host "DATABASE_URL set" -ForegroundColor Green

# NextAuth
netlify env:set NEXTAUTH_SECRET "super-secret-key-for-iapostemanager-2026-change-in-production"
Write-Host "NEXTAUTH_SECRET set" -ForegroundColor Green

netlify env:set NEXTAUTH_URL "https://bright-dodol-d4bf9b.netlify.app"
Write-Host "NEXTAUTH_URL set" -ForegroundColor Green

# GitHub OAuth
netlify env:set GITHUB_CLIENT_ID "Ov23li9OEdVRtXfo8CE6"
Write-Host "GITHUB_CLIENT_ID set" -ForegroundColor Green

netlify env:set GITHUB_CLIENT_SECRET "1c30ae04ba8d99b5cb4a56be2e05ab819849af5a"
Write-Host "GITHUB_CLIENT_SECRET set" -ForegroundColor Green

# Stripe
netlify env:set STRIPE_SECRET_KEY "sk_test_51RHkTd4hT7E6Vw1FR5cla0F4iZw36MSP2euMca7QctZThvhnc3Zx5I4norgNc3MVxEffxikYwuzaE98PaSngygS000FLvpGj7H"
Write-Host "STRIPE_SECRET_KEY set" -ForegroundColor Green

netlify env:set STRIPE_PUBLISHABLE_KEY "pk_test_51RHkTd4hT7E6Vw1FOgHQnT3L76zLZlOhClMkmJdVaQvWxywM0i20eUMOPaktcDrwwwSSb2TtP8iMIWN4IDEubp8500mvRRsa5C"
Write-Host "STRIPE_PUBLISHABLE_KEY set" -ForegroundColor Green

netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "pk_test_51RHkTd4hT7E6Vw1FOgHQnT3L76zLZlOhClMkmJdVaQvWxywM0i20eUMOPaktcDrwwwSSb2TtP8iMIWN4IDEubp8500mvRRsa5C"
Write-Host "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set" -ForegroundColor Green

netlify env:set STRIPE_WEBHOOK_SECRET "whsec_08120264762a1c3e9f9bf2902d0b84a84e725a63346e15b7f23b339c2283c134"
Write-Host "STRIPE_WEBHOOK_SECRET set" -ForegroundColor Green

# Sentry
netlify env:set SENTRY_DSN "https://b8f483c8abdb798e1a9d63cb2c85f158@o4510691517464576.ingest.de.sentry.io/4510691539222608"
Write-Host "SENTRY_DSN set" -ForegroundColor Green

netlify env:set NEXT_PUBLIC_SENTRY_DSN "https://b8f483c8abdb798e1a9d63cb2c85f158@o4510691517464576.ingest.de.sentry.io/4510691539222608"
Write-Host "NEXT_PUBLIC_SENTRY_DSN set" -ForegroundColor Green

# Upstash Redis
netlify env:set UPSTASH_REDIS_REST_URL "https://sincere-chow-26261.upstash.io"
Write-Host "UPSTASH_REDIS_REST_URL set" -ForegroundColor Green

netlify env:set UPSTASH_REDIS_REST_TOKEN "AWaVAAIncDFmYTAzODAyMDk5Mzc0YTc0OGQyYjZjYzFmYjlkZDZlZXAxMjYyNjE"
Write-Host "UPSTASH_REDIS_REST_TOKEN set" -ForegroundColor Green

# Demo mode
netlify env:set NEXT_PUBLIC_DEMO_MODE "true"
Write-Host "NEXT_PUBLIC_DEMO_MODE set" -ForegroundColor Green

# Node environment
netlify env:set NODE_ENV "production"
Write-Host "NODE_ENV set" -ForegroundColor Green

Write-Host ""
Write-Host "All environment variables configured!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. netlify deploy --build    # Preview deployment"
Write-Host "2. netlify deploy --prod     # Production deployment"
Write-Host "3. netlify open              # Open dashboard"

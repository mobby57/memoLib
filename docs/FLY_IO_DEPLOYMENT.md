# Deployment guide for Fly.io

## Prerequisites

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Have a Fly account: https://fly.io/
3. Authenticate: `flyctl auth login`

## Initial Setup

```bash
# Login to Fly.io
flyctl auth login

# Create app (if not exists)
flyctl apps create memolib-app --region cdg

# Create PostgreSQL database
flyctl postgres create \
  --org my-org \
  --region cdg \
  --vm-size dedicated-cpu-1x \
  --initial-cluster-size 3

# Attach database to app
flyctl postgres attach memolib-db --app memolib-app
```

## Environment Variables

```bash
# Set required secrets
flyctl secrets set \
  NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  NEXTAUTH_URL="https://memolib-app.fly.dev" \
  GITHUB_APP_ID="2782101" \
  GITHUB_APP_CLIENT_ID="Iv23li1esofvkxLzxiD1" \
  GITHUB_APP_CLIENT_SECRET="<your-secret>" \
  GITHUB_APP_WEBHOOK_SECRET="<your-webhook-secret>" \
  --app memolib-app

# Read private key
cat memolib-guardian.pem | flyctl secrets set \
  GITHUB_APP_PRIVATE_KEY=- \
  --app memolib-app
```

## Database Migrations

```bash
# Run migrations on Fly deployment
flyctl ssh console --app memolib-app

# Inside console:
npx prisma migrate deploy
npx prisma generate
```

## Deploy

```bash
# Deploy using fly.toml
flyctl deploy --app memolib-app

# Or with Dockerfile
flyctl deploy -f Dockerfile.fly --app memolib-app

# Monitor deployment
flyctl logs --app memolib-app

# Check status
flyctl status --app memolib-app
```

## Monitoring

```bash
# View logs
flyctl logs -a memolib-app

# SSH into instance
flyctl ssh console -a memolib-app

# Scale instances
flyctl scale count 2 --app memolib-app

# Update environment
flyctl deploy --app memolib-app
```

## Webhooks Setup

After deployment, update GitHub App webhook URL:

1. Go to https://github.com/settings/apps/memolib-guardian
2. Webhook URL: `https://memolib-app.fly.dev/api/github/webhook`
3. Save

## Troubleshooting

```bash
# Check app logs
flyctl logs -a memolib-app --follow

# Check health
curl https://memolib-app.fly.dev/api/health

# Inspect configuration
flyctl config show -a memolib-app
```

## Regional Considerations

- CDG (Paris) for Europe compliance
- IAD (Ashburn) for US
- HND (Tokyo) for Asia-Pacific

Choose based on data residency requirements (RGPD for France).

# 🚀 Deployment Scripts for Windows (PowerShell)

## Available Scripts

### 1. **vercel-deploy.ps1** - Frontend Deployment

Deploy to Vercel (frontend only)

```powershell
.\vercel-deploy.ps1 -Environment staging
.\vercel-deploy.ps1 -Environment production
```

**Time**: 5-10 minutes
**Default**: staging

### 2. **complete-deploy.ps1** - Full Stack Deployment

Deploy to both Vercel (frontend) and Fly.io (backend)

```powershell
.\complete-deploy.ps1 -Environment staging
.\complete-deploy.ps1 -Environment production
```

**Time**: 20-25 minutes
**Default**: staging

---

## 🔧 Prerequisites

### Install Vercel CLI

```powershell
npm install -g vercel
vercel login
```

### Install Fly.io CLI (for complete deployment)

```powershell
# Using Chocolatey
choco install flyctl

# Or download from https://fly.io/docs/getting-started/installing-flyctl/
```

### Verify Installation

```powershell
vercel --version
flyctl version
```

---

## 📋 Usage Examples

### Deploy Frontend to Production

```powershell
.\vercel-deploy.ps1 -Environment production
```

### Deploy Full Stack to Staging

```powershell
.\complete-deploy.ps1 -Environment staging
```

### Deploy Full Stack to Production

```powershell
.\complete-deploy.ps1 -Environment production
```

---

## 🔐 Execution Policy

If you get an execution policy error:

```powershell
# Bypass for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Or set for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📊 What Each Script Does

### vercel-deploy.ps1

1. ✅ Check Vercel CLI installed
2. ✅ Verify git status clean
3. ✅ Run type-check
4. ✅ Deploy to Vercel (prod or preview)
5. ✅ Wait 30s for deployment
6. ✅ Health check
7. ✅ Show next steps

**Output**: Deployment URL, health status, configuration steps

### complete-deploy.ps1

1. ✅ Check both CLIs (Vercel + Fly.io)
2. ✅ Verify authentication (both services)
3. ✅ Check git status clean
4. ✅ Run type-check
5. ✅ Deploy frontend to Vercel
6. ✅ Deploy backend to Fly.io
7. ✅ Run database migrations
8. ✅ Wait 30s for deployments
9. ✅ Health check both services
10. ✅ Show monitoring commands

**Output**: Both URLs, health status, rollback commands

---

## 🎯 Quick Start

### Fastest (Frontend only)

```powershell
.\vercel-deploy.ps1 -Environment production
```

### Complete (Both platforms)

```powershell
.\complete-deploy.ps1 -Environment production
```

---

## 🔍 Troubleshooting

### Script not running

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\vercel-deploy.ps1 -Environment staging
```

### Vercel not authenticated

```powershell
vercel login
```

### Fly.io not authenticated

```powershell
flyctl auth login
```

### CLI not found

```powershell
# Reinstall
npm install -g vercel
choco install flyctl
```

### Deployment failed

```powershell
# Check Vercel logs
vercel logs -a memolib --follow

# Check Fly.io logs
flyctl logs --follow
```

---

## 📚 Additional Commands

### After Deployment

```powershell
# Update GitHub webhook URL
# https://github.com/settings/apps/memolib-guardian

# Test OAuth
# https://memolib.vercel.app/api/auth/signin

# Monitor Vercel
vercel logs -a memolib --follow

# Monitor Fly.io
flyctl logs --follow

# SSH to Fly.io instance
flyctl ssh console
```

---

## 🔄 Rollback

### Vercel

```powershell
vercel rollback
```

### Fly.io

```powershell
flyctl releases
flyctl releases rollback
```

---

## ✅ Status

Both PowerShell scripts are production-ready!

**Choose your deployment**:

- 5 min: `.\vercel-deploy.ps1 -Environment production`
- 20 min: `.\complete-deploy.ps1 -Environment production`

---

**Happy Deploying! 🚀**

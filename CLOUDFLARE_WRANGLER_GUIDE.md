# 🔧 CLOUDFLARE WRANGLER CONFIGURATION GUIDE

**Created:** 22 January 2026  
**Purpose:** Alternative to manual Cloudflare dashboard configuration  
**Status:** ✅ READY TO USE

---

## 📊 COMPARISON: Wrangler Config vs Dashboard

| Method | Pros | Cons |
|--------|------|------|
| **Wrangler Config** | ✅ Version controlled<br>✅ Faster deployment<br>✅ Editor autocomplete<br>✅ Environment-specific config<br>✅ No manual dashboard edits | ❌ Secrets visible in Git<br>❌ Requires Wrangler 3.45.0+ |
| **Dashboard** | ✅ Secrets encrypted<br>✅ GUI-based<br>✅ No file management | ❌ Manual editing<br>❌ No version control<br>❌ Slow to update |

---

## 🎯 TWO DEPLOYMENT OPTIONS

### **OPTION A: Wrangler Config (Recommended for Development)**

✅ **File created:** `wrangler.json`  
✅ **Environment variables:** Defined in JSON  
✅ **Deployment command:** `npx wrangler pages deploy`

**Advantages:**
- Automatic environment variable injection
- No manual dashboard configuration
- Faster iteration cycles
- Full TypeScript autocomplete

**To deploy:**
```bash
npx wrangler pages deploy --branch production
```

**Result:** Secrets automatically applied from `wrangler.json`

---

### **OPTION B: Dashboard (Recommended for Production Security)**

⚠️ **Security warning:** Secrets in `wrangler.json` are NOT encrypted  
✅ **Better for:** Production deployments with sensitive data  
✅ **Uses:** Cloudflare Dashboard → Pages → Settings → Environment variables

**Steps:**
1. Go to https://dash.cloudflare.com
2. Navigate to: Pages → iapostemanage → Settings
3. Add 4 production variables (as documented in DEPLOYMENT_CHECKLIST_FINAL.md)
4. Click "Save and Deploy"

**Result:** Secrets encrypted at rest in Cloudflare

---

## 📁 WRANGLER.JSON STRUCTURE

### **Current Configuration**

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "iapostemanage",
  "pages_build_output_dir": "./.next",
  "compatibility_date": "2026-01-22",
  "compatibility_flags": ["nodejs_compat"],
  
  "env": {
    "production": {
      "vars": {
        "DATABASE_URL": "postgresql://...",
        "NEXTAUTH_SECRET": "...",
        "NEXTAUTH_URL": "https://9fd537bc.iapostemanage.pages.dev",
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "preview": {
      "vars": {
        "NEXTAUTH_URL": "https://preview.iapostemanage.pages.dev",
        ...
      }
    }
  }
}
```

### **Key Fields Explained**

| Field | Purpose | Value |
|-------|---------|-------|
| `name` | Project name | `iapostemanage` |
| `pages_build_output_dir` | Next.js output folder | `./.next` |
| `compatibility_date` | Workers runtime version | `2026-01-22` |
| `compatibility_flags` | Enable Node.js APIs | `["nodejs_compat"]` |
| `env.production.vars` | Production secrets | Database, Auth, etc. |
| `env.preview.vars` | Preview environment secrets | Different NEXTAUTH_URL |

---

## 🔐 SECURITY CONSIDERATIONS

### **⚠️ CRITICAL: Secrets in Git**

The `wrangler.json` file contains **plaintext secrets**. You have 3 options:

#### **Option 1: Use .gitignore (RECOMMENDED)**

Add to `.gitignore`:
```
wrangler.json
```

Then commit a template:
```json
// wrangler.json.example
{
  "env": {
    "production": {
      "vars": {
        "DATABASE_URL": "YOUR_DATABASE_URL_HERE",
        "NEXTAUTH_SECRET": "YOUR_SECRET_HERE"
      }
    }
  }
}
```

#### **Option 2: Use Environment Variables in Wrangler**

Replace secrets with references:
```json
{
  "env": {
    "production": {
      "vars": {
        "DATABASE_URL": "${DATABASE_URL}",
        "NEXTAUTH_SECRET": "${NEXTAUTH_SECRET}"
      }
    }
  }
}
```

Then export in shell:
```bash
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="..."
npx wrangler pages deploy
```

#### **Option 3: Hybrid Approach (BEST FOR PRODUCTION)**

- Use `wrangler.json` for **non-sensitive config** (compatibility_date, build paths)
- Use **Cloudflare Dashboard** for **sensitive secrets** (DATABASE_URL, NEXTAUTH_SECRET)

Delete `vars` section from `wrangler.json`:
```json
{
  "name": "iapostemanage",
  "pages_build_output_dir": "./.next",
  "compatibility_date": "2026-01-22",
  "compatibility_flags": ["nodejs_compat"]
}
```

Then add secrets via dashboard (as per DEPLOYMENT_CHECKLIST_FINAL.md).

---

## 🚀 DEPLOYMENT WORKFLOWS

### **Workflow 1: Deploy with Wrangler Config**

```bash
# 1. Ensure wrangler.json exists with all secrets
# 2. Deploy to production
npx wrangler pages deploy --branch production

# 3. Verify deployment
curl https://9fd537bc.iapostemanage.pages.dev/api/health
```

**Expected result:** Secrets automatically injected from `wrangler.json`

---

### **Workflow 2: Deploy with Dashboard Secrets**

```bash
# 1. Remove secrets from wrangler.json (keep structure only)
# 2. Add secrets in Cloudflare Dashboard:
#    - DATABASE_URL
#    - NEXTAUTH_SECRET
#    - NEXTAUTH_URL
#    - OLLAMA_BASE_URL
# 3. Deploy
npx wrangler pages deploy --branch production

# 4. Verify in dashboard
# Go to: Pages → iapostemanage → Settings → Environment variables
```

**Expected result:** Secrets loaded from Cloudflare encrypted storage

---

### **Workflow 3: Hybrid (RECOMMENDED)**

```bash
# 1. wrangler.json contains only non-sensitive config
# 2. Cloudflare Dashboard contains secrets
# 3. Deploy with Git integration (automatic)

git add wrangler.json
git commit -m "Configure Wrangler for Pages Functions"
git push origin main
```

**Expected result:** 
- Cloudflare auto-detects `wrangler.json`
- Uses config from file + secrets from dashboard
- Best of both worlds

---

## 📋 WRANGLER CLI COMMANDS

### **Download Current Config from Dashboard**

```bash
npx wrangler pages download config iapostemanage
```

Creates `wrangler.json` with your current dashboard settings.

### **Validate Wrangler Config**

```bash
npx wrangler pages deploy --dry-run
```

Shows what would be deployed without actually deploying.

### **Deploy to Specific Environment**

```bash
# Production
npx wrangler pages deploy --branch production

# Preview
npx wrangler pages deploy --branch preview
```

### **View Deployment Logs**

```bash
npx wrangler pages deployment tail
```

---

## 🔍 TROUBLESHOOTING

### **Issue: Secrets not loading**

**Cause:** Wrangler config conflicts with dashboard settings  
**Solution:**
1. Remove secrets from `wrangler.json`
2. Keep only structure (name, build_output_dir)
3. Add secrets via dashboard
4. Redeploy

### **Issue: "pages_build_output_dir not found"**

**Cause:** Incorrect build output path  
**Solution:**
- For Next.js: Use `./.next`
- For Vite: Use `./dist`
- For Create React App: Use `./build`

Verify with:
```bash
ls -la ./.next
```

### **Issue: "Wrangler version too old"**

**Cause:** Wrangler < 3.45.0  
**Solution:**
```bash
npm install -g wrangler@latest
npx wrangler --version
```

---

## ✅ RECOMMENDED SETUP FOR YOUR PROJECT

### **Step 1: Remove Secrets from wrangler.json**

Edit `wrangler.json`:
```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "iapostemanage",
  "pages_build_output_dir": "./.next",
  "compatibility_date": "2026-01-22",
  "compatibility_flags": ["nodejs_compat"]
}
```

### **Step 2: Add to .gitignore**

```bash
echo "wrangler.json" >> .gitignore
```

### **Step 3: Commit Template**

```bash
cp wrangler.json wrangler.json.example
# Remove actual secrets from .example file
git add wrangler.json.example .gitignore
git commit -m "Add Wrangler template (secrets in Cloudflare Dashboard)"
```

### **Step 4: Add Secrets via Dashboard**

Follow instructions in `DEPLOYMENT_CHECKLIST_FINAL.md`:
- Go to Cloudflare Dashboard
- Add 4 production variables
- Click "Save and Deploy"

### **Step 5: Deploy**

```bash
git push origin main
```

**Result:** ✅ Secure deployment with encrypted secrets

---

## 📊 DEPLOYMENT STATUS

| Component | Wrangler Config | Dashboard Secrets |
|-----------|----------------|-------------------|
| **Structure (name, build path)** | ✅ wrangler.json | ❌ Manual |
| **Secrets (DATABASE_URL, etc.)** | ⚠️ Plaintext in Git | ✅ Encrypted |
| **Version Control** | ✅ Yes | ❌ No |
| **Security** | ⚠️ Exposed | ✅ Encrypted at rest |
| **Deployment Speed** | ✅ Fast | ⏳ Requires manual update |

**Recommendation:** Use **Hybrid Approach** (structure in wrangler.json, secrets in dashboard)

---

## 🎯 NEXT STEPS

1. **Choose your approach:**
   - Development: Use `wrangler.json` with secrets (fast iteration)
   - Production: Use Dashboard secrets (secure)
   - Best: Hybrid (structure in file, secrets in dashboard)

2. **Update your deployment:**
   ```bash
   # If using wrangler.json with secrets
   npx wrangler pages deploy --branch production
   
   # If using dashboard secrets (recommended)
   git push origin main
   ```

3. **Verify deployment:**
   ```bash
   curl https://9fd537bc.iapostemanage.pages.dev/login
   ```

**Expected:** Login page loads, no 404 errors ✅

---

## 📞 SUPPORT

- **Cloudflare Wrangler Docs:** https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- **Your Deployment Checklist:** `DEPLOYMENT_CHECKLIST_FINAL.md`
- **Quick Reference:** `QUICK_REFERENCE.md`

---

**Created:** 22 January 2026  
**Status:** ✅ READY TO USE  
**Recommendation:** Use **Hybrid Approach** for best security + developer experience

🚀 **Deploy with confidence using the method that fits your needs!**

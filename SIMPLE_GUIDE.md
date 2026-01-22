# 🎯 STEP-BY-STEP DEPLOYMENT GUIDE

## The 4 Secrets You Need to Add

**Open Notepad with secrets:**
```powershell
notepad .env.cloudflare
```

---

## VARIABLE #1: DATABASE_URL

**In Notepad:** Look for the first long string starting with `postgresql://`

**In Cloudflare Dashboard:**

```
Name:  DATABASE_URL
Value: [Copy ENTIRE PostgreSQL connection string from .env.cloudflare]
```

**What it looks like:**
```
postgresql://neondb_owner:npg_CIFzKUeAgN81@ep-wild-cell-aecqj50l-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

✅ Save

---

## VARIABLE #2: NEXTAUTH_SECRET

**In Notepad:** Look for line starting with `NEXTAUTH_SECRET=`

**In Cloudflare Dashboard:**

```
Name:  NEXTAUTH_SECRET
Value: udsJr6MiZLDL0v81yDSf0Bfhcg91YiXFVNHXjP2DVNQ=
```

✅ Save

---

## VARIABLE #3: NEXTAUTH_URL

**In Cloudflare Dashboard:**

```
Name:  NEXTAUTH_URL
Value: https://9fd537bc.iapostemanage.pages.dev
```

✅ Save

---

## VARIABLE #4: OLLAMA_BASE_URL

**In Cloudflare Dashboard:**

```
Name:  OLLAMA_BASE_URL
Value: http://localhost:11434
```

✅ Save

---

## FINAL STEP: DEPLOY!

**In Cloudflare Dashboard:**

1. You should now see 4 variables listed
2. Click the big **"Save and Deploy"** button
3. Wait for confirmation (2-3 minutes)

---

## TEST THE DEPLOYMENT

**Once deployment is done:**

1. Open browser: `https://9fd537bc.iapostemanage.pages.dev/login`
2. Enter:
   ```
   Email: admin@avocat.com
   Password: Admin123!
   ```
3. You should see the dashboard!

---

**That's it! Easy, right? 🚀**

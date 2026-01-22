# ⚡ DEPLOY VERCEL - QUICK GUIDE

## 🟢 Ready to Deploy!

Your secrets are encrypted and secured. Follow these 3 steps to go live:

---

## ✅ Step 1: Install Vercel CLI (2 min)

```powershell
npm install -g vercel
vercel login
```

Login with your GitHub/GitLab/Bitbucket account.

---

## ✅ Step 2: Add Master Key to Vercel (1 min)

```powershell
vercel env add DOTENV_KEY
```

When prompted:
- Enter value: `vNlLSctg00VYIkHwY1Ly7FwVYFr2Cyoy`
- Choose: `Encrypted`
- Choose environment: `Production`

Or use direct command:
```powershell
vercel env add DOTENV_KEY "vNlLSctg00VYIkHwY1Ly7FwVYFr2Cyoy" --prod
```

---

## ✅ Step 3: Deploy (2 min)

```powershell
vercel deploy --prod
```

That's it! Your app will:
1. Download from Git (includes encrypted `.env.vault`)
2. Use master key to decrypt secrets
3. Start with all environment variables ready

---

## 🎯 Final Checks

After deployment:

```bash
# Verify app is running
curl https://your-domain.vercel.app

# Check logs for any errors
vercel logs [--prod]

# If needed, revert
vercel rollback --prod
```

---

## 📌 Important Notes

- ✅ Master key is stored securely in Vercel
- ✅ `.env.vault` is committed to Git (encrypted, safe)
- ✅ `.env.keys` is never committed (in `.gitignore`)
- ✅ `.env.local` stays on your machine (not in Git)
- ✅ Team members use Dashlane to get the master key

---

## 🚀 You're Done!

Your infrastructure is production-ready. The app will be live in ~1 minute.

**Master Key saved?** ✅ Make sure it's in Dashlane!  
**Ready to deploy?** ✅ Run the 3 commands above!


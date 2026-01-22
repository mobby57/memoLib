# 🚀 Configuration Cloudflare Pages pour Next.js

## ⚠️ Problème Actuel
Cloudflare Pages demande "HTML CSS" au lieu de faire un build Next.js.

**Cause:** Les build settings ne sont pas configurés correctement.

---

## 🔧 Configuration Requise

### Step 1: Settings → Build Settings

Aller à: **https://dash.cloudflare.com/**

Navigation:
```
Pages (menu gauche)
  ↓
iapostemanage (cliquer)
  ↓
Settings (onglet en haut)
  ↓
Build Settings (section)
```

### Step 2: Configurer les valeurs

**REMPLIR EXACTEMENT CECI:**

| Champ | Valeur |
|-------|--------|
| **Framework preset** | Next.js |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |
| **Root directory** | (laisser vide) |
| **Node version** | 20.x |

**SCREENSHOT attendu:**
```
Framework preset:       [Next.js ▼]
Build command:          [npm run build ________________]
Build output directory: [.next ________________]
Root directory:         [________________]
Node version:           [20.x ________________]
```

### Step 3: Environment Variables (BUILD TIME)

⚠️ **IMPORTANT:** Les variables doivent être disponibles au BUILD TIME

Aller à: **Settings → Environment variables**

Créer un environnement nommé **"Production"** avec:

```
DATABASE_URL = postgresql://...     (votre connection string)
NEXTAUTH_SECRET = your_secret       (votre secret)
NEXTAUTH_URL = https://9fd537bc.iapostemanage.pages.dev
OLLAMA_BASE_URL = http://localhost:11434
NODE_ENV = production
NEXT_PUBLIC_APP_NAME = IA Poste Manager
```

### Step 4: Appliquer à la bonne branche

Aller à: **Settings → Builds & deployments**

Vérifier:
```
✓ Auto deploy: ON
✓ Branch: main
✓ Environment: Production
```

---

## 🎯 Solution Rapide (2 minutes)

Si le framework n'est pas reconnu automatiquement:

1. **Framework preset:** Changer à **"None"** puis à **"Next.js"**
2. **Build command:** Copier-coller: `npm run build`
3. **Output directory:** Copier-coller: `.next`
4. **Cliquer "Save"**

---

## ✅ Après Configuration

1. **Cliquer "Retry"** sur le dernier déploiement échoué
   (Ou faire un `git push` pour retrigger)

2. **Attendre 2-3 minutes** que Cloudflare redéploie

3. **Vérifier:** Dashboard → Deployments → dernier = Green "Success"

4. **Tester:** https://9fd537bc.iapostemanage.pages.dev/login

---

## 🆘 Si Toujours en Erreur

Verifier les **Build logs:**

1. Pages → iapostemanage → Deployments
2. Cliquer le dernier déploiement
3. Cliquer "Build logs"
4. Lire l'erreur exacte

**Erreurs courantes:**

```
❌ "Failed to find Next.js config"
→ Vérifier que next.config.js existe

❌ "Cannot find module '@prisma/client'"
→ Ajouter DATABASE_URL avant le build

❌ "npm: command not found"
→ Node version n'est pas configurée (mettre 20.x)

❌ "Build output directory not found: .next"
→ Le output directory est mauvais (mettre .next)
```

---

## 📝 Configuration Finale (wrangler.json check)

Votre `wrangler.json` devrait être:

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "iapostemanage",
  "pages_build_output_dir": ".next",
  "compatibility_date": "2026-01-22",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_APP_NAME": "IA Poste Manager"
  }
}
```

✅ Clean (pas de secrets)
✅ Output directory = `.next`
✅ Compatibility flags = nodejs_compat

---

**À faire maintenant:** 👇

1. Ouvrir Dashboard Cloudflare
2. Aller à Settings → Build Settings
3. Configurer les 5 champs (Framework, Build command, Output, Root, Node)
4. Ajouter les 6 environment variables
5. Cliquer "Save"
6. Cliquer "Retry" sur le dernier déploiement
7. Attendre 2-3 minutes
8. Tester l'URL


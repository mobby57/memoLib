# 🎯 COMMENT DÉMARRER VOTRE APP - Guide Rapide

## 1️⃣ VÉRIFIER PRÉALABLES

```bash
cd c:\Users\moros\Desktop\PROD\memolib-production

# Vérifier Node.js
node --version    # Doit être v18+
npm --version     # Doit être v9+

# Vérifier variables d'env
cat .env.local    # Doit avoir DATABASE_URL, NEXT_AUTH_SECRET, etc.
```

## 2️⃣ INSTALLER & PRÉPARER

```bash
# Installer dépendances
npm install

# Générer Prisma Client
npx prisma generate

# Mettre en place base de données
npx prisma migrate dev
# OU en production
npx prisma db push
```

## 3️⃣ DÉVELOPPEMENT LOCAL

```bash
# Démarrer app
npm run dev

# App accessible à: http://localhost:3000
# Hot reload activé ✅
```

**Si erreur:**
```bash
# Mode legacy (plus stable)
npm run dev:legacy

# Avec debug Node
npm run dev:debug
```

## 4️⃣ VÉRIFIER QUE ÇA MARCHE

### À faire dans le navigateur:

```
✅ Homepage: http://localhost:3000
✅ Login: http://localhost:3000/[locale]/auth/login
✅ Dashboard: http://localhost:3000/[locale]/dashboard
✅ Admin: http://localhost:3000/[locale]/admin/dashboard
✅ API health: http://localhost:3000/api/health
```

### Via terminal:

```bash
# Vérifier linting
npm run lint

# Vérifier tests
npm run test:unit

# Vérifier build
npm run build:fast

# Afficher résultats
npm run preview    # Démarrera le build prod localement
```

## 5️⃣ BUILD PRODUCTION

```bash
# Build optimisé
npm run build:fast

# Démarrer prod localement
npm start

# App accessible à: http://localhost:3000
```

## 🚨 SI ERREURS

### Erreur: "Cannot find module"
```bash
npm install
npm run build:fast
```

### Erreur: "Database connection failed"
```bash
# Vérifier .env.local a DATABASE_URL
cat .env.local | grep DATABASE_URL

# Vérifier base de données existe
npx prisma db push
```

### Erreur: "Build failed"
```bash
# Nettoyer cache
rm -rf .next node_modules package-lock.json
npm install
npm run build:fast
```

### Erreur: "Port 3000 already in use"
```bash
# Utiliser autre port
npm run dev -- -p 3001
# Ou tuer processus existant
lsof -i :3000
kill -9 <PID>
```

## ✅ CHECKLIST FINAL

- [ ] `npm install` ✅
- [ ] `npx prisma generate` ✅
- [ ] `npx prisma migrate dev` ✅
- [ ] `npm run lint` - < 50 warnings
- [ ] `npm run build:fast` - 0 erreurs
- [ ] `npm run preview` - Page charge
- [ ] `npm run test:unit` - Tests passent

## 🎯 RÉSUMÉ COMMANDES

| Action | Commande |
|--------|----------|
| Installer | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build:fast` |
| Prod | `npm start` |
| Tests | `npm run test:unit` |
| Lint | `npm run lint` |
| Prisma | `npx prisma studio` |

## 📱 ACCÈS APP

| Page | URL |
|------|-----|
| Home | http://localhost:3000 |
| Login | http://localhost:3000/auth/login |
| Dashboard | http://localhost:3000/dashboard |
| Admin | http://localhost:3000/admin |
| API Test | http://localhost:3000/api/health |

---

**Voilà! L'app devrait fonctionner maintenant! 🚀**

Besoin d'aide? Vérifiez les fichiers d'audit:
- `AUDIT_SRC_COMPLET.md` - Audit détaillé
- `CORRECTIONS_PRIORITAIRES.md` - Problèmes à corriger

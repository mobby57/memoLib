# 🚀 Déployer MemoLib CESEDA en Production

Félicitations ! Votre produit MemoLib CESEDA est prêt pour le déploiement. Suivez le guide ci-dessous.

## ✅ État Actuel

- ✅ Homepage refocalisée sur CESEDA
- ✅ Page `/ceseda` dédiée avec landing complète
- ✅ Nettoyage effectué (-60% complexité)
- ✅ Build Next.js complétée (.next/)
- ✅ Git commits prêts (feat/phase2-optimizations)

## 🎯 Procédure de Déploiement Rapide (Vercel)

### Étape 1: Préparer les secrets Vercel

```bash
# 1.1 - Créer un fichier .env.production.local avec :
cat > .env.production.local << 'EOF'
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="https://your-domain.vercel.app"
EOF

# 1.2 - Générer NEXTAUTH_SECRET
openssl rand -base64 32
# Résultat: copy-paste dans .env.production.local
```

### Étape 2: Connecter à Vercel

Option A: Interface web (plus simple)
```bash
# Visiter: https://vercel.com/new
# 1. Sélectionner dépôt GitHub: mobby57/memoLib
# 2. Sélectionner branche: feat/phase2-optimizations
# 3. Framework: Next.js 16 (auto-détecté)
# 4. Cliquer "Deploy"
```

Option B: CLI Vercel
```bash
npm i -g vercel
vercel --prod
# Répondre aux questions (framework, build settings, etc)
```

### Étape 3: Configurer les variables d'environnement

Dans dashboard Vercel → Project Settings → Environment Variables:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<paste-from-step-1>
NEXTAUTH_URL=https://memolib-ceseda.vercel.app
```

### Étape 4: Déployer

```bash
# Depuis dashboard Vercel: cliquer "Redeploy" sur latest commit
# Ou via CLI:
vercel deploy --prod
```

### Étape 5: Vérifier le déploiement

```bash
# Vérifier la homepage
curl https://memolib-ceseda.vercel.app

# Vérifier la page CESEDA
curl https://memolib-ceseda.vercel.app/ceseda

# Vérifier l'API health
curl https://memolib-ceseda.vercel.app/api/health
```

## 📊 Domaines Personnalisés (Optionnel)

Dans Vercel dashboard:
1. Aller à "Domains"
2. Ajouter: `memolib.fr` ou `ceseda-ai.fr`
3. Configurer DNS chez votre registrar
4. SSL auto-généré par Vercel

## 🔐 Sécurité Pré-Production

Avant déploiement, vérifier:
- [ ] `.env.production.local` n'est PAS committé (fichier .gitignore)
- [ ] NEXTAUTH_SECRET changé (généré avec `openssl rand -base64 32`)
- [ ] DATABASE_URL pointe vers PostgreSQL production (pas dev)
- [ ] NEXTAUTH_URL correct (domaine production)
- [ ] Sentry DSN configuré (optionnel mais recommandé)

## 📈 Monitoring Post-Déploiement

```bash
# 1. Vérifier les logs Vercel
vercel logs <deployment-url> --tail

# 2. Vérifier la base de données
# - Migrations appliquées
# - Tables créées correctement

# 3. Tester les fonctionnalités clés
# - Authentification (login/register)
# - Page CESEDA (statistiques, témoignages)
# - API health check
```

## 🆘 Troubleshooting

**Build échoue sur Vercel?**
```bash
# Vérifier les logs:
vercel logs <url> --tail

# Redéployer avec verbose:
vercel deploy --prod --debug
```

**Variables d'environnement non trouvées?**
```bash
# Vérifier qu'elles sont présentes dans Vercel dashboard
vercel env list
# Puis redéployer
vercel deploy --prod
```

**Erreur DATABASE_URL?**
```bash
# S'assurer que PostgreSQL est en ligne
# Mettre à jour CONNECTION_URL dans Vercel dashboard
# Relancer migration Prisma:
npx prisma migrate deploy
```

## ✨ Après Déploiement

1. **Annoncer le lancement**
   - Email aux cabinets CESEDA
   - LinkedIn post (vision, 3 piliers, testimonials)
   - Blog article (technical deep-dive)

2. **Configurer analytics**
   - Google Analytics (newsletter signup tracking)
   - Sentry (error tracking)
   - Vercel Analytics (performance)

3. **Lancer campagne marketing**
   - Essai gratuit 14 jours (CTA prominent)
   - Webinaire démo CESEDA
   - Fiche produit complète

---

**Domaine recommandé:** `memolib-ceseda.vercel.app` (gratuit, immédiat)  
**Coût:** $0-20/mois sur Vercel (hébergement Next.js)  
**Temps de déploiement:** 5-10 minutes  

Questions? Voir [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md) pour détails complets.

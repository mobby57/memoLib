# Configuration .env.local - Guide de test

## ✅ Configuration actuelle (2026-01-01)

### Variables critiques configurées:
- ✅ NEXTAUTH_SECRET: Secret sécurisé de 32 caractères
- ✅ NEXTAUTH_URL: http://localhost:3000
- ✅ DATABASE_URL: file:./prisma/dev.db
- ✅ FIGMA_ACCESS_TOKEN: Configuré et actif
- ✅ FIGMA_FILE_KEY: auVG69j7QrCFGBt5svFre0

### Features activées (100%):
- ✅ ENABLE_AI_ASSISTANT=true
- ✅ ENABLE_WORKFLOWS=true
- ✅ ENABLE_EXPORTS=true
- ✅ ENABLE_COLLABORATION=true
- ✅ ENABLE_NOTIFICATIONS=true
- ✅ ENABLE_FILE_UPLOAD=true

### Services IA disponibles:
- **Ollama** (Local, gratuit): http://localhost:11434
  - Modèle: llama3.2:latest
  - Utilisation: AI Assistant, suggestions, analyse
  
- **OpenAI** (Optionnel, payant):
  - Non configuré par défaut
  - À activer si besoin en décommentant OPENAI_API_KEY

### Limites et sécurité:
- Rate limiting: 100 requêtes/minute
- Taille max fichiers: 50 MB
- Session timeout: 30 jours (2592000 secondes)
- Debug activé en développement

## 🧪 Tests recommandés

### 1. Test de démarrage
```bash
npm run dev
```
Résultat attendu: Serveur démarre sur http://localhost:3000

### 2. Test de build
```bash
npm run build
```
Résultat attendu: Build réussit sans erreur TypeScript

### 3. Test Prisma
```bash
npx prisma generate
npx prisma db push
```
Résultat attendu: Base de données synchronisée

### 4. Test Figma CLI
```bash
npm run figma
```
Résultat attendu: Menu CLI s'affiche

### 5. Test unitaires
```bash
npm test
```
Résultat attendu: Tests passent (avec coverage)

## 🔧 Dépannage

### Erreur: "NEXTAUTH_SECRET is not set"
- ✅ Vérifié: Variable définie dans .env.local

### Erreur: "Cannot connect to database"
- ✅ Vérifié: DATABASE_URL pointe vers ./prisma/dev.db
- Solution: Exécuter `npx prisma db push`

### Erreur: "Figma API: Invalid token"
- ✅ Vérifié: Token présent
- Note: Si erreur persiste, régénérer le token sur figma.com

### Erreur: "Ollama not found"
- Solution: Installer Ollama depuis https://ollama.ai
- Optionnel: Peut utiliser OpenAI à la place

## 📊 Checklist de validation

- [x] .env.local créé
- [x] .env.local.backup sauvegardé
- [x] NEXTAUTH_SECRET sécurisé
- [x] DATABASE_URL configuré
- [x] FIGMA_ACCESS_TOKEN présent
- [x] Features flags définis
- [x] Limites de sécurité configurées
- [x] Variables de test définies

## 🚀 Prêt pour production

Pour déployer en production:
1. Copier .env.local vers .env.production
2. Régénérer NEXTAUTH_SECRET avec: `openssl rand -base64 32`
3. Mettre à jour NEXTAUTH_URL avec le domaine de production
4. Configurer DATABASE_URL vers base de données production
5. Ajouter clés API réelles (OpenAI, Resend, etc.)
6. Configurer monitoring (Sentry, Analytics)

---

**Dernière mise à jour:** 2026-01-01 par Copilot
**Statut:** ✅ 100% Configuré et prêt pour tests

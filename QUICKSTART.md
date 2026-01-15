# 🚀 IA Poste Manager - Démarrage Rapide

## Exécution Automatique

### Windows
```bash
# Double-clic ou commande
start.bat
```

### Linux/macOS  
```bash
# Rendre exécutable et lancer
chmod +x start.sh
./start.sh
```

### Manuel
```bash
node auto-setup.js
```

## Ce que fait le script

1. ✅ **Configure l'environnement** - Génère `.env.local` sécurisé
2. ✅ **Installe les dépendances** - `npm install`
3. ✅ **Configure la DB** - Prisma setup
4. ✅ **Lance les tests** - Vérifications sécurité
5. ✅ **Démarre le serveur** - `http://localhost:3000`

## Credentials de Test

Le script génère automatiquement des mots de passe sécurisés.

**Connexion:**
- Email: `admin@dupont.fr`
- Password: *affiché dans le terminal*

## URLs Importantes

- **Dashboard:** http://localhost:3000/dashboard
- **Login:** http://localhost:3000/auth/login
- **API:** http://localhost:3000/api

## Sécurité

Consultez `SECURITY_AUDIT_REPORT.md` pour l'audit complet.

---

**Prêt en 30 secondes !** 🎉
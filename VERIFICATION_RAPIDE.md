# ⚡ VÉRIFICATION RAPIDE - IA Poste Manager v2.0

**Commande rapide pour vérifier le statut du système**

---

## 🎯 COMMANDE UNIQUE

```powershell
npx tsx scripts/advanced-backup.ts 5
```

---

## ✅ RÉSULTAT ATTENDU

```
📊 STATISTIQUES DES BACKUPS:

  Total: 2
  Taille totale: 120.22 KB
  Taille moyenne: 60.11 KB
  Compressés: 2
  Vérifiés: 2
  Plus ancien: 21/01/2026 00:30:27
  Plus récent: 21/01/2026 00:31:48
```

---

## 📊 INTERPRÉTATION

| Métrique | Valeur | Signification | Statut |
|----------|--------|---------------|--------|
| **Total** | 2 | Nombre de backups disponibles | ✅ OK |
| **Taille totale** | 120.22 KB | Espace utilisé backups | ✅ Optimal |
| **Compressés** | 2 | Backups compressés (tar.gz) | ✅ OK |
| **Vérifiés** | 2 | Backups avec hash SHA-256 OK | ✅ Sécurisé |

---

## 🚨 QUE FAIRE SI...

### Problème 1: "Total: 0"

**Signification**: Aucun backup trouvé

**Solution**:
```powershell
# Créer un backup
npx tsx scripts/advanced-backup.ts 1
```

---

### Problème 2: "Vérifiés: 0"

**Signification**: Backups corrompus

**Solution**:
```powershell
# Créer nouveau backup
npx tsx scripts/advanced-backup.ts 1

# Vérifier intégrité
npx tsx scripts/advanced-backup.ts 3
```

---

### Problème 3: Erreur d'exécution

**Signification**: Système non configuré

**Solution**:
```powershell
# Vérifier Prisma
npx prisma db push

# Générer client
npx prisma generate

# Réessayer
npx tsx scripts/advanced-backup.ts 5
```

---

## 🎯 VÉRIFICATION COMPLÈTE (4 COMMANDES)

```powershell
# 1. Backup
npx tsx scripts/advanced-backup.ts 5

# 2. Performance
npx tsx scripts/database-performance-dashboard.ts | Select-String "MÉTRIQUES GLOBALES" -Context 0,4

# 3. Tests base
npx tsx scripts/test-all-databases.ts

# 4. Prisma health
npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ Prisma OK')).catch(e => console.error('❌ Erreur:', e))"
```

---

## ✅ STATUT SYSTÈME

### Si Tous les Tests Passent

```
✅ Backup système: Opérationnel
✅ Dashboard performance: Opérationnel
✅ Tests base: Opérationnel
✅ Prisma: Opérationnel

🎉 SYSTÈME v2.0 100% FONCTIONNEL
```

### Si Au Moins Un Échec

Consulter:
- [GUIDE_COMPLET_ADVANCED.md](GUIDE_COMPLET_ADVANCED.md) - Section "Dépannage"
- [SYNTHESE_FINALE_DATABASES_V2.md](SYNTHESE_FINALE_DATABASES_V2.md) - Résolution problèmes

---

## 📚 DOCUMENTATION

| Guide | Objectif |
|-------|----------|
| [VERIFICATION_RAPIDE.md](VERIFICATION_RAPIDE.md) | Ce fichier - Vérification rapide |
| [DEPLOIEMENT_COMPLET_V2.md](DEPLOIEMENT_COMPLET_V2.md) | Déploiement visuel |
| [GUIDE_COMPLET_ADVANCED.md](GUIDE_COMPLET_ADVANCED.md) | Guide utilisateur complet |
| [SYNTHESE_FINALE_DATABASES_V2.md](SYNTHESE_FINALE_DATABASES_V2.md) | Synthèse finale |

---

**Dernière mise à jour**: 21 janvier 2026  
**Version**: 2.0  
**Durée vérification**: ~5 secondes

**Commande rapide**:
```powershell
npx tsx scripts/advanced-backup.ts 5
```

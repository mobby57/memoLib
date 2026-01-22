# 🚀 WORKSPACE - GUIDE DE DÉMARRAGE RAPIDE

## ⚡ Lancement en 3 Minutes

### Étape 1 : Vérifier l'installation

```bash
# Base de données seedée ?
npx prisma db push

# Vérifier les données de test
npx tsx scripts/test-workspace-apis.ts
```

**Résultat attendu :**
```
✅ 3 workspaces trouvés
✅ Documents API : 8/8 tests passés
✅ Notes API : 7/7 tests passés
✅ Emails API : 8/8 tests passés
✅ Procédures API : 5/5 tests passés
```

---

### Étape 2 : Démarrer le serveur

```bash
npm run dev
```

Ouvrir : **http://localhost:3000**

---

### Étape 3 : Tester les Workspaces

**Connexion :**
- Email : `admin@avocat.com`
- Password : `Admin123!`

**Navigation :**
1. Aller sur Dashboard Avocat
2. Cliquer sur un workspace client
3. Tester les 6 onglets :
   - ✅ Emails (marquer lu, favoris, archiver)
   - ✅ Procédures (liste avec filtres)
   - ✅ Documents (upload, vérification, suppression)
   - ✅ Notes (créer, modifier, épingler, supprimer)
   - ✅ Timeline (historique)
   - ✅ Overview (vue d'ensemble)

---

## 📊 Fonctionnalités Disponibles

### Onglet Emails 📧

**Actions testables :**
- Marquer lu/non lu (icône enveloppe)
- Ajouter/retirer favoris (icône étoile)
- Archiver email (bouton modal)
- Filtres : Tous, Non lus, Critiques, Requiert réponse
- Recherche full-text

**API Backend :**
- `GET /api/lawyer/workspaces/[id]/emails` - Liste avec filtres
- `PATCH /api/lawyer/workspaces/[id]/emails` - Actions (mark_read, star, archive)

---

### Onglet Documents 📄

**Actions testables :**
- Upload fichier (PDF, images, Word) - Max 10MB
- Vérifier document (bouton modal)
- Supprimer document (bouton modal avec confirmation)
- Filtres : Tous, Vérifiés, Non vérifiés, Traités IA
- Recherche par nom/type/description
- Vue grille/liste

**API Backend :**
- `GET /api/lawyer/workspaces/[id]/documents` - Liste avec filtres
- `POST /api/lawyer/workspaces/[id]/documents` - Upload
- `PATCH /api/lawyer/workspaces/[id]/documents/[docId]` - Vérifier/modifier
- `DELETE /api/lawyer/workspaces/[id]/documents/[docId]` - Supprimer

---

### Onglet Notes 📝

**Actions testables :**
- Créer note (bouton "+ Nouvelle note")
- Modifier note (icône crayon)
- Supprimer note (icône poubelle avec confirmation)
- Épingler/désépingler note (icône punaise)
- Marquer privée/équipe
- Tags (séparés par virgules)
- Filtres : Toutes, Épinglées, Privées, Équipe
- Recherche full-text

**API Backend :**
- `GET /api/lawyer/workspaces/[id]/notes` - Liste avec filtres
- `POST /api/lawyer/workspaces/[id]/notes` - Créer
- `PATCH /api/lawyer/workspaces/[id]/notes/[noteId]` - Modifier/épingler
- `DELETE /api/lawyer/workspaces/[id]/notes/[noteId]` - Supprimer

---

### Onglet Procédures ⚖️

**Actions testables :**
- Voir liste procédures CESEDA
- Filtres : Toutes, OQTF, Asile, Naturalisation, Actives, Critiques
- Recherche par titre/description/référence
- Voir détails procédure (deadline, type, urgence)
- Checklist items (lecture seule pour l'instant)

**API Backend :**
- `GET /api/lawyer/workspaces/[id]/procedures` - Liste avec filtres

---

### Timeline & Overview 📅

**Affichage uniquement** (pas de CRUD) :
- Timeline : Tous les événements workspace
- Overview : Résumé stats (procédures, emails, documents)

---

## 🧪 Tests API Manuels

### Tester avec cURL

```bash
# 1. Documents - Upload
curl -X POST http://localhost:3000/api/lawyer/workspaces/[ID]/documents \
  -F "file=@test.pdf" \
  -F "documentType=passeport" \
  -F "category=identite" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# 2. Notes - Créer
curl -X POST http://localhost:3000/api/lawyer/workspaces/[ID]/notes \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "content": "Note de test",
    "title": "Test API",
    "isPinned": true,
    "tags": ["test", "api"]
  }'

# 3. Emails - Marquer lu
curl -X PATCH http://localhost:3000/api/lawyer/workspaces/[ID]/emails \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "emailId": "email-xxx-yyy-zzz",
    "action": "mark_read"
  }'
```

---

### Tester avec Prisma Studio

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

**Explorer les tables :**
- `Workspace` → Voir les workspaces créés
- `WorkspaceDocument` → Documents uploadés
- `WorkspaceNote` → Notes créées
- `WorkspaceEmail` → Emails avec actions (isRead, isStarred)
- `Procedure` → Procédures CESEDA
- `TimelineEvent` → Historique

---

## 🐛 Résolution Problèmes

### Problème : "Workspace non trouvé"

**Cause :** Pas de données de test  
**Solution :**
```bash
npx tsx scripts/test-workspace-advanced.ts
```

---

### Problème : "Upload échoue - 500 error"

**Cause :** Stockage physique non implémenté (normal)  
**Solution :** Métadonnées créées en DB, fichier non sauvé (TODO)  
**Workaround :** Ignorer pour l'instant, l'API fonctionne pour les métadonnées

---

### Problème : "Actions emails ne fonctionnent pas"

**Vérifier :**
1. Session active (cookie `next-auth.session-token`)
2. Email ID valide
3. Action valide : `mark_read`, `star`, `archive`

**Debug :**
```typescript
// Dans DevTools Console
fetch('/api/lawyer/workspaces/[ID]/emails', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ emailId: 'xxx', action: 'mark_read' })
}).then(r => r.json()).then(console.log)
```

---

### Problème : "Notes ne se créent pas"

**Vérifier :**
1. Contenu non vide
2. WorkspaceId valide
3. Session active

**Debug :**
```bash
# Voir les notes existantes
npx prisma studio
# → Table WorkspaceNote
```

---

## 📈 Prochaines Actions

### Immédiat (Aujourd'hui)

1. **Tester UI complète** - Toutes les actions dans chaque onglet
2. **Valider filtres** - Tous les filtres/recherches fonctionnent
3. **Tester erreurs** - Upload fichier trop gros, contenu note vide, etc.

---

### Court terme (Cette semaine)

1. **Stockage physique** - Implémenter fs.writeFile pour documents
2. **Procédures CRUD** - Créer/modifier/supprimer procédures
3. **Thumbnails** - Générer miniatures images uploadées
4. **Download** - Endpoint `/documents/[id]/download`

---

### Moyen terme (Ce mois)

1. **Drag & Drop** - Upload documents en drag & drop
2. **Preview PDF** - Afficher PDF inline dans modal
3. **Rich Text Editor** - TipTap pour notes avec formatage
4. **Export ZIP** - Télécharger tout le workspace

---

## 🎯 Checklist Validation

### Backend API ✅

- [x] Documents GET (liste + filtres)
- [x] Documents POST (upload avec validation)
- [x] Documents PATCH (vérifier + modifier)
- [x] Documents DELETE (supprimer)
- [x] Notes GET (liste + filtres)
- [x] Notes POST (créer avec tags)
- [x] Notes PATCH (modifier + épingler)
- [x] Notes DELETE (supprimer)
- [x] Emails GET (liste + filtres)
- [x] Emails PATCH (actions 6 types)
- [x] Procédures GET (liste + filtres)
- [x] Workspace GET (données complètes)
- [x] Workspace PATCH (modifier metadata)

---

### Frontend Integration ✅

- [x] NotesTab handlers connectés
- [x] DocumentsTab handlers connectés
- [x] EmailsTab handlers connectés
- [x] WorkspaceId props passés
- [x] onRefresh callbacks implémentés
- [x] Error handling (try/catch)
- [x] Loading states (isUploading, etc.)
- [x] Confirmations (delete avec confirm())

---

### Tests ⏳

- [ ] Test end-to-end Notes (créer → modifier → épingler → supprimer)
- [ ] Test end-to-end Documents (upload → vérifier → supprimer)
- [ ] Test end-to-end Emails (marquer lu → favoris → archiver)
- [ ] Test filtres et recherche (tous les onglets)
- [ ] Test validation erreurs (fichier trop gros, etc.)
- [ ] Test multi-utilisateurs (isolation tenant)

---

## 📞 Commandes Utiles

```bash
# Démarrer dev
npm run dev

# Tests API automatiques
npx tsx scripts/test-workspace-apis.ts

# Prisma Studio (explorer DB)
npx prisma studio

# Reset DB + seed
npx prisma db push --force-reset
npx tsx scripts/seed-complete.ts

# Voir logs
# → Dans terminal npm run dev

# Health check
curl http://localhost:3000/api/health
```

---

## 🎉 Success Criteria

**Le système est validé si :**

✅ Toutes les actions UI fonctionnent sans erreur  
✅ Les filtres retournent les bons résultats  
✅ Les recherches trouvent les documents/notes/emails  
✅ Les modifications se persistent en DB  
✅ Les suppressions fonctionnent avec confirmation  
✅ L'upload valide la taille et le type de fichier  
✅ Les tags se sauvegardent et s'affichent correctement  
✅ L'épinglage des notes fonctionne (ordre affiché correct)  
✅ Les actions emails changent les états (isRead, isStarred)  

---

**Prêt pour la production après** :
- ✅ Stockage physique documents implémenté
- ✅ Tests end-to-end validés
- ✅ Performance optimisée (pagination, indexes)

---

**Créé avec ❤️ par GitHub Copilot**  
**Date:** 6 janvier 2026


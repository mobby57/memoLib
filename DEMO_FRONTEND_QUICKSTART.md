# 🚀 Démonstration Client - Guide Rapide

## COMMANDE UNIQUE

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-frontend.ps1 -ClientName "Cabinet XYZ"
```

## CE QUI SE PASSE

1. ✅ Build automatique
2. ✅ API démarre
3. ✅ Navigateur s'ouvre sur l'interface web
4. ✅ Prêt pour la démo interactive

## SCÉNARIO (5 MINUTES)

### 1️⃣ AUTHENTIFICATION (1 min)
**Onglet : 🔐 Authentification**

**Inscription** :
- Email : `demo@cabinet.fr`
- Mot de passe : `SecurePass123!`
- Nom : `Jean Dupont`
- Cliquer "S'inscrire"
- ✅ Compte créé

**Connexion** :
- Cliquer "Se connecter"
- ✅ Token reçu

**Message client** : "Validation stricte : email valide, mot de passe sécurisé obligatoire"

---

### 2️⃣ INGESTION (1 min)
**Onglet : 📧 Ingestion**

**Email 1** :
- De : `client1@example.com`
- Sujet : `Demande urgente`
- Corps : `J'ai besoin d'aide pour mon dossier en cours...`
- ID externe : `DOSSIER-2024-001`
- Cliquer "Ingérer"
- ✅ Email ingéré, dossier créé automatiquement

**Email 2** :
- De : `client2@example.com`
- Sujet : `Question sur facture`
- Corps : `Pouvez-vous m'expliquer la facture du mois dernier ?`
- ID externe : `DOSSIER-2024-002`
- Cliquer "Ingérer"
- ✅ Deuxième email ingéré

**Message client** : "Organisation automatique : chaque email crée ou rejoint un dossier"

---

### 3️⃣ RECHERCHE (2 min)
**Onglet : 🔍 Recherche**

**Recherche textuelle** :
- Taper : `urgente`
- Cliquer "Rechercher"
- ✅ Résultats instantanés
- **Message client** : "Recherche en moins d'1 seconde sur des milliers d'emails"

**Recherche IA** :
- Taper : `problème facturation`
- Cliquer "Recherche IA"
- ✅ Résultats avec score de similarité
- **Message client** : "L'IA trouve les emails même sans mots-clés exacts. Ici, elle a trouvé 'facture' alors que vous avez cherché 'facturation'"

---

### 4️⃣ DOSSIERS (30 sec)
**Onglet : 📁 Dossiers**

- Cliquer "Afficher mes dossiers"
- ✅ Liste des 2 dossiers créés automatiquement
- **Message client** : "Organisation automatique par dossier, timeline chronologique"

---

### 5️⃣ STATISTIQUES (30 sec)
**Onglet : 📊 Statistiques**

- Cliquer "Charger les statistiques"
- ✅ Tableaux de bord affichés :
  - Total emails
  - Jours actifs
  - Types d'events
  - Sévérité moyenne
- **Message client** : "Tableaux de bord en temps réel pour piloter votre activité"

---

## 💡 ARGUMENTS DE VENTE

| Fonctionnalité | Bénéfice | Phrase d'accroche |
|----------------|----------|-------------------|
| **Recherche instantanée** | Gain de temps | "Trouvez n'importe quel email en 1 seconde" |
| **Recherche IA** | Intelligence | "L'IA comprend le sens, pas juste les mots" |
| **Organisation auto** | Productivité | "Dossiers créés automatiquement, zéro effort" |
| **Sécurité** | Conformité | "Validation stricte, audit trail RGPD" |
| **Statistiques** | Pilotage | "Tableaux de bord pour décider mieux" |

## 🎯 PHRASES CLÉS

**Ouverture** :
> "En 5 minutes, vous allez voir comment MemoLib transforme la gestion des emails en cabinet d'avocats."

**Pendant la démo** :
- "Regardez : validation stricte du mot de passe"
- "Email ingéré, dossier créé automatiquement"
- "Recherche instantanée, résultats en moins d'1 seconde"
- "L'IA trouve même sans mots-clés exacts"
- "Tout est tracé pour la conformité RGPD"

**Clôture** :
> "Vous venez de voir une solution complète en action. Prêt pour un essai gratuit avec vos vraies données ?"

## 🔧 DÉPANNAGE

| Problème | Solution |
|----------|----------|
| Port 8080 occupé | `netstat -ano \| findstr :8080` puis `taskkill /F /PID <PID>` |
| Navigateur ne s'ouvre pas | Ouvrir manuellement `http://localhost:8080/demo.html` |
| API ne démarre pas | Vérifier `appsettings.Development.json` |

## 📊 CHECKLIST AVANT DÉMO

- [ ] Build réussi (`dotnet build`)
- [ ] Test de l'interface (`.\scripts\demo-frontend.ps1`)
- [ ] Navigateur propre (pas d'extensions)
- [ ] Connexion internet stable
- [ ] Ordinateur chargé

## 🎁 OFFRE COMMERCIALE

**Essai gratuit** : 30 jours, toutes fonctionnalités  
**Formation** : 2h incluses  
**Support** : Email + téléphone pendant 90 jours  
**Garantie** : Satisfait ou remboursé  

---

**Imprimez cette page et gardez-la pendant vos démos !** 📄

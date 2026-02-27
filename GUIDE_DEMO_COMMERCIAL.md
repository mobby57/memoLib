# 🎯 GUIDE DÉMO COMMERCIAL

## 📧 Email Unique pour Toutes les Démos

**Email de monitoring : sarraboudjellal57@gmail.com**

Cet email reste **toujours le même**, peu importe le secteur.

---

## 🎨 Changer l'Interface Selon le Client

### Avant chaque démo :

```powershell
.\change-sector.ps1
```

**Choisissez le secteur selon votre client :**
- Client = Avocat → Choisir 1 (LegalMemo)
- Client = Médecin → Choisir 2 (MediMemo)
- Client = Consultant → Choisir 3 (ConsultMemo)
- etc.

---

## 🚀 Workflow Démo

### 1. Préparer la démo (1 minute)

```powershell
# Changer le secteur selon le client
.\change-sector.ps1

# Lancer l'application
.\start.ps1
```

### 2. Pendant la démo

**Montrer :**
- Frontend : http://localhost:3000 (interface adaptée au secteur)
- Admin : http://localhost:8091 (monitoring)

**Expliquer :**
- "Voici **[LegalMemo/MediMemo/etc.]** adapté à votre métier"
- "L'email sarraboudjellal57@gmail.com est surveillé automatiquement"
- "Chaque email devient un dossier client"

### 3. Démonstration live

**Envoyer un email de test à :**
```
sarraboudjellal57@gmail.com
```

**L'API va :**
1. Détecter l'email (60 secondes max)
2. Créer un dossier automatiquement
3. Extraire les infos client
4. Afficher dans l'interface du secteur choisi

---

## 💡 Exemples de Pitch

### Pour un Avocat (Legal)
```
"Voici LegalMemo, spécialement conçu pour les cabinets d'avocats.
Tous vos emails clients arrivent ici (sarraboudjellal57@gmail.com)
et sont automatiquement transformés en dossiers juridiques."
```

### Pour un Médecin (Medical)
```
"Voici MediMemo, adapté aux professionnels de santé.
Vos emails patients (sarraboudjellal57@gmail.com) deviennent
automatiquement des dossiers médicaux conformes HIPAA."
```

### Pour un Consultant (Consulting)
```
"Voici ConsultMemo, pour les consultants.
Vos emails clients (sarraboudjellal57@gmail.com) se transforment
en projets avec suivi automatique."
```

---

## 🎯 Avantages de Cette Approche

✅ **Un seul email** : Pas besoin de créer 8 comptes Gmail
✅ **Interface adaptée** : Chaque client voit "son" produit
✅ **Démo rapide** : 1 commande pour changer de secteur
✅ **Même backend** : Toute la puissance de MemoLib
✅ **Crédible** : Le client voit un produit dédié à son métier

---

## 📋 Checklist Avant Démo

- [ ] Exécuter `.\change-sector.ps1`
- [ ] Choisir le bon secteur (1-8)
- [ ] Lancer `.\start.ps1`
- [ ] Ouvrir http://localhost:3000
- [ ] Préparer un email de test
- [ ] Vérifier que l'API tourne

---

## 🔄 Changer de Secteur Entre 2 Démos

```powershell
# Arrêter l'application
.\stop.ps1

# Changer le secteur
.\change-sector.ps1

# Relancer
.\start.ps1
```

**Durée totale : 30 secondes**

---

## 💰 Pricing par Secteur

| Secteur | Prix/mois | Cible |
|---------|-----------|-------|
| Legal | 30€ | Avocats |
| Medical | 25€ | Médecins |
| Consulting | 35€ | Consultants |
| Accounting | 30€ | Comptables |
| Architecture | 30€ | Architectes |
| Realty | 20€ | Agents immo |
| Insurance | 30€ | Assureurs |
| Engineering | 30€ | Ingénieurs |

---

## 🎬 Script de Démo Type (5 minutes)

**Minute 1 : Introduction**
- "Bonjour, je vous présente [SectorMemo]"
- "Spécialement conçu pour [votre métier]"

**Minute 2 : Problème**
- "Vous recevez combien d'emails par jour ?"
- "Comment gérez-vous vos dossiers clients ?"

**Minute 3 : Solution**
- "Regardez : tous vos emails arrivent ici"
- "Et automatiquement deviennent des dossiers"

**Minute 4 : Démonstration**
- Envoyer un email de test
- Montrer la détection automatique
- Montrer le dossier créé

**Minute 5 : Closing**
- "30 jours d'essai gratuit"
- "Prix : [X]€/mois"
- "On commence quand ?"

---

## ✅ RÉSUMÉ

**1 email** : sarraboudjellal57@gmail.com
**8 interfaces** : Adaptées à chaque secteur
**1 commande** : `.\change-sector.ps1`
**Démo en 5 minutes** : Prêt à signer !

**BONNE CHANCE POUR VOS DÉMOS ! 🚀**

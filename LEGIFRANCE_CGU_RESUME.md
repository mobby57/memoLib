# 📋 CGU Légifrance API - Points Critiques

**Version CGU** : V1.0 - 15/12/2022  
**Responsable** : DILA (Direction de l'Information Légale et Administrative)  
**Date analyse** : 8 janvier 2026

---

## ✅ ACCÈS & AUTHENTIFICATION

### Prérequis
- ✅ **Inscription PISTE** (plateforme gouvernementale)
- ✅ **Compte nominatif** : identifiant + mot de passe sécurisés
- ✅ **Acceptation CGU** en 2 temps :
  1. CGU PISTE
  2. CGU API Légifrance (dans catalogue PISTE)
- ✅ **Âge minimum** : 15 ans (majeur numérique France)

### Authentification
- **Protocole** : OAuth 2.0 via PISTE
- **Clés OAuth** : **STRICTEMENT CONFIDENTIELLES**
  - ⛔ **INTERDICTION ABSOLUE** de publication ou divulgation à des tiers
  - ⛔ Réservées uniquement à votre application

---

## 🚨 QUOTAS & LIMITATIONS

### Types de Quotas
- **Par seconde / minute / jour** :
  - Nombre de requêtes limitées
  - Bande passante limitée
- **Application** : Globale OU par méthode API spécifique

### Consultation Quotas
```
PISTE → Applications → [Votre App] → Actions → "Consulter les quotas"
```

### ⚠️ Modifications
- La DILA peut modifier les quotas **à tout moment**
- Notification par email

---

## 🔐 SÉCURITÉ OBLIGATOIRE

### Exigences PSSIE (Politique Sécurité État)

**OBLIGATOIRE sur vos équipements** :
1. ✅ Antivirus à jour
2. ✅ Mises à jour sécurité régulières
3. ✅ Pare-feu local actif
4. ✅ Contrôle certificats SSL
5. ✅ Pas de mémorisation mots de passe navigateur
6. ✅ Verrouillage automatique sessions développeurs

### En cas de Compromission

**ACTIONS IMMÉDIATES** :
1. ✅ **Réinitialiser** identifiants OAuth sur PISTE
2. ✅ **Avertir** DILA et/ou AIFE dans les plus brefs délais

**Indicateurs de compromission** :
- Surconsommation anormale sur l'API
- Publication identifiants en ligne
- Accès anormaux détectés

📧 **Contact urgent** : retours-legifrance-modernise@dila.gouv.fr

---

## ⚖️ DISPONIBILITÉ & SLA

### Engagements DILA
- **SLA Production** : 95% de disponibilité/jour (objectif visé)
- ⚠️ **AUCUNE GARANTIE** minimale de disponibilité
- Engagement de **moyens** uniquement (pas de résultat)
- **Sandbox** : Aucun engagement (tests DILA)

### Interruptions
- API peut être **indisponible sans information préalable**
- Maintenance, tests, réindexation possibles à tout moment

---

## ⚠️ RESPONSABILITÉ DILA (LIMITATIONS)

### ❌ Aucune Garantie sur :
- **Fiabilité** des données (anomalies possibles)
- **Complétude** du contenu
- **Fraîcheur** des données
- **Disponibilité** continue

### Opposabilité
> ⚠️ **SEULS les PDF signés du Journal Officiel sont opposables**  
> Les données API ne sont **PAS opposables**

### Usage Commercial
- ✅ **Autorisé** (licence ouverte 2.0)
- ⚠️ **À vos risques et périls**
- ❌ **DILA non responsable** de :
  - Anomalies données
  - Ruptures de service
  - Manque de fraîcheur
  - Indisponibilité temporaire/permanente

---

## 🚨 SANCTIONS

### Suspension (sans notification préalable)
**Motifs** :
- Non-respect des CGU
- Usage contraire aux lois
- Comportement anormal

**Procédure** :
- Suspension **immédiate**
- Notification **après coup** seulement

### Résiliation (de plein droit)
- **Sans préavis**
- **Sans indemnisation possible**
- Simple notification à l'utilisateur

---

## 📜 PROPRIÉTÉ INTELLECTUELLE

### Licence Ouverte 2.0 (Etalab)
📎 https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf

**Autorisations** :
- ✅ Reproduction libre
- ✅ Réutilisation libre
- ✅ Modification libre
- ✅ **Usage commercial autorisé**

---

## 🔒 RGPD - DONNÉES PERSONNELLES

### Responsable Traitement : DILA

### Données Collectées (via PISTE)
1. **Email utilisateur** (compte PISTE)
2. **Statistiques agrégées** usage API

### Finalités
- Accès sécurisé API
- Information mises à jour (emails)
- Statistiques d'usage

### Conservation
- **Email** : Tant que CGU acceptées sur PISTE
- **Statistiques** : **Maximum 12 mois**

### Garanties
- ❌ Pas d'usage commercial données personnelles
- ❌ Pas de transmission à des tiers

### Droits Utilisateur
- ✅ Accès
- ✅ Rectification
- ✅ Effacement
- ✅ Limitation traitement
- ✅ Réclamation CNIL

### Exercer vos Droits
📧 **Email** : rgpd@dila.gouv.fr

📮 **Courrier** :
```
DILA
Données personnelles site Légifrance
26, rue Desaix
75727 Paris Cedex 15
```

### Réclamation CNIL
📞 **Téléphone** : 01 53 73 22 22  
🌐 **En ligne** : https://www.cnil.fr/fr/plaintes

📮 **Courrier** :
```
Commission Nationale de l'Informatique et des Libertés
3 Place de Fontenoy - TSA 80715
75334 PARIS CEDEX 07
```

---

## 📞 CONTACTS ESSENTIELS

| Type | Contact |
|------|---------|
| **Support technique API** | retours-legifrance-modernise@dila.gouv.fr |
| **RGPD / Données personnelles** | rgpd@dila.gouv.fr |
| **Compromission sécurité** | Avertir DILA + AIFE via contact technique |

---

## ⚡ ACTIONS RAPIDES

### ✅ Configuration Requise Production
```env
# OAuth (STRICTEMENT CONFIDENTIEL)
PISTE_CLIENT_ID=votre_client_id
PISTE_CLIENT_SECRET=votre_client_secret
PISTE_OAUTH_URL=https://oauth.piste.gouv.fr/api/oauth/token

# API Légifrance
PISTE_API_URL=https://api.piste.gouv.fr/dila/legifrance/lf-engine-app
PISTE_ENVIRONMENT=production
```

### ⚠️ Checklist Sécurité Avant Production
- [ ] Antivirus installé et à jour
- [ ] Mises à jour sécurité système actives
- [ ] Pare-feu configuré
- [ ] Certificats SSL vérifiés
- [ ] Clés OAuth **JAMAIS** en clair dans le code
- [ ] Variables d'environnement sécurisées
- [ ] Verrouillage auto sessions activé
- [ ] Plan de réponse compromission documenté

### 🔍 Vérification Quotas
1. Se connecter à PISTE : https://piste.gouv.fr
2. Applications → [Votre Application]
3. Actions → "Consulter les quotas"
4. Surveiller consommation régulièrement

---

## 🎯 POINTS CRITIQUES À RETENIR

1. **Clés OAuth = Secret Défense** - Jamais publiques, jamais en dur
2. **SLA 95% = Objectif** - Pas de garantie contractuelle
3. **Données API ≠ Opposables** - Seuls PDF JO officiels
4. **Sanctions sans préavis** - Suspension/résiliation immédiates possibles
5. **Usage commercial OK** - Mais à vos risques (pas de garantie service)
6. **Sécurité = Obligation** - Antivirus, MAJ, pare-feu **requis**
7. **Compromission = Action rapide** - Réinitialiser + avertir DILA
8. **Quotas modifiables** - Surveillance régulière nécessaire
9. **Statistiques conservées 12 mois** - RGPD respecté
10. **Support réactif** - Email DILA pour anomalies données

---

**Document de référence** : CGU_Legifrance_API_VF_15-12-2022.pdf  
**Analyse complète** : c:\Users\moros\Downloads\CGU_Legifrance_API_VF_15-12-2022 (1).txt

📘 **Pour toute question** : retours-legifrance-modernise@dila.gouv.fr

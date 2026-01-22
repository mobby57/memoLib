# 📋 CHECKLIST FONDATEUR — DÉCISIONS CRITIQUES & IRRÉVERSIBLES

**Date:** 21 janvier 2026  
**Projet:** IA Poste Manager  
**Fondateur:** [À remplir]  
**Signature:** [À dater et signer]

---

## 🚨 PRÉAMBULE JURIDIQUE

Ce document **engage ta responsabilité personnelle et juridique** si tu dis OUI.

Chaque décision ci-dessous a des **conséquences irréversibles** :
- Sécurité des données
- Conformité légale
- Audit externe
- Responsabilité civile/pénale
- Crédibilité auprès des clients et investisseurs

**Tu dois lire chaque ligne et décider consciemment.**

---

# 🔐 BLOC 1 : SÉCURITÉ & ACCÈS ADMINISTRATEUR

## ✅ Décision 1.1 : Qui accède à la DB production?

### À décider

- [ ] Que toi (fondateur)
- [ ] Toi + 1 autre (cofondateur / CTO)
- [ ] Toi + équipe technique (noms à lister ci-dessous)

### Noms autorisés accès DB prod

```
1. _________________________________
2. _________________________________
3. _________________________________
```

### Implications si tu dis OUI

**✅ À faire immédiatement :**
- [ ] Noter les noms exactement
- [ ] Envoyer audit trail à chacun (ils acceptent?)
- [ ] Configurer MFA obligatoire sur tous
- [ ] Chiffrer les credentials (LastPass / 1Password)
- [ ] Créer un document signé d'acceptation des risques

**⚠️ Conséquences légales :**
- Si compromission : responsabilité solidaire
- CNIL : you must identify who had access
- Clients : ils peuvent demander liste d'accès

---

## ✅ Décision 1.2 : Qui peut modifier les variables d'environnement?

### À décider

- [ ] Que toi
- [ ] Toi + personne spécifique (nom ci-dessous)
- [ ] Équipe (risqué - à justifier)

```
Personne autorisée: _________________________________
```

### Implications si tu dis OUI

**Conséquence critique :**
- 1 personne modifie DATABASE_URL → perte de connexion → downtime
- 1 personne supprime NEXTAUTH_SECRET → tous les utilisateurs déconnectés
- 1 personne ajoute mauvaise clé → app cassée en prod

**À configurer :**
- [ ] Notifications Slack sur chaque modification
- [ ] Approbation manuelle avant changement (Vercel / GitHub)
- [ ] Backup des variables avant chaque changement
- [ ] Journal de modifications signées

---

## ✅ Décision 1.3 : Qui peut déployer en production?

### À décider

- [ ] Que toi
- [ ] Toi + 1 autre (noms)
- [ ] Automatique (CI/CD seule, pas humain)

```
Personnes autorisées:
1. _________________________________
2. _________________________________
```

### Implications si tu dis OUI

**Pire cas scenario :**
- Quelqu'un déploie du code cassé en prod
- 50 clients juridiques perdent accès
- Données RGPD exposées temporairement
- Amende CNIL possible

**À configurer :**
- [ ] Déploiement prod doit être manuel ET approuvé (pas auto)
- [ ] Personne qui déploie DOIT avoir passé tests localement
- [ ] Rollback immédiat possible (à toi de décider)
- [ ] Post-mortem obligatoire si bug prod

---

# 💳 BLOC 2 : DONNÉES SENSIBLES & STOCKAGE

## ✅ Décision 2.1 : Où stockent les données client?

### Choix à valider

**Option A : Cloudflare R2**
- [ ] Oui, R2 suffisam (gratuit / peu cher)
- Implications: données dans DC Cloudflare (USA + EU)

**Option B : AWS S3**
- [ ] Oui, S3 EU-only (plus cher)
- Implications: données garanties UE (RGPD)

**Option C : Neon + PostgreSQL blobs**
- [ ] Oui, en base de données
- Implications: lent, backup=coûteux, **pas recommandé**

### À décider

```
Choix final: ___________________________________________

Raison: _______________________________________________
```

### Implications si tu dis OUI à R2 (USA)

**⚠️ RGPD / Juridique :**
- Données de citoyens français → peuvent être aux USA
- CJUE: légal SI contrats Standard Contractual Clauses (SCC)
- Clients: certains refuseront (banques, gouvernement)

**À faire :**
- [ ] Vérifier contrat Cloudflare / SCC
- [ ] Informer clients clairement (DPA, mention politiques)
- [ ] Prévoir Plan B (AWS S3 EU si client demande)

### Implications si tu dis OUI à AWS S3 EU

**✅ Avantages :**
- RGPD conforme d'office
- Clients rassurés
- Coûts acceptables

**À faire :**
- [ ] Activer versioning + encryption S3
- [ ] Configurer bucket lifecycle (archivage automatique)
- [ ] Ajouter CloudFront pour CDN (rapide)

---

## ✅ Décision 2.2 : Combien de temps conserves-tu les données supprimées?

### Choix à valider

- [ ] 0 jour (suppression immédiate = non-récupérable)
- [ ] 30 jours (soft delete, backup possible)
- [ ] 90 jours (RGPD-safe, client peut demander annulation)
- [ ] Illimité (à déconseiller)

```
Durée de rétention: ___________________ jours
```

### Implications si tu dis OUI

**Légal :**
- RGPD droit à l'oubli = max 90 jours acceptable
- Clients peuvent demander suppression → tu as ce délai

**Technique :**
- Soft delete = plus d'espace disque utilisé
- Backups = données conservées plus longtemps
- Audit trail = tu dois tracker qui a supprimé quoi

**À faire :**
- [ ] Configurer TTL automatique (job Prisma)
- [ ] Documenter dans DPA client
- [ ] Tester restauration depuis soft delete

---

# 🔑 BLOC 3 : CLÉS & SECRETS

## ✅ Décision 3.1 : Rotation des secrets (tous les combien?)

### Choix à valider

- [ ] 30 jours (recommandé pour prod)
- [ ] 90 jours (acceptable)
- [ ] Jamais (⚠️ dangereux)

```
Fréquence rotation: _____________________
```

### Implications si tu dis OUI à 30 jours

**Travail :**
- Tous les mois : créer nouvelle clé
- Tous les mois : déployer
- Tous les mois : tester

**Sécurité :**
- Si fuite détectée : révoquable rapidement
- Attaquant ne peut pas y accéder longtemps

**À faire :**
- [ ] Créer calendrier rotation (Outlook / Notion)
- [ ] Documenter processo (qui, quand, comment)
- [ ] Tester rollback si clé cassée

---

## ✅ Décision 3.2 : Qui a accès à la liste des secrets?

### À décider

- [ ] Que toi (le plus sûr)
- [ ] Toi + personne spécifique
- [ ] Équipe (à documenter)

```
Accès secrets: _________________________________
```

### Implications si tu dis OUI

**Conséquence majeure :**
- Si quelqu'un voit STRIPE_SECRET_KEY → il peut charger clients
- Si quelqu'un voit DATABASE_URL → il peut dump toutes données

**À configurer :**
- [ ] Jamais partager secret en texte brut
- [ ] Jamais dans Slack / Email
- [ ] Uniquement via gestionnaire de secrets (LastPass / 1Password)
- [ ] Audit log : qui a consulté quand

---

# 🏗️ BLOC 4 : INFRA & DÉPLOIEMENT

## ✅ Décision 4.1 : Quel fournisseur cloud principal?

### Choix à valider

**Option A : Cloudflare (RECOMMANDÉ)**
- [ ] Oui, Cloudflare Pages + Workers + D1
- Coût: < 50 €/mois
- Vendor lock-in: modéré (peuvent partir vers Vercel/AWS)
- Implications: excellente sécurité, scalable

**Option B : Vercel + Neon**
- [ ] Oui, Vercel + Neon PostgreSQL
- Coût: 50–100 €/mois
- Vendor lock-in: fort (Vercel = Next.js seulement)
- Implications: simple mais moins flexible

**Option C : AWS**
- [ ] Oui, ECS + RDS + S3
- Coût: 100–500 €/mois
- Vendor lock-in: très fort
- Implications: complexe, nécessite DevOps expérimenté

```
Choix final: ___________________________________________
```

### Implications de ton choix

**Si Cloudflare :**
- [ ] Tu acceptes infrastructure volatile (Workers serverless)
- [ ] Tu acceptes pas de DB relationnelle classique (D1 = SQLite)
- [ ] Tu peux migrer vers AWS dans 6 mois si besoin

**Si Vercel :**
- [ ] Tu acceptes moins de flexibilité
- [ ] Tu acceptes coûts plus élevés au scale
- [ ] Tu es limité à Next.js (pas de Python backend)

**Si AWS :**
- [ ] Tu dois maîtriser DevOps (ou recruter)
- [ ] Tu dois gérer scaling, CDN, sécurité
- [ ] Coûts prévisibles mais plus élevés

---

## ✅ Décision 4.2 : Qui gère la production en cas de problème urgent?

### À décider (noms)

```
Responsable on-call (jour): _________________________________

Responsable on-call (nuit): _________________________________

Escalade si absent: _________________________________
```

### Implications si tu dis OUI

**Pire cas :** 
- DB down → clients ne peuvent pas accéder
- Email Slack à 2h du matin
- Cette personne accepte responsabilité?

**À configurer :**
- [ ] Accord explicite écrit (acceptes-tu on-call?)
- [ ] Compensation (bonus, RH, autre?)
- [ ] Proc d'escalade claire
- [ ] Permissions pour agir seul en urgence

---

# ⚖️ BLOC 5 : CONFORMITÉ LÉGALE & AUDIT

## ✅ Décision 5.1 : Quand audites-tu la sécurité?

### Choix à valider

- [ ] Jamais (⚠️ très risqué)
- [ ] Annuellement (minimum acceptable)
- [ ] Trimestriellement (recommandé pour juridique)
- [ ] Mensuellement (très cher)

```
Fréquence audit: ___________________
```

### Implications si tu dis OUI

**Audit externe :**
- Coûts: 2 000–10 000 € par audit
- Temps: 2–4 semaines
- Résultats: rapport écrit signé (vendable)

**À faire :**
- [ ] Budget audit dans prévisions
- [ ] Chercher auditeur (ex: Cabinet spécialisé)
- [ ] Planifier 1–2 mois avant
- [ ] Corriger findings avant client important

---

## ✅ Décision 5.2 : As-tu une politique de données clients?

### À décider

- [ ] Oui, j'écris une DPA / Privacy Policy
- [ ] Non, j'attends qu'un client demande
- [ ] Oui, j'achète template standard

```
Choix: _________________________________________
```

### Implications si tu dis OUI

**Légal :**
- DPA (Data Processing Agreement) = document OBLIGATOIRE
- Clients demandent: "Où sont mes données?"
- CNIL: tu dois avoir trace écrite

**À faire :**
- [ ] Rédiger DPA (ou faire rediger)
- [ ] L'envoyer à clients avant signature contrat
- [ ] Documenter où données stockées
- [ ] Mettre à jour si infra change

**Coûts :**
- Template: 200–500 €
- Avocat: 1 000–2 000 €

---

## ✅ Décision 5.3 : Publies-tu un incident public?

### À décider (avant que ça arrive)

- [ ] Oui, transparence absolue si incident
- [ ] Non, on gère discrètement
- [ ] Oui mais après correction (délai 24h)

```
Politique incident: _________________________________________
```

### Implications si tu dis OUI à transparence

**Image :**
- ✅ Clients respectent honnêteté
- ✅ Presse: "startup responsable"
- ⚠️ Mais certains clients paniqueront

**À faire :**
- [ ] Écrire template incident (voir exemple abaixo)
- [ ] Préparer team réponse
- [ ] Définir seuil escalade (quand publier?)

**Exemple message :**
```
"18h00 - Nous avons détecté une dégradation de service.
Nos équipes investigent. MAJ toutes les 30min.
Contact: support@..."
```

---

# 📊 BLOC 6 : PERFORMANCE & SCALABILITÉ

## ✅ Décision 6.1 : À quel seuil escalades-tu l'infra?

### Choix à valider

- [ ] 50% utilisation des ressources
- [ ] 70% utilisation
- [ ] 90% utilisation (risqué)
- [ ] Réactif (attendre crash)

```
Seuil escalade: ___________________
```

### Implications si tu dis OUI à 90%

**Problème :**
- Pas de marge pour spike traffic
- 1 client supplémentaire → down
- Réputation = ruinée

**À faire :**
- [ ] Alertes auto à 70%
- [ ] Plan escalade écrit (qui appeler?)
- [ ] Budget prévu pour scaler rapidement

---

# 🔄 BLOC 7 : BACKUP & DISASTER RECOVERY

## ✅ Décision 7.1 : As-tu testé une restauration DB?

### À décider

- [ ] Oui, j'ai testé restoration (quand?)
- [ ] Non, j'attends urgence réelle
- [ ] Oui, automatisé (testable)

```
Dernière restauration testée: ___________________
```

### Implications si tu dis NON

**Pire cas :**
- DB corrompue → impossible restaurer
- Clients données perdues → amende CNIL
- Startup morte

**À faire MAINTENANT :**
- [ ] Tester restauration depuis backup
- [ ] Noter temps restauration
- [ ] Documenter étapes
- [ ] Répéter chaque mois

---

## ✅ Décision 7.2 : Où sont les backups?

### Choix à valider

- [ ] Même région que prod (danger)
- [ ] Région différente (bon)
- [ ] 2 régions + hors-ligne (excellent)

```
Localisation backups: ___________________
```

### Implications si tu dis OUI à même région

**Risque :**
- Datacentre brûle → données perdues
- Attaque ransomware → backups aussi cryptés
- RTO (Recovery Time Objective) = catastrophique

**À faire :**
- [ ] Configurer backups multi-région
- [ ] 1 backup hors-ligne (stockage froid)
- [ ] Tester restauration de chaque backup

---

# ✍️ BLOC 8 : SIGNATURE & ENGAGEMENT

## DÉCLARATION FINALE

Je, **[nom]**, certifie avoir lu et compris l'ensemble de ce document.

Je **accepte les risques** et **responsabilités** listés ci-dessus pour :

- [ ] ✅ Sécurité & Accès (Bloc 1)
- [ ] ✅ Données clients (Bloc 2)
- [ ] ✅ Secrets & Clés (Bloc 3)
- [ ] ✅ Infra & Déploiement (Bloc 4)
- [ ] ✅ Conformité légale (Bloc 5)
- [ ] ✅ Performance & Scalabilité (Bloc 6)
- [ ] ✅ Backup & Recovery (Bloc 7)

**Signature:** ________________________________  
**Date:** ___________________________________  
**Lieu:** ___________________________________

---

### Témoin (optionnel)

Cofondateur / Investisseur / Conseiller:

**Nom:** ___________________________________  
**Signature:** ________________________________  
**Date:** ___________________________________  
**Rôle:** ___________________________________

---

# 📋 ANNEXE : CHECKLIST POST-SIGNATURE

Une fois signé, fais IMMÉDIATEMENT:

### Jour 1
- [ ] Créer fichier sécurisé avec ce document
- [ ] Envoyer à chaque personne nommée (on-call, accès secrets)
- [ ] Configurer MFA sur tous les accès prod

### Semaine 1
- [ ] Tester restauration DB complète
- [ ] Vérifier tous les secrets sont configurés
- [ ] Écrire la DPA / Privacy Policy

### Mois 1
- [ ] Faire audit sécurité interne
- [ ] Documenter procédures (runbooks)
- [ ] Former équipe sur incident response

### Trimestriel
- [ ] Rotation des secrets
- [ ] Test restauration
- [ ] Audit sécurité externe (si budget)

---

**Document créé:** 21 janvier 2026  
**Versioning:** v1.0  
**Prochaine révision:** [À définir]

---

**⚠️ IMPORTANT:**

Ce document n'est **pas un contrat légal**. C'est un outil de **responsabilisation fondateur**.

Pour des questions légales : **consulte un avocat**.  
Pour des questions sécurité : **audite régulièrement**.  
Pour des questions opérationnelles : **confie à une personne de confiance**.


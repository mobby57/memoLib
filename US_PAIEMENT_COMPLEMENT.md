# 💳 User Stories Paiement Manquantes - Complément Backlog

## 📋 Nouvelles User Stories à Ajouter

### US19 - Paiement en ligne sécurisé (Sprint 2)

**Type**: Story  
**Epic Link**: S2 - Orchestration Métier  
**Priority**: High  
**Story Points**: 8  
**Labels**: sprint2, p2, payment, stripe

**Description**:
En tant que client, je veux payer mes factures en ligne par carte bancaire afin d'accélérer le règlement et éviter les virements manuels.

**Acceptance Criteria**:
```
✓ Intégration Stripe Payment Intent
✓ Paiement CB sécurisé (3D Secure)
✓ Webhooks paiement (success, failed)
✓ Mise à jour automatique statut facture
✓ Email confirmation paiement
✓ Historique transactions visible
```

**Technical Tasks**:
- [ ] Compte Stripe configuré (sandbox + production)
- [ ] API POST /api/invoices/{id}/payment-intent
- [ ] Webhook POST /api/webhooks/stripe
- [ ] Frontend: Formulaire paiement (Stripe Elements)
- [ ] Table Transactions (id, invoice_id, amount, status, stripe_payment_id)
- [ ] Email confirmation paiement

**Definition of Done**:
- [ ] Paiement test réussi (sandbox)
- [ ] Webhooks testés (success, failed, refund)
- [ ] Statut facture mis à jour automatiquement
- [ ] Email envoyé au client

---

### US20 - Relances automatiques impayés (Sprint 2)

**Type**: Story  
**Epic Link**: S2 - Orchestration Métier  
**Priority**: High  
**Story Points**: 5  
**Labels**: sprint2, p2, payment, automation

**Description**:
En tant que finance, je veux que les relances impayés soient envoyées automatiquement (J+15, J+30, J+60) afin de réduire le délai de paiement moyen.

**Acceptance Criteria**:
```
✓ Relances automatiques J+15, J+30, J+60
✓ Templates emails personnalisables
✓ Stop relances si paiement reçu
✓ Escalade manager si J+60
✓ Historique relances traçable
```

**Technical Tasks**:
- [ ] Job scheduler relances (Hangfire)
- [ ] Templates emails relance (3 niveaux)
- [ ] API GET /api/invoices/overdue
- [ ] Détection paiement (stop relances)
- [ ] Notification manager J+60
- [ ] Table ReminderHistory (invoice_id, sent_at, level)

**Definition of Done**:
- [ ] Relances envoyées automatiquement
- [ ] Stop si paiement détecté
- [ ] Escalade manager testée
- [ ] Historique visible

---

### US21 - Comptabilité avancée (Sprint 3)

**Type**: Story  
**Epic Link**: S3 - Différenciation Produit  
**Priority**: Medium  
**Story Points**: 8  
**Labels**: sprint3, p3, accounting, export

**Description**:
En tant que comptable, je veux exporter les factures vers mon logiciel comptable (format FEC) afin d'automatiser la saisie comptable.

**Acceptance Criteria**:
```
✓ Export FEC (Fichier Écriture Comptable)
✓ TVA multi-taux (20%, 10%, 5.5%)
✓ Avoir/remboursement géré
✓ Synchronisation comptable (API)
✓ Rapprochement bancaire
```

**Technical Tasks**:
- [ ] Export FEC (format XML/CSV)
- [ ] Gestion TVA multi-taux
- [ ] API POST /api/invoices/{id}/credit-note (avoir)
- [ ] Intégration API comptable (optionnel)
- [ ] Rapprochement bancaire manuel
- [ ] Tests conformité FEC

**Definition of Done**:
- [ ] Export FEC validé par comptable
- [ ] TVA calculée correctement
- [ ] Avoir fonctionnel
- [ ] Import testé dans logiciel comptable

---

### US22 - Abonnements récurrents (Sprint 3)

**Type**: Story  
**Epic Link**: S3 - Différenciation Produit  
**Priority**: Low  
**Story Points**: 8  
**Labels**: sprint3, p3, subscription, recurring

**Description**:
En tant que cabinet, je veux proposer des abonnements mensuels à mes clients (forfait heures) afin de lisser les revenus et fidéliser.

**Acceptance Criteria**:
```
✓ Création abonnement (montant, fréquence)
✓ Prélèvement automatique mensuel
✓ Gestion crédit heures
✓ Alerte dépassement forfait
✓ Résiliation traçable
```

**Technical Tasks**:
- [ ] Table Subscriptions (client_id, amount, frequency, status)
- [ ] Stripe Subscription API
- [ ] Job prélèvement mensuel
- [ ] Gestion crédit heures
- [ ] Alertes dépassement
- [ ] API résiliation

**Definition of Done**:
- [ ] Abonnement créé et actif
- [ ] Prélèvement automatique testé
- [ ] Crédit heures décompté
- [ ] Résiliation fonctionnelle

---

## 📊 Impact sur Planning

### Backlog Mis à Jour

**Total**: 166 story points (vs 142)  
**Ajout**: +24 points (paiement)

### Répartition Sprints

**Sprint 2** (45 → 58 pts)
- US7 - Facturation base (13 pts)
- US16 - Pipeline finance (8 pts)
- **US19 - Paiement en ligne (8 pts)** ⭐ NOUVEAU
- **US20 - Relances auto (5 pts)** ⭐ NOUVEAU
- US13-15 (24 pts)

**Sprint 3** (42 → 58 pts)
- US8-9 (21 pts)
- US17-18 (21 pts)
- **US21 - Comptabilité avancée (8 pts)** ⭐ NOUVEAU
- **US22 - Abonnements (8 pts)** ⭐ NOUVEAU

### Durée Ajustée

**Option 1 - Garder 12 semaines**
- Augmenter vélocité: 13.8 pts/sem (vs 11.8)
- Risque: Surcharge équipe

**Option 2 - Étendre à 14 semaines** ✅ RECOMMANDÉ
- Vélocité stable: 11.8 pts/sem
- Sprint 2: 5 semaines (58 pts)
- Sprint 3: 5 semaines (58 pts)

**Option 3 - Reporter US22 (abonnements)**
- Garder 12 semaines
- US22 en backlog futur (nice-to-have)
- Total: 158 pts

---

## 🎯 Recommandation

### Ajouter US19-20 (Paiement Essentiel)

**Priorité Haute** - Sprint 2
- US19 - Paiement en ligne (8 pts)
- US20 - Relances auto (5 pts)

**Justification**:
- ✅ Réduit délai paiement de 30%
- ✅ Améliore trésorerie cabinet
- ✅ Expérience client moderne
- ✅ ROI immédiat

### Reporter US21-22 (Comptabilité Avancée)

**Priorité Basse** - Post-MVP
- US21 - Comptabilité avancée (8 pts)
- US22 - Abonnements (8 pts)

**Justification**:
- ⚠️ Complexité élevée
- ⚠️ Besoin métier moins urgent
- ⚠️ Peut être ajouté en V2

---

## 📋 Action Immédiate

### Mettre à Jour Jira

```
1. Créer US19 - Paiement en ligne
   - Epic: S2 - Orchestration Métier
   - Priority: High
   - Story Points: 8
   - Sprint: Sprint 2

2. Créer US20 - Relances automatiques
   - Epic: S2 - Orchestration Métier
   - Priority: High
   - Story Points: 5
   - Sprint: Sprint 2

3. Ajuster capacité Sprint 2
   - Avant: 45 pts
   - Après: 58 pts
   - Durée: 4 → 5 semaines
```

### Mettre à Jour CSV Import

Ajouter lignes dans `JIRA_IMPORT_BACKLOG_S1_S3.csv`:
```csv
Story,"US19 - Paiement en ligne sécurisé","En tant que client, je veux payer mes factures en ligne par CB afin d'accélérer le règlement.\n\nAC:\n- Intégration Stripe Payment Intent.\n- Paiement CB sécurisé (3D Secure).\n- Webhooks paiement.\n- Mise à jour automatique statut facture.",,"S2 - Orchestration Métier",8,High,"sprint2,p2,payment,stripe"

Story,"US20 - Relances automatiques impayés","En tant que finance, je veux que les relances impayés soient envoyées automatiquement (J+15, J+30, J+60).\n\nAC:\n- Relances automatiques J+15, J+30, J+60.\n- Templates emails personnalisables.\n- Stop relances si paiement reçu.",,"S2 - Orchestration Métier",5,High,"sprint2,p2,payment,automation"
```

---

## ✅ Conclusion

**Paiement Géré**: ✅ Partiellement (US7, US16)  
**Manques Critiques**: US19 (paiement en ligne), US20 (relances)  
**Recommandation**: Ajouter US19-20 au Sprint 2 (+13 pts)  
**Impact Planning**: +1 semaine Sprint 2 (4→5 semaines)

**Backlog complet avec paiement: 155 pts sur 13 semaines** 🎯

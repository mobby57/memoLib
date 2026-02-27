# 🚀 Plan Exécution Final - 13 Semaines (avec Paiement)

## 📊 Vue d'Ensemble

**Durée**: 13 semaines (3 sprints: 4+5+4)  
**Total**: 155 story points  
**Vélocité**: 11.9 points/semaine  
**Équipe**: 6 personnes  
**Budget**: 156 000€ (13 semaines × 6 personnes × 2000€)

---

## 🎯 SPRINT 1 (Semaines 1-4) - Centralisation Multi-Rôles

**Capacité**: 55 story points  
**Durée**: 4 semaines

### User Stories
- US1 - Ingestion multi-canaux (8 pts)
- US2 - Notes collaboratives (5 pts)
- US3 - Tâches dossier (5 pts)
- US4 - Documents versionnés (8 pts)
- US5 - Permissions + audit (8 pts)
- US10 - Portail client (8 pts)
- US11 - Upload client guidé (5 pts)
- US12 - Triage assistant (8 pts)

### KPI Sprint 1
- Temps qualification: 5 min → 3.5 min (-30%)
- Dossiers complets 48h: 60% → 75%
- Taux centralisation: 70% → >90%

---

## ⚡ SPRINT 2 (Semaines 5-9) - Orchestration + Paiement

**Capacité**: 58 story points ⭐ +13 pts paiement  
**Durée**: 5 semaines ⭐ +1 semaine

### User Stories Core
- US6 - Calendrier/SLA (8 pts)
- US7 - Facturation base (13 pts)
- US13 - Checklist passation (5 pts)
- US14 - Vue 360 juriste (8 pts)
- US15 - Charge équipe (8 pts)
- US16 - Pipeline finance (8 pts)

### User Stories Paiement ⭐ NOUVEAU
- **US19 - Paiement en ligne** (8 pts)
- **US20 - Relances automatiques** (5 pts)

### KPI Sprint 2
- % échéances tenues: 75% → >85%
- Délai clôture→facture: 10j → <5j
- **Délai paiement moyen: 45j → 30j** ⭐ NOUVEAU
- **Taux paiement en ligne: 0% → 40%** ⭐ NOUVEAU

---

## 🚀 SPRINT 3 (Semaines 10-13) - Différenciation

**Capacité**: 42 story points  
**Durée**: 4 semaines

### User Stories
- US8 - Automatisations métier (13 pts)
- US9 - Reporting direction (8 pts)
- US17 - Conformité RGPD (13 pts)
- US18 - Monitoring admin (8 pts)

### KPI Sprint 3
- Tâches auto-générées: 20% → 60%
- Temps admin: 8h/sem → 6h/sem
- Marge/dossier: 1200€ → 1320€
- CSAT: 4.0/5 → >4.3/5

---

## 💳 Détail US Paiement

### US19 - Paiement en ligne sécurisé (8 pts)

**Semaine 7-8**

**Technical Tasks**:
```
☐ Compte Stripe (sandbox + production)
☐ API POST /api/invoices/{id}/payment-intent
☐ Webhook POST /api/webhooks/stripe
☐ Frontend: Stripe Elements
☐ Table Transactions (invoice_id, amount, status, stripe_payment_id)
☐ Email confirmation paiement
```

**Acceptance Criteria**:
```
✓ Paiement CB sécurisé (3D Secure)
✓ Webhooks success/failed/refund
✓ Statut facture mis à jour auto
✓ Email confirmation envoyé
✓ Historique transactions visible
```

**ROI**:
- Délai paiement: -33% (45j → 30j)
- Taux paiement: +20% (65% → 85%)
- Gain trésorerie: +15 000€/mois

---

### US20 - Relances automatiques impayés (5 pts)

**Semaine 8-9**

**Technical Tasks**:
```
☐ Job scheduler relances (Hangfire)
☐ Templates emails (3 niveaux: J+15, J+30, J+60)
☐ API GET /api/invoices/overdue
☐ Détection paiement (stop relances)
☐ Notification manager J+60
☐ Table ReminderHistory (invoice_id, sent_at, level)
```

**Acceptance Criteria**:
```
✓ Relances J+15, J+30, J+60 automatiques
✓ Templates personnalisables
✓ Stop si paiement détecté
✓ Escalade manager J+60
✓ Historique traçable
```

**ROI**:
- Temps relances manuelles: -80% (2h → 0.4h/sem)
- Taux réponse relances: +40% (40% → 56%)
- Réduction impayés: -25%

---

## 📅 Planning Détaillé Sprint 2 (5 semaines)

### Semaine 5
- US6 - Calendrier/SLA (8 pts)

### Semaine 6
- US13 - Checklist passation (5 pts)
- US7 - Facturation base (début, 6 pts)

### Semaine 7
- US7 - Facturation base (fin, 7 pts)
- **US19 - Paiement en ligne (début, 4 pts)**

### Semaine 8
- **US19 - Paiement en ligne (fin, 4 pts)**
- **US20 - Relances auto (5 pts)**
- US14 - Vue 360 juriste (début, 4 pts)

### Semaine 9
- US14 - Vue 360 juriste (fin, 4 pts)
- US15 - Charge équipe (8 pts)
- US16 - Pipeline finance (8 pts)

---

## 👥 Assignation Sprint 2

| Rôle | US Assignées | Points |
|------|--------------|--------|
| Lead Backend | US6, US7, **US19**, **US20** | 34 |
| Lead Frontend | US14 | 8 |
| Ops Finance | US16, **US20** (collab) | 8 |
| Backend Dev | US13, US15 | 13 |

---

## 💰 ROI Paiement

### Gains Financiers

| Métrique | Avant | Après | Gain Annuel |
|----------|-------|-------|-------------|
| Délai paiement | 45j | 30j | +180 000€ trésorerie |
| Taux paiement | 65% | 85% | +120 000€ CA encaissé |
| Temps relances | 2h/sem | 0.4h/sem | +4 160€ productivité |
| **TOTAL** | | | **+304 160€/an** |

### Coût Développement

**US19 + US20**: 13 pts × 500€/pt = **6 500€**

**ROI**: 304 160€ / 6 500€ = **46.8x**  
**Break-even**: 8 jours

---

## 📊 Backlog Final

### Total: 20 User Stories, 155 Points

**Sprint 1** (55 pts): US1-5, US10-12  
**Sprint 2** (58 pts): US6-7, US13-16, **US19-20** ⭐  
**Sprint 3** (42 pts): US8-9, US17-18

### Répartition par Thème

| Thème | Points | % |
|-------|--------|---|
| Core (tous rôles) | 76 | 49% |
| Rôles spécifiques | 66 | 43% |
| **Paiement** ⭐ | **13** | **8%** |

---

## ✅ Critères de Succès Mis à Jour

### Sprint 2 (avec paiement)
- ✅ 100% US P1 livrées (US6-7, US13-16, **US19-20**)
- ✅ Délai clôture→facture <5 jours
- ✅ **Paiement en ligne opérationnel** ⭐
- ✅ **Délai paiement <30 jours** ⭐
- ✅ Vue 360 adoptée par 80% juristes

### Global (fin S3)
- ✅ Adoption >90% tous rôles
- ✅ **Taux paiement en ligne >40%** ⭐
- ✅ **Délai paiement -33%** ⭐
- ✅ ROI positif (gain temps > coût dev)
- ✅ CSAT >4.3/5

---

## 🎯 Actions Immédiates

### 1. Mettre à Jour Jira
```
☐ Import CSV mis à jour (US19-20 incluses)
☐ Ajuster capacité Sprint 2: 45 → 58 pts
☐ Ajuster durée Sprint 2: 4 → 5 semaines
```

### 2. Configuration Stripe
```
☐ Créer compte Stripe (sandbox)
☐ Obtenir clés API (test + production)
☐ Configurer webhooks
☐ Tester paiement test
```

### 3. Validation Équipe
```
☐ Présenter US19-20 à l'équipe
☐ Valider faisabilité technique
☐ Confirmer +1 semaine Sprint 2
```

---

## 📞 Configuration Stripe

### Étapes Setup
```
1. Créer compte: https://dashboard.stripe.com/register
2. Activer mode test
3. Obtenir clés API:
   - Publishable key: pk_test_...
   - Secret key: sk_test_...
4. Configurer webhooks:
   - URL: https://[votre-domaine]/api/webhooks/stripe
   - Events: payment_intent.succeeded, payment_intent.payment_failed
5. Tester avec carte test: 4242 4242 4242 4242
```

### Configuration User Secrets
```powershell
dotnet user-secrets set "Stripe:PublishableKey" "pk_test_..."
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..."
dotnet user-secrets set "Stripe:WebhookSecret" "whsec_..."
```

---

## 🚀 Prêt pour Démarrage

**Backlog complet**: ✅ 20 US, 155 pts  
**Paiement intégré**: ✅ US19-20  
**Planning ajusté**: ✅ 13 semaines  
**ROI paiement**: ✅ 46.8x  
**CSV Jira**: ✅ Mis à jour

**Démarrage Sprint 1 immédiat ! 🎯**

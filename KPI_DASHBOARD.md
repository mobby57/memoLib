# 📊 KPI Dashboard - MemoLib

## 🎯 Vue d'Ensemble

**Objectif**: Piloter l'activité par des métriques objectives et actionnables  
**Fréquence**: Mise à jour quotidienne, revue hebdomadaire  
**Responsable**: Product Owner + Data/BI

---

## 📈 KPI Opérationnels

### 1. Temps Qualification Message

**Définition**: Temps moyen entre réception d'un message et action (répondre, archiver, créer dossier)

**Formule**:
```sql
SELECT AVG(TIMESTAMPDIFF(MINUTE, received_at, action_at)) as avg_qualification_time
FROM inbox_messages
WHERE action_at IS NOT NULL
  AND received_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

**Seuils**:
- 🟢 Excellent: <2 min
- 🟡 Acceptable: 2-4 min
- 🔴 Critique: >4 min

**Baseline**: 5 min  
**Cible S1**: 3.5 min (-30%)  
**Cible S3**: 2 min (-60%)

**Actions si dérive**:
- Analyser types de messages longs à qualifier
- Former équipe sur raccourcis clavier
- Améliorer suggestions IA

---

### 2. % Dossiers Complets 48h

**Définition**: Pourcentage de dossiers avec toutes les pièces et informations obligatoires sous 48h après création

**Formule**:
```sql
SELECT 
  COUNT(CASE WHEN completed_at <= DATE_ADD(created_at, INTERVAL 48 HOUR) THEN 1 END) * 100.0 / COUNT(*) as pct_complete_48h
FROM cases
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND status != 'DRAFT'
```

**Seuils**:
- 🟢 Excellent: >80%
- 🟡 Acceptable: 70-80%
- 🔴 Critique: <70%

**Baseline**: 60%  
**Cible S1**: 75% (+25%)  
**Cible S3**: 85% (+42%)

**Actions si dérive**:
- Relances automatiques pièces manquantes
- Checklist obligatoire à la création
- Alertes équipe si dossier incomplet >24h

---

### 3. Taux Centralisation

**Définition**: Pourcentage d'interactions captées dans la timeline unique vs interactions totales estimées

**Formule**:
```sql
SELECT 
  (SELECT COUNT(*) FROM events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) * 100.0 /
  (SELECT SUM(estimated_interactions) FROM interaction_estimates WHERE week = WEEK(NOW()))
  as centralization_rate
```

**Seuils**:
- 🟢 Excellent: >90%
- 🟡 Acceptable: 85-90%
- 🔴 Critique: <85%

**Baseline**: 70%  
**Cible S1**: >90%  
**Cible S3**: >95%

**Actions si dérive**:
- Vérifier webhooks actifs (email, SMS, Telegram)
- Former équipe à saisir interactions manuelles
- Audit canaux non connectés

---

### 4. % Actions Tracées

**Définition**: Pourcentage d'actions utilisateur loggées dans l'audit trail

**Formule**:
```sql
SELECT 
  (SELECT COUNT(*) FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) * 100.0 /
  (SELECT COUNT(*) FROM api_requests WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
  as pct_actions_logged
```

**Seuils**:
- 🟢 Excellent: >98%
- 🟡 Acceptable: 95-98%
- 🔴 Critique: <95%

**Baseline**: 80%  
**Cible S1**: >98%  
**Cible S3**: 100%

**Actions si dérive**:
- Vérifier middleware logging actif
- Identifier endpoints non loggés
- Tests automatisés audit trail

---

## ⏱️ KPI Productivité

### 5. % Échéances Tenues

**Définition**: Pourcentage de tâches terminées avant leur due_date

**Formule**:
```sql
SELECT 
  COUNT(CASE WHEN completed_at <= due_date THEN 1 END) * 100.0 / COUNT(*) as pct_deadlines_met
FROM case_tasks
WHERE due_date IS NOT NULL
  AND completed_at IS NOT NULL
  AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

**Seuils**:
- 🟢 Excellent: >85%
- 🟡 Acceptable: 75-85%
- 🔴 Critique: <75%

**Baseline**: 75%  
**Cible S2**: >85%  
**Cible S3**: >90%

**Actions si dérive**:
- Analyser causes retards (charge, complexité)
- Ajuster estimations durée tâches
- Renforcer rappels automatiques

---

### 6. Nb Retards Critiques

**Définition**: Nombre de retards >3 jours sur échéances priorité P1

**Formule**:
```sql
SELECT COUNT(*) as critical_delays
FROM case_tasks
WHERE priority = 1
  AND due_date < DATE_SUB(NOW(), INTERVAL 3 DAY)
  AND status != 'DONE'
```

**Seuils**:
- 🟢 Excellent: 0-2/mois
- 🟡 Acceptable: 3-5/mois
- 🔴 Critique: >5/mois

**Baseline**: 10/mois  
**Cible S2**: 7/mois (-30%)  
**Cible S3**: 3/mois (-70%)

**Actions si dérive**:
- Escalade automatique au manager
- Réassignation si surcharge
- Post-mortem sur causes

---

### 7. Tâches Auto-Générées

**Définition**: Pourcentage de tâches créées automatiquement par règles vs manuellement

**Formule**:
```sql
SELECT 
  COUNT(CASE WHEN created_by_rule_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as pct_auto_tasks
FROM case_tasks
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

**Seuils**:
- 🟢 Excellent: >50%
- 🟡 Acceptable: 30-50%
- 🔴 Critique: <30%

**Baseline**: 20%  
**Cible S3**: 60% (+40%)

**Actions si dérive**:
- Créer nouvelles règles d'automatisation
- Former équipe à utiliser templates
- Analyser tâches répétitives manuelles

---

### 8. Temps Administratif

**Définition**: Temps moyen hebdomadaire passé sur tâches administratives (saisie, relances, etc.)

**Formule**:
```sql
SELECT AVG(weekly_admin_hours) as avg_admin_time
FROM (
  SELECT user_id, WEEK(created_at) as week, SUM(duration_hours) as weekly_admin_hours
  FROM time_entries
  WHERE category IN ('admin', 'saisie', 'relance')
    AND created_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
  GROUP BY user_id, WEEK(created_at)
) as weekly_stats
```

**Seuils**:
- 🟢 Excellent: <5h/sem
- 🟡 Acceptable: 5-7h/sem
- 🔴 Critique: >7h/sem

**Baseline**: 8h/sem  
**Cible S3**: 6h/sem (-25%)

**Actions si dérive**:
- Identifier tâches automatisables
- Simplifier workflows
- Former sur outils productivité

---

## 💰 KPI Business

### 9. Délai Clôture → Facture

**Définition**: Délai moyen entre fin de prestation et émission de facture

**Formule**:
```sql
SELECT AVG(DATEDIFF(invoice_date, case_closed_at)) as avg_invoice_delay
FROM invoices i
JOIN cases c ON i.case_id = c.id
WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND c.status = 'CLOSED'
```

**Seuils**:
- 🟢 Excellent: <3 jours
- 🟡 Acceptable: 3-7 jours
- 🔴 Critique: >7 jours

**Baseline**: 10 jours  
**Cible S2**: <5 jours  
**Cible S3**: <3 jours

**Actions si dérive**:
- Automatiser génération préfacture
- Rappels équipe finance
- Simplifier validation factures

---

### 10. Taux Paiement à Échéance

**Définition**: Pourcentage de factures payées avant J+30

**Formule**:
```sql
SELECT 
  COUNT(CASE WHEN paid_at <= DATE_ADD(invoice_date, INTERVAL 30 DAY) THEN 1 END) * 100.0 / COUNT(*) as pct_paid_on_time
FROM invoices
WHERE invoice_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
  AND status = 'PAID'
```

**Seuils**:
- 🟢 Excellent: >80%
- 🟡 Acceptable: 70-80%
- 🔴 Critique: <70%

**Baseline**: 65%  
**Cible S2**: >80%  
**Cible S3**: >85%

**Actions si dérive**:
- Relances automatiques J+15, J+30
- Faciliter paiement (CB en ligne)
- Analyser clients mauvais payeurs

---

### 11. Marge par Dossier

**Définition**: Marge moyenne par dossier (CA facturé - coûts temps passé)

**Formule**:
```sql
SELECT AVG(margin) as avg_margin_per_case
FROM (
  SELECT 
    c.id,
    COALESCE(SUM(i.total), 0) - COALESCE(SUM(te.duration_hours * te.hourly_rate), 0) as margin
  FROM cases c
  LEFT JOIN invoices i ON i.case_id = c.id AND i.status = 'PAID'
  LEFT JOIN time_entries te ON te.case_id = c.id
  WHERE c.closed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY c.id
) as case_margins
```

**Seuils**:
- 🟢 Excellent: >1500€
- 🟡 Acceptable: 1000-1500€
- 🔴 Critique: <1000€

**Baseline**: 1200€  
**Cible S3**: 1320€ (+10%)

**Actions si dérive**:
- Identifier dossiers déficitaires
- Ajuster taux horaires
- Optimiser temps passé

---

### 12. Taux Conversion Prospect → Client

**Définition**: Pourcentage de prospects contactés devenant clients

**Formule**:
```sql
SELECT 
  COUNT(CASE WHEN status = 'CLIENT' THEN 1 END) * 100.0 / COUNT(*) as conversion_rate
FROM clients
WHERE first_contact_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND first_contact_at IS NOT NULL
```

**Seuils**:
- 🟢 Excellent: >40%
- 🟡 Acceptable: 30-40%
- 🔴 Critique: <30%

**Baseline**: 35%  
**Cible S3**: 40% (+15%)

**Actions si dérive**:
- Analyser raisons refus
- Améliorer pitch commercial
- Réduire délai réponse prospect

---

## 😊 KPI Qualité

### 13. CSAT (Customer Satisfaction Score)

**Définition**: Note moyenne de satisfaction client (échelle 1-5)

**Formule**:
```sql
SELECT AVG(rating) as avg_csat
FROM satisfaction_surveys
WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND rating IS NOT NULL
```

**Seuils**:
- 🟢 Excellent: >4.5/5
- 🟡 Acceptable: 4.0-4.5/5
- 🔴 Critique: <4.0/5

**Baseline**: 4.0/5  
**Cible S3**: >4.3/5

**Actions si dérive**:
- Analyser verbatims négatifs
- Former équipe sur points faibles
- Contacter clients insatisfaits

---

### 14. Taux Réponse Relances

**Définition**: Pourcentage de clients répondant aux relances automatiques

**Formule**:
```sql
SELECT 
  COUNT(CASE WHEN response_received = 1 THEN 1 END) * 100.0 / COUNT(*) as response_rate
FROM automated_reminders
WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

**Seuils**:
- 🟢 Excellent: >60%
- 🟡 Acceptable: 40-60%
- 🔴 Critique: <40%

**Baseline**: 40%  
**Cible S3**: >60%

**Actions si dérive**:
- Améliorer templates relances
- Tester canaux alternatifs (SMS, Telegram)
- Personnaliser messages

---

## 📊 Dashboard Visuel

### Vue Direction (Hebdomadaire)

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 KPI Semaine 42 (14-20 Oct 2025)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💰 BUSINESS                                                 │
│   CA: 45 000€ (+12% vs S41) 🟢                             │
│   Marge/dossier: 1 350€ (+8%) 🟢                           │
│   Conversion: 38% (+3%) 🟡                                  │
│                                                             │
│ ⏱️ PRODUCTIVITÉ                                             │
│   Échéances tenues: 87% 🟢                                  │
│   Retards critiques: 2 🟢                                   │
│   Temps admin: 6.2h/sem 🟡                                  │
│                                                             │
│ 🎯 OPÉRATIONNEL                                             │
│   Temps qualification: 2.8 min 🟢                           │
│   Dossiers complets 48h: 78% 🟡                             │
│   Taux centralisation: 92% 🟢                               │
│                                                             │
│ 😊 QUALITÉ                                                  │
│   CSAT: 4.4/5 🟢                                            │
│   Taux réponse relances: 58% 🟡                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Vue Opérationnelle (Quotidienne)

```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 ALERTES AUJOURD'HUI (20 Oct 2025)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔴 CRITIQUE                                                 │
│   • 3 dossiers incomplets >48h (Dossier #1234, #1235, #1236)│
│   • 1 retard critique P1 (Tâche "Appel OQTF" +5 jours)     │
│                                                             │
│ 🟡 ATTENTION                                                │
│   • 5 échéances dans 24h sans assignation                   │
│   • 2 factures impayées >45 jours                           │
│   • Temps admin Jean: 9h cette semaine                      │
│                                                             │
│ 🟢 OK                                                       │
│   • 12 dossiers clôturés cette semaine                      │
│   • 8 factures payées à échéance                            │
│   • 95% actions tracées                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔔 Système d'Alertes

### Alertes Temps Réel

| Condition | Destinataire | Canal | Action |
|-----------|--------------|-------|--------|
| Retard critique P1 >3j | Manager + Assigné | Email + Telegram | Escalade immédiate |
| Dossier incomplet >48h | Créateur dossier | In-app | Relance pièces |
| SLA en risque >80% | Assigné | Telegram | Prioriser |
| Facture impayée >60j | Finance + Manager | Email | Relance client |
| CSAT <3/5 | Manager | Email | Contacter client |

### Alertes Hebdomadaires

| Condition | Destinataire | Canal | Action |
|-----------|--------------|-------|--------|
| KPI rouge 2 semaines consécutives | Direction | Email | Plan d'action |
| Temps admin >8h/sem | Utilisateur | In-app | Formation outils |
| Taux centralisation <85% | Ops | Email | Audit canaux |
| Marge/dossier <1000€ | Direction | Email | Analyse rentabilité |

---

## 📈 Évolution Cibles

### Trajectoire S1 → S3

| KPI | Baseline | S1 | S2 | S3 | Amélioration |
|-----|----------|----|----|----|--------------| 
| Temps qualification | 5 min | 3.5 min | 2.5 min | 2 min | -60% |
| Dossiers complets 48h | 60% | 75% | 80% | 85% | +42% |
| Échéances tenues | 75% | 80% | 85% | 90% | +20% |
| Délai clôture→facture | 10j | 7j | 5j | 3j | -70% |
| Marge/dossier | 1200€ | 1250€ | 1300€ | 1350€ | +13% |
| CSAT | 4.0/5 | 4.1/5 | 4.2/5 | 4.3/5 | +8% |

---

## 🎯 Utilisation Dashboard

### Revue Hebdomadaire (1h)

**Agenda**:
1. **Présentation KPI** (10 min): Product Owner présente dashboard
2. **Analyse écarts** (20 min): Discussion causes KPI rouges/jaunes
3. **Plan d'actions** (20 min): Définition actions correctives avec owner/deadline
4. **Ajustement backlog** (10 min): Priorisation US selon KPI

**Livrables**:
- Compte-rendu avec actions (owner, deadline)
- Mise à jour backlog si nécessaire

### Démo Fin de Sprint (2h)

**Agenda**:
1. **Démo fonctionnalités** (45 min): Présentation US livrées
2. **Revue KPI sprint** (30 min): Atteinte cibles ?
3. **Feedback utilisateurs** (30 min): Retours terrain
4. **Planification S+1** (15 min): Validation backlog

**Livrables**:
- PV validation sprint
- Backlog S+1 priorisé

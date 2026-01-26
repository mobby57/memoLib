# Architecture Légale & Conformité - IA Poste Manager

> **Document destiné aux avocats, DPO et clients institutionnels**
> Version 1.0 - 26/01/2026

---

## 📋 Sommaire Exécutif

**IA Poste Manager** est une solution SaaS de gestion de secrétariat pour cabinets d'avocats, conforme aux exigences :
- **RGPD** (Règlement Général sur la Protection des Données)
- **Secret professionnel** (Art. 66-5 Loi du 31 décembre 1971)
- **Normes déontologiques** (RIN - Règlement Intérieur National)

---

## 1️⃣ QUALIFICATION JURIDIQUE DU SERVICE

### 1.1 Nature du Service

| Aspect | Qualification |
|--------|---------------|
| **Type** | Logiciel en tant que Service (SaaS) |
| **Éditeur** | [Votre société] |
| **Qualité RGPD** | Sous-traitant (Art. 28 RGPD) |
| **Client** | Responsable de traitement |

### 1.2 Périmètre Fonctionnel

- ✅ Gestion de dossiers clients (métadonnées)
- ✅ Calendrier et échéances
- ✅ Gestion multi-canal (email, WhatsApp, SMS)
- ✅ Génération de documents assistée
- ⚠️ **L'IA ne prend AUCUNE décision juridique**
- ⚠️ **L'IA n'a PAS accès au fond des dossiers sensibles**

---

## 2️⃣ CONFORMITÉ RGPD

### 2.1 Bases Légales des Traitements

| Traitement | Base Légale | Article |
|------------|-------------|---------|
| Compte utilisateur | Contrat | Art. 6.1.b |
| Gestion dossiers | Contrat | Art. 6.1.b |
| Sécurité/Logs | Intérêt légitime | Art. 6.1.f |
| Analytics | Consentement | Art. 6.1.a |
| Facturation | Obligation légale | Art. 6.1.c |

### 2.2 Données Traitées

#### Données Ordinaires
- Identifiants utilisateur (email, nom)
- Métadonnées dossiers (numéro, type, dates)
- Logs d'activité pseudonymisés

#### Données Sensibles (Art. 9)
| Donnée | Présence | Mesure |
|--------|----------|--------|
| Origine ethnique | Implicite (CESEDA) | Chiffrement + accès restreint |
| Santé | Non collectée | — |
| Opinions politiques | Non collectée | — |
| Données judiciaires | Métadonnées seulement | Isolation par tenant |

### 2.3 Transferts Hors UE

| Destinataire | Pays | Garantie | Document |
|--------------|------|----------|----------|
| Vercel | USA | SCCs (Art. 46) | DPA disponible |
| Neon | USA | SCCs (Art. 46) | DPA disponible |
| Stripe | USA | PCI-DSS + SCCs | DPA disponible |
| OpenAI | USA | DPA + SCCs | Contrat sur demande |

> **Note**: Données envoyées à OpenAI = prompts anonymisés, JAMAIS de données nominatives

### 2.4 Durées de Conservation

| Données | Durée | Base |
|---------|-------|------|
| Comptes utilisateurs | Durée contrat + 3 ans | Prescription civile |
| Dossiers clients | 10 ans | Obligation avocats |
| Logs sécurité | 1 an | Recommandation CNIL |
| Factures | 10 ans | Art. L123-22 C. commerce |
| Analytics | 2 ans | Proportionnalité |

---

## 3️⃣ SECRET PROFESSIONNEL

### 3.1 Garanties Techniques

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE SÉCURISÉE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Avocat A                    Avocat B                      │
│      │                           │                          │
│      ▼                           ▼                          │
│  ┌────────┐                 ┌────────┐                      │
│  │Tenant A│                 │Tenant B│   ← Isolation totale │
│  │(chiffré)│                │(chiffré)│                      │
│  └────────┘                 └────────┘                      │
│      │                           │                          │
│      └───────────┬───────────────┘                          │
│                  │                                          │
│                  ▼                                          │
│          ┌──────────────┐                                   │
│          │   Azure KV   │  ← Clés séparées par tenant       │
│          │  (HSM-backed)│                                   │
│          └──────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Engagements Contractuels

- ✅ **Personnel habilité** : Accès limité aux équipes techniques avec NDA
- ✅ **Pas d'accès au contenu** : L'éditeur n'accède JAMAIS au fond des dossiers
- ✅ **Chiffrement de bout en bout** : Documents sensibles chiffrés AES-256
- ✅ **Audit logs** : Traçabilité complète de tous les accès
- ✅ **Réversibilité** : Export complet des données sur demande

### 3.3 Cas de l'IA

| Aspect | Garantie |
|--------|----------|
| Accès aux dossiers | L'IA n'accède PAS au contenu des dossiers |
| Prompts utilisateur | Jamais de données nominatives transmises |
| Stockage OpenAI | 30 jours max, puis suppression |
| Décisions | L'IA SUGGÈRE, l'avocat DÉCIDE |

---

## 4️⃣ MESURES DE SÉCURITÉ (Art. 32 RGPD)

### 4.1 Sécurité Technique

| Mesure | Implémentation | Status |
|--------|----------------|--------|
| Chiffrement transit | TLS 1.3 | ✅ |
| Chiffrement repos | AES-256 | ✅ |
| Authentification | OAuth 2.0 + MFA | ✅ |
| Gestion secrets | Azure Key Vault | ✅ |
| Sauvegardes | Quotidiennes, chiffrées | ✅ |
| WAF | Cloudflare | ✅ |

### 4.2 Sécurité Organisationnelle

| Mesure | Status |
|--------|--------|
| Politique de sécurité documentée | ✅ |
| Sensibilisation équipes | ✅ |
| Tests d'intrusion annuels | 📅 Planifié |
| PCA/PRA | ✅ Documenté |
| Gestion des incidents | ✅ Procédure 72h |

### 4.3 Certifications & Audits

| Certification | Status | Prochaine échéance |
|--------------|--------|-------------------|
| SOC 2 Type II (Vercel) | ✅ Via sous-traitant | — |
| ISO 27001 | 📅 En cours | Q3 2026 |
| HDS (Hébergeur Données Santé) | ❌ Non applicable | — |

---

## 5️⃣ DROITS DES PERSONNES CONCERNÉES

### 5.1 Procédures Implémentées

| Droit | Délai | Canal |
|-------|-------|-------|
| **Accès** (Art. 15) | 30 jours | `POST /api/rgpd/access` |
| **Rectification** (Art. 16) | Immédiat | Interface utilisateur |
| **Effacement** (Art. 17) | 30 jours | `DELETE /api/rgpd/data` |
| **Portabilité** (Art. 20) | 30 jours | Export JSON/CSV |
| **Opposition** (Art. 21) | Immédiat | Paramètres compte |
| **Limitation** (Art. 18) | 30 jours | Support |

### 5.2 Contact DPO

- **Email**: dpo@iapostemanager.com
- **Courrier**: [Adresse à compléter]
- **Délai de réponse**: 30 jours (prolongeable 2 mois si complexe)

---

## 6️⃣ GESTION DES INCIDENTS

### 6.1 Procédure de Notification

```
Détection incident
       │
       ▼
┌──────────────┐
│ Qualification │ ← Risque pour personnes ?
│   (< 24h)     │
└──────┬───────┘
       │
       ├─── Risque FAIBLE ──→ Documentation interne
       │
       └─── Risque ÉLEVÉ ──→ Notification CNIL (72h)
                            + Notification personnes
```

### 6.2 Contact Urgence

- **Hotline sécurité**: security@iapostemanager.com
- **Astreinte**: [Numéro à définir]

---

## 7️⃣ CLAUSES CONTRACTUELLES

### 7.1 Documents Fournis

| Document | Objectif |
|----------|----------|
| CGU | Conditions générales utilisateur |
| CGV | Conditions générales de vente |
| DPA | Data Processing Agreement (Art. 28) |
| Politique confidentialité | Information personnes |
| Registre des traitements | Conformité Art. 30 |

### 7.2 Clauses Spécifiques Client Institutionnel

À inclure dans le contrat :

1. **Limitation de responsabilité IA**
   > "L'IA fournit des suggestions à titre indicatif. L'utilisateur reste seul responsable des décisions prises."

2. **Secret professionnel**
   > "L'éditeur s'engage à ne jamais accéder au contenu des dossiers clients de l'utilisateur sans son autorisation expresse."

3. **Réversibilité**
   > "En cas de résiliation, l'utilisateur peut exporter l'intégralité de ses données dans un format standard (JSON, CSV) dans un délai de 30 jours."

4. **Audit**
   > "L'utilisateur peut demander un audit de conformité une fois par an, aux frais de l'utilisateur."

---

## 8️⃣ ÉVOLUTIONS PRÉVUES

| Fonctionnalité | Impact RGPD | Échéance |
|----------------|-------------|----------|
| IA avancée (GPT-4) | Mise à jour DPA | Q2 2026 |
| Intégration RPVA | Nouvelle base légale | Q3 2026 |
| Analytics avancées | Consentement requis | Q4 2026 |

---

## 📎 ANNEXES

- **Annexe A**: Registre complet des traitements → `RGPD_REGISTRY.md`
- **Annexe B**: Politique de sécurité → `SECURITY_POLICY.md`
- **Annexe C**: PCA/PRA → `DISASTER_RECOVERY.md`
- **Annexe D**: Modèle DPA → Sur demande

---

## ✅ VALIDATION

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| DPO | [À désigner] | | |
| Direction | | | |
| Avocat conseil | | | |

---

*Document généré le 26/01/2026 - Version 1.0*
*Prochaine révision: 26/07/2026*

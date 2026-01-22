# CONFORMITÉ RGPD & DONNÉES

**IA POSTE MANAGER – Cadre Opérationnel de Protection des Données**

**Version 1.0 – 22 janvier 2026**

---

## EXECUTIVE SUMMARY

✅ **Conforme RGPD par design** : Chiffrement, isolation tenant, audit trail, consentements explicites
✅ **Secret professionnel respecté** : Zéro accès tiers, données client isolées, soft delete 7 ans
✅ **DPA avec Neon Supabase** : Hébergement EU, certifications ISO 27001
✅ **Registre des traitements** : Documenté et auditable
✅ **Privacy by default** : Minimisation données, consentement préalable

---

## 1. RESPONSABILITÉS RGPD

### 1.1 Rôles

| Acteur | Rôle RGPD |
|--------|-----------|
| **IA POSTE MANAGER (vous)** | Responsable de traitement (contrôle données) |
| **Neon Supabase** | Sous-traitant (hosting + backup) |
| **Utilisateur (avocat)** | Responsable conjoint (décisions juridiques) |
| **Clients finaux** | Personnes concernées |

### 1.2 Responsabilité conjointe (Avocat + Plateforme)

**Partage des responsabilités :**

| Aspect | Qui | Pourquoi |
|--------|-----|---------|
| Légalité du traitement | Avocat | Secret professionnel, conflits intérêts |
| Sécurité données | Platform | Infrastructure, chiffrement |
| Consentements clients | Avocat | Relation contractuelle directe |
| Droit d'accès | Plateforme | Accès technique, export données |
| Suppression | Plateforme | Respect délai rétention |

---

## 2. REGISTRE DES TRAITEMENTS (ART. 30)

### 2.1 Traitements principaux

#### Traitement 1 : Gestion des dossiers clients

| Champ | Valeur |
|-------|--------|
| **Nom** | Gestion dossiers clients (CESEDA, droits administratif) |
| **Base légale** | Contrat + intérêt légitime (exercice droit) |
| **Données** | Noms, adresses, numéros ID, dossier juridique |
| **Durée** | 7 ans (secret professionnel) |
| **Sous-traitants** | Neon Supabase (DB), Stripe (paiements) |
| **Transferts** | AUCUN hors EU (sauf avec consentement) |
| **Droit** | Accès, rectification, portabilité, oubli |

#### Traitement 2 : IA Classification

| Champ | Valeur |
|-------|--------|
| **Nom** | Classification/suggestion via IA |
| **Base légale** | Contrat (amélioration service) |
| **Données** | Contenus anonymisés (pas noms/addresses) |
| **Durée** | 30 jours (pas conservation) |
| **Sous-traitants** | Ollama (local, pas transfert) |
| **Transferts** | AUCUN (modèle local) |

#### Traitement 3 : Audit Logs

| Champ | Valeur |
|-------|--------|
| **Nom** | Audit trail (traçabilité accès) |
| **Base légale** | Obligation légale (sécurité) + intérêt légitime |
| **Données** | User ID, action, IP, timestamp (PAS contenu) |
| **Durée** | 1 an |
| **Sous-traitants** | PostgreSQL (DB) |
| **Transferts** | AUCUN |

### 2.2 Absence de cookie

✅ **Zéro cookie** : Authentification JWT (token session)
✅ **Zéro tracking** : Pas de Google Analytics / Facebook Pixel

---

## 3. DROITS DES PERSONNES CONCERNÉES (ARTICLES 15-22)

### 3.1 Droit d'accès (Art. 15)

**Demande :** Personne concernée → Avocat (responsable direct) → Plateforme

**Processus :**
1. Avocat reçoit demande écrite (email)
2. Transmet à plateforme avec ID utilisateur
3. Plateforme génère export JSON/CSV
4. Retour 30j (10j extraction + 20j transmission)

**Format :** JSON standardisé + documentation lisible

### 3.2 Droit de rectification (Art. 16)

**Qui peut ?** Personne concernée (via avocat) + avocat lui-même

**Processus :**
1. Interface utilisateur : champs éditables (frontend)
2. historique modification : logged (audit trail)
3. ancien + nouveau : conservés

**Délai :** Immédiat (pas de workflow)

### 3.3 Droit à l'oubli (Art. 17)

**Applicable sauf :**
- Secret professionnel (7 ans)
- Obligation légale
- Intérêt public

**Processus :**
1. Soft delete : données masquées (utilisateur ne les voit plus)
2. Rétention : 7 ans après fermeture dossier
3. Purge physique : script batch après délai

**Délai :** 30j après demande

### 3.4 Droit de portabilité (Art. 20)

**Format :** JSON (machine-readable)
**Contenu :** Toutes données personnelles traitées
**Délai :** 30j

**Export inclut :**
```json
{
  "profil": { "nom", "email", "adresse", "natio" },
  "dossiers": [
    {
      "id", "titre", "type", "dates", "acteurs",
      "documents": []
    }
  ],
  "historique": "audit_trail_complete.json"
}
```

### 3.5 Droit d'opposition (Art. 21)

✅ **IA suggestions** : Opposition possible (opt-out in-app)
✅ **Marketing** : Opposition automatique (jamais de mailing)
✅ **Transferts** : Jamais de transfert sans consentement

---

## 4. CONSENTEMENTS (ART. 4 & 7)

### 4.1 Consentements requis

| Type | Requis | Moment | Révocable |
|------|--------|--------|-----------|
| **Utilisation service** | OUI | Signature contrat | Terminaison contrat |
| **IA suggestions** | OUI | Onboarding | In-app (opt-out) |
| **Transferts données** | OUI | Consentement écrit | Oui |
| **Marketing** | Non | N/A | N/A (jamais envoyé) |
| **Cookies** | Non | N/A (aucun) | N/A |

### 4.2 Format consentement

**Checkbox explicite (pas d'opt-out par défaut) :**

```html
☐ J'autorise IA POSTE MANAGER à traiter mes données
  pour gestion dossiers juridiques (requis)

☐ J'autorise l'IA à générer suggestions 
  (optionnel, révocable anytime)

☐ J'autorise transfert données vers [SOUS-TRAITANT]
  (optionnel, révocable)
```

### 4.3 Révocation

**In-app** : Utilisateur peut révoquer anytime
- Email → Notification immediate
- Pas de pénalité
- Données pas supprimées (juste non-traitées)

---

## 5. SÉCURITÉ DONNÉES (ART. 32)

### 5.1 Chiffrement

**En transit :**
- ✅ TLS 1.3 obligatoire
- ✅ Certificat Let's Encrypt
- ✅ HSTS headers

**Au repos :**
- ✅ AES-256 CBC (PostgreSQL)
- ✅ Clés dans gestionnaire secrets (Vault)
- ✅ Clés rotation 90j

### 5.2 Isolation tenant

**Multi-tenant isolation :**
```sql
-- Toute requête filtrée par tenant_id
SELECT * FROM dossier 
WHERE tenant_id = $1 AND ... -- OBLIGATOIRE
```

**Super admin ≠ accès contenu**
- Peut voir métadonnées (structure)
- Jamais contenu clients (noms, documents, stratégie)

### 5.3 Backup & Disaster Recovery

**Stratégie :**
- Snapshots quotidiens
- Rétention : 30 jours
- Géo-replication : EU uniquement
- RPO (Recovery Point Objective) : < 1h
- RTO (Recovery Time Objective) : < 4h

**Test restauration :** Mensuel

### 5.4 Access Control

**Authentification :**
- MFA obligatoire (TOTP ou email)
- Sessions JWT (15 min default)
- Revocation immediate possible

**Autorisation :**
- RBAC (Role-Based Access Control)
- Admin > Lawyer > Clerk
- Audit chaque action (user, action, resource, result)

### 5.5 Suppression sécurisée

**Données sensibles (dossiers, documents) :**
```
Soft delete → masquage immédiat
7 ans de rétention → archivage crypté
Purge physique → destruction sécurisée (DBAN / shredding)
```

---

## 6. SOUS-TRAITANTS (ART. 28)

### 6.1 Liste sub-traitants

| Sous-traitant | Service | Localisation | DPA | Justification |
|---|---|---|---|---|
| **Neon Supabase** | Database hosting | EU (Frankfurt) | ✅ Oui | PostgreSQL managed |
| **Stripe** | Paiements | EU (Ireland) | ✅ Oui | Facturation |
| **SendGrid** | Email notifications | EU | ✅ Oui | Alertes dossiers |

### 6.2 Contrat de traitement des données (DPA)

**Chaque sous-traitant signé DPA couvrant :**
- ✅ Sécurité données (ISO 27001)
- ✅ Confidentialité
- ✅ Prohibition sous-traitance sans accord
- ✅ Audit droit
- ✅ Suppression données après contrat

**DPA de Neon Supabase :**
```
✅ Certifié ISO 27001
✅ SOC 2 Type II
✅ GDPR Data Processing Addendum signé
✅ Zéro tiers-transfert hors EU
```

### 6.3 Notification sous-traitants

**Si violation données :**
- Sous-traitant notifie plateforme sous 24h
- Plateforme notifie CNIL sous 72h
- Plateforme notifie utilisateurs

---

## 7. IMPACT ASSESSMENT (DPIA)

### 7.1 Nécessité DPIA

**OUI - Traitement haute-risque :**
- Données sensibles (santé via contexte légal)
- IA décisional (classification)
- Données enfants possibles (situations familiales)
- Profiling indirect (pattern clients)

### 7.2 Risques identifiés

| Risque | Niveau | Mitigation |
|--------|--------|-----------|
| Accès non-autorisé | Élevé | Chiffrement + MFA + audit logs |
| Mauvaise classification IA | Moyen | Validation humaine requise |
| Rétention excessive | Moyen | Purge auto après 7 ans |
| Transfert unauthorized | Élevé | Zéro transfert hors EU |
| Profiling | Moyen | Pas de scoring automatique |

### 7.3 Conclusion DPIA

**Risk Level : ACCEPTABLE** (avec mitigations appliquées)

---

## 8. VIOLATION & NOTIFICATION (ART. 33-34)

### 8.1 Processus notification

**Timeline légal :**
1. **Instant** : Incident détecté
2. **24h** : Investigation initiale
3. **72h** : Notification CNIL
4. **Sans délai** : Notification utilisateurs (grave)

### 8.2 Communication

**Email utilisateurs :**
```
Sujet: [URGENT] Notification Violation Données - IA POSTE MANAGER

Contenu:
- Description incident
- Type données concernées
- Risque pour vous
- Actions recommandées
- Contact support
```

### 8.3 Rapport incident

**Post-mortem 48h après :**
- Root cause analysis
- Timeline événement
- Données impactées
- Mesures correctives
- Recommandations futures

---

## 9. TRANSFERTS INTERNATIONAUX

### 9.1 Politique stricte : EU SEULEMENT

**Aucun transfert vers :**
- ❌ USA (Cloud Act)
- ❌ Cloud providers non-EU
- ❌ Pays sans régulation données

**Exceptions :**
- ✅ Sous-traitants EU + DPA + SCCs
- ✅ Client consent explicite écrit

---

## 10. PRIVACY BY DEFAULT (ART. 25)

### 10.1 Minimisation

**Collecté :**
- ✅ Données strictement nécessaires (nom, email, dossier)

**Non collecté :**
- ❌ IP utilisateur (sauf logs sécurité)
- ❌ Cookies tracking
- ❌ Location data
- ❌ Device fingerprint

### 10.2 Rétention

**Données vivantes :** Pendant contrat
**Données archivées :** 7 ans
**Purge :** Après 7 ans

**Exception :** Audit logs (1 an seulement)

---

## 11. DPIA DOCUMENTATION

### 11.1 Modèle DPIA (Template)

```markdown
# DPIA – IA POSTE MANAGER

## 1. Objectifs traitement
Gestion dossiers juridiques + IA suggestions

## 2. Données personnelles
Noms, adresses, dossiers client, documents

## 3. Destinataires
Équipe cabinet uniquement, jamais tiers

## 4. Risques
[Matrice probabilité x impact]

## 5. Mitigations
[Techniques + organisationnelles]

## 6. Conclusion
Acceptable / Non-acceptable / Acceptable with conditions
```

---

## 12. CONFORMITÉ CNIL / AUTORITÉS

### 12.1 Registre CNIL

**Déclaration :**
- ✅ Déclarée auprès CNIL (si nécessaire)
- ✅ Numéro enregistrement : [À remplir]
- ✅ Mise à jour annuelle obligatoire

### 12.2 Audit CNIL

**En cas contrôle CNIL :**
- ✅ Registry des traitements
- ✅ DPA avec sous-traitants
- ✅ Audit logs (1 an)
- ✅ Consentements signés
- ✅ DPIA documentée

### 12.3 Droit audit données

**Utilisateurs ont droit :**
- ✅ Accès audit logs (ses propres actions)
- ✅ Export complet données
- ✅ Vérification conformité

---

## 13. FORMATION & SENSIBILISATION

### 13.1 Équipe interne

**Obligation :** Formation RGPD annuelle
- Sensibilisation confidentialité
- Processus incident
- Secret professionnel
- Sécurité données

### 13.2 Utilisateurs

**Onboarding :**
- ☑️ Acceptation CGU
- ☑️ Acceptation RGPD
- ✅ Checkliste conformité

---

## 14. POLITIQUE DE SUPPRESSION

### 14.1 Suppression utilisateur-initiée

**Utilisateur supprime dossier :**
1. **Soft delete** : Masqué immédiatement
2. **Audit log** : Enregistrement suppression
3. **Récupération** : Possible 30j (backup)
4. **Purge** : Après 30j

### 14.2 Suppression non-utilisée

**Données inactives 2 ans :**
- Email de relance (90j avertissement)
- Avertissement in-app
- Suppression auto après relance

---

## 15. CONTACT DPO / RESPONSABLE RGPD

**Responsable RGPD :**
📧 Email : **[dpo@yourcompany.com](mailto:dpo@yourcompany.com)**
📞 Phone : **[VOTRE PHONE]**
🏢 Adresse : **[VOTRE ADRESSE LÉGALE]**

**Demandes données (Art. 15-22) :**
✉️ Transmettre via avocat utilisateur

---

## 16. RÉVISIONS

**Politique mise à jour :**
- Annuelle (minimum)
- Après incident
- Après changement juridique

**Historique :**
- v1.0 : 22/01/2026 - Initial

---

**Fin Conformité RGPD**

✅ **Attestation Conformité :** Ce document certifie la conformité RGPD du service IA POSTE MANAGER.

Signé digitalement : [DATE SIGNATURE]

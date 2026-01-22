# SERVICE LEVEL AGREEMENT (SLA)

**IA Poste Manager — Édition 2026**

---

## PRÉAMBULE

Ce Service Level Agreement (« **SLA** ») formalise les garanties de performance et de disponibilité du Service **IA Poste Manager**.

**Période d'application :** 1er février 2026 → continuation annuelle  
**Mesure :** Calendrier UTC (00:00 - 23:59 UTC)  
**Facturation :** Déduit de la facture si manquement (voir section 5)

---

## 1. GARANTIES DE DISPONIBILITÉ

### 1.1 Cible de disponibilité (Uptime)

| Plan | Cible mensuelle | Maintenance approuvée |
|------|-----------------|----------------------|
| Starter | 99.0% | 7h30/mois |
| Pro | 99.5% | 3h40/mois |
| Enterprise | 99.9% | 40 min/mois |

### 1.2 Définition de "disponibilité"

Le Service est considéré **disponible** si :

✅ L'authentification fonctionne  
✅ L'API répond (< 5s par requête en moyenne)  
✅ Les logs d'audit sont accessibles  
✅ L'export de données fonctionne  

Le Service est considéré **indisponible** si :

❌ Impossible de se connecter > 30 minutes  
❌ Impossible de créer une Information Unit  
❌ Impossible de consulter un Information Unit existant  
❌ Logs d'audit inaccessibles  

**Note :** Les pannes de réseau client ou des navigateurs n'affectent pas ce SLA.

### 1.3 Exceptions à la cible

La cible **ne s'applique pas** pour :

❌ Maintenance programmée (48h de préavis, hors heures de travail)  
❌ Force majeure (coupure réseau national, cyberattaque mondiale)  
❌ Incident tiers (panne Cloudflare, fournisseur d'énergie)  

---

## 2. PERFORMANCE

### 2.1 Temps de réponse (P95)

| Action | Cible P95 | Seuil critique |
|--------|-----------|----------------|
| Connexion | < 500ms | > 2s = incident |
| Charger Information Units | < 1s | > 3s = incident |
| Créer Information Unit | < 500ms | > 2s = incident |
| Exporter audit trail | < 5s | > 15s = incident |
| Recherche texte | < 2s | > 5s = incident |

**P95 = 95% des requêtes répondent en moins que ce délai.**

### 2.2 Monitoring continu

L'Éditeur surveille :

✅ Temps de réponse API (chaque minute)  
✅ Taux d'erreur (chaque minute)  
✅ Stockage disque (chaque heure)  
✅ Connexion base de données (chaque minute)  

---

## 3. SUPPORT TECHNIQUE

### 3.1 Niveaux de severité

| Severité | Description | Réponse cible | Résolution cible |
|----------|-------------|---------------|-----------------|
| **CRITIQUE** | Service entièrement indisponible | 15 min | 4 heures |
| **HAUTE** | Fonctionnalité clé affectée (création dossiers impossible) | 1 heure | 8 heures |
| **MOYENNE** | Fonctionnalité mineure affectée (recherche lente) | 4 heures | 24 heures |
| **BASSE** | Question produit, amélioration mineure | 24 heures | 72 heures |

### 3.2 Canaux de support

**Starter / Pro :**
* Email : support@iapostemanager.com
* Réponse : Heures de bureau (09h-18h CET, lun-ven)

**Enterprise :**
* Email : priority@iapostemanager.com
* Téléphone : Sur demande
* Réponse : 24h/24, 7j/7 (incluant weekends)

### 3.3 Limitation du support

L'Éditeur ne supportera pas :

❌ Configuration de navigateurs externes  
❌ Récupération de données perdues (hors backup < 90j)  
❌ Problèmes d'intégration applicatives tiers  
❌ Déploiement personnalisé  

---

## 4. GARANTIES DE SÉCURITÉ & TRAÇABILITÉ

### 4.1 Audit trail (Information Units)

**Garantie :** Chaque Information Unit dispose d'un audit trail complet et immuable.

* **Statut** : Toujours présent (jamais NULL)
* **Historique** : Append-only (jamais modifié rétrospectivement)
* **Horodatage** : Précision à la seconde
* **Acteur** : Identité du responsable du changement
* **Disponibilité** : 100% du temps pour consultation et export

**SLA :** Export complet < 5 minutes

### 4.2 Intégrité des données

**Garantie :** Les Information Units ne peuvent pas disparaître de la base sans trace.

* Aucune suppression directe possible
* Suppression logique uniquement (statut "ARCHIVED")
* Tous les archived restent queryables
* Export inclut les archived

**Vérification :** Tous les logs passent par hash SHA-256 (prouvable).

### 4.3 Chiffrement des données au repos

**Garantie :** Toutes les données sont chiffrées AES-256 au repos.

* Clés de chiffrement stockées séparément
* Aucun accès Éditeur au contenu en clair
* Chiffrement couche application + base de données

---

## 5. REMBOURSEMENT EN CAS DE MANQUEMENT

### 5.1 Calcul du remboursement

Si le Service ne respecte pas les cibles de disponibilité :

| Disponibilité réelle | % de remboursement mensuel |
|----------------------|----------------------------|
| 99.0% à 99.5% | 5% de la facture |
| 98.5% à 99.0% | 10% de la facture |
| 98.0% à 98.5% | 25% de la facture |
| < 98.0% | 50% de la facture |

**Exemple :** Pro à 149€ avec 99.0% uptime = remboursement de 7,45€

### 5.2 Procédure de réclamation

1. **Vérification** : Incident doit être documenté dans les logs Éditeur
2. **Demande** : Email à support@iapostemanager.com avec références incidents
3. **Validation** : Éditeur vérifie et calcule l'impact réel
4. **Remboursement** : Crédit sur prochaine facture ou remboursement direct

**Délai** : Demande à formuler dans les 30 jours suivant le manquement.

### 5.3 Limitation

* Le remboursement cumulé maximum = 3 mois de souscription
* Les remboursements multiples d'un même incident ne s'additionnent pas
* Force majeure exclut tout remboursement

---

## 6. MAINTENANCE PROGRAMMÉE

### 6.1 Fenêtres de maintenance

L'Éditeur planifie la maintenance :

* **Jour :** Dimanche soir (meilleure couverture horaire)
* **Heure :** 22:00 - 02:00 CET (nuit en France, matin en Asie)
* **Fréquence :** Maximum 1x/mois (3-4 heures max)

### 6.2 Notification

* **Planifiée :** Notification 48h à l'avance
* **Urgente :** Notification immédiate + mail
* **Durée :** Maximum 4 heures (sauf incident majeur)

### 6.3 Exclusion du SLA

Les temps de maintenance programmée **ne comptent pas** dans la disponibilité mesurée (avec préavis 48h).

---

## 7. SAUVEGARDE & RÉCUPÉRATION

### 7.1 Sauvegarde automatique

**Fréquence :** Quotidienne (à 02:00 CET)  
**Rétention :** 90 jours de sauvegardes complètes  
**Localisation :** Multi-région UE  
**Chiffrement :** AES-256, clés séparées  

### 7.2 Objectif de récupération (RTO/RPO)

| Scénario | Objectif |
|----------|----------|
| **RTO** (temps pour restauration) | < 4 heures |
| **RPO** (données perdues max) | < 1 heure |

### 7.3 Tests de récupération

* Minimum **1 test/trimestre** (non communiqué aux utilisateurs)
* Résultats documentés et archivés
* Rapport d'audit disponible à demande

---

## 8. SÉCURITÉ & INCIDENTS

### 8.1 Incident de sécurité

En cas de **violation avérée** :

1. **Notification** : Dès détection (sauf impossible)
2. **Rapport** : Détails de l'incident sous 48h
3. **Remédiation** : Plan d'action sous 7 jours
4. **Audit** : Tiers indépendant si criticité haute

### 8.2 Responsabilité de l'Éditeur en cas d'incident

**Inclus dans le SLA :**

✅ Incidents dus à infrastructure/code Éditeur  
✅ Configurations de sécurité Éditeur insuffisantes  

**Exclus du SLA :**

❌ Incidents dus à credentials utilisateur compromises  
❌ Malveillance utilisateur (ex: upload de virus)  
❌ Force majeure  
❌ Attaques DDoS (si mitigées par Cloudflare)  

---

## 9. SCALABILITÉ & CROISSANCE

### 9.1 Limites du Service

| Paramètre | Limite actuelle | Plan de croissance |
|-----------|-----------------|-------------------|
| Utilisateurs/tenant | 100 (concurrent) | ∞ |
| Information Units | 1M/mois | Scalable |
| Taille fichier | 100 MB | 500 MB (roadmap) |
| Export simultanés | 5 | 20 (Enterprise) |
| Stockage | Plan-dépendant | +∞ pay-per-use |

### 9.2 Dégradation gracieuse

En cas de charge excessive :

* Limitation de requêtes (rate limiting) : 100 req/min par utilisateur
* Files d'attente : Export en arrière-plan
* Priorités : Enterprise = priorité haute

---

## 10. MODIFICATIONS DU SLA

### 10.1 Amélioration

L'Éditeur peut **améliorer** les cibles sans préavis (ex: passer de 99% à 99.5%).

### 10.2 Dégradation

Toute réduction des garanties exige **préavis de 60 jours** avec option de résiliation sans pénalité.

---

## 11. ESCALADE

### 11.1 Processus d'escalade

```
Incident CRITIQUE
  ↓
Support immédiat (15 min)
  ↓
Escalade équipe technique (30 min)
  ↓
Escalade management (1h)
  ↓
Tiers indépendant si > 2h non résolu
```

### 11.2 Contacts d'escalade

**Starter/Pro :**  
support@iapostemanager.com

**Enterprise :**  
escalation@iapostemanager.com (avec CEL)

---

## 12. LIMITATION DE RESPONSABILITÉ

### 12.1 L'Éditeur ne garantit pas

❌ L'absence totale d'incident  
❌ Les performances au-delà des cibles (best-effort)  
❌ L'absence d'attaques externes  
❌ Les temps de réponse en cas de surcharge réseau client  

### 12.2 Limitation des dommages

Responsabilité **plafonnée à 3 mois d'abonnement** (voir CGU section 6).

---

## 13. CONTACTS & SUIVI

### 13.1 Status page

Consultation en temps réel de la disponibilité :

🌐 **status.iapostemanager.com**

Mise à jour chaque minute.

### 13.2 Historique SLA

Consulter mensuellement :

📊 **Dashboard → Votre Compte → SLA Report**

Automatiquement généré avec remboursements calculés.

### 13.3 Questions

**Email :** sla@iapostemanager.com

---

## ANNEXES

### Annexe A : Formule de calcul de disponibilité

```
Uptime (%) = (Temps total - Temps indisponibilité) / Temps total × 100
```

**Exemple :**
* Mois = 30 jours = 43 200 minutes
* Indisponibilité = 5 minutes
* Uptime = (43200 - 5) / 43200 × 100 = 99.988%

### Annexe B : Métriques collectées

* Ping API (chaque 60s)
* Requête SELECT sur DB (chaque 60s)
* Login authentique (chaque 5 min)
* Export audit trail (chaque jour)

---

**VERSION 1.0 — En vigueur le 1er février 2026**

Fait partie intégrante des CGU.

---

**✅ PRÊT À PUBLIER SUR STATUS PAGE**

# ACCORD DE TRAITEMENT DES DONNÉES (DPA)

## Contrat de sous-traitance au sens de l'article 28 du RGPD

**Entre :**

- **Le Responsable de traitement** : Le Cabinet d'avocats (ci-après « le Cabinet »), identifié lors de la souscription au Service
- **Le Sous-traitant** : MemoLib SAS, éditeur de la plateforme MemoLib (ci-après « MemoLib »)

**Date d'entrée en vigueur** : À la date de souscription au Service

---

## Article 1 — Objet

Le présent accord définit les conditions dans lesquelles MemoLib, en qualité de sous-traitant, s'engage à effectuer pour le compte du Cabinet les opérations de traitement de données à caractère personnel nécessaires à la fourniture du Service MemoLib.

## Article 2 — Description du traitement

| Élément | Description |
|---|---|
| **Finalité** | Gestion des dossiers juridiques, communications clients, facturation, archivage |
| **Nature** | Collecte, stockage, consultation, modification, suppression |
| **Catégories de personnes** | Clients du Cabinet, parties adverses, témoins, experts |
| **Catégories de données** | Identité, coordonnées, données juridiques, pièces de procédure, correspondances |
| **Données sensibles** | Potentiellement : données de santé (certificats médicaux), données judiciaires, origines ethniques (droit des étrangers) |
| **Durée** | Durée du contrat de service + période de rétention légale |
| **Localisation** | Union Européenne (serveurs Vercel région cdg1 — Paris) |

## Article 3 — Obligations de MemoLib

MemoLib s'engage à :

### 3.1 Instructions documentées
- Traiter les données uniquement sur instruction documentée du Cabinet
- Informer immédiatement le Cabinet si une instruction constitue une violation du RGPD

### 3.2 Confidentialité
- S'assurer que les personnes autorisées à traiter les données sont soumises à une obligation de confidentialité
- Ne pas accéder aux données des dossiers grâce au chiffrement de bout en bout (E2E)
- Le personnel de MemoLib n'a **aucun accès** aux données chiffrées des dossiers

### 3.3 Sécurité (Article 32 RGPD)
MemoLib met en œuvre les mesures suivantes :

- **Chiffrement** : AES-256-GCM côté client (E2E), le serveur ne détient pas les clés
- **Authentification** : MFA disponible, JWT + sessions sécurisées
- **Contrôle d'accès** : RBAC multi-rôles, isolation par tenant (cabinet)
- **Journalisation** : Audit trail complet et immuable (EventLog)
- **Sauvegarde** : Backups chiffrés quotidiens
- **Antivirus** : Scan automatique des fichiers uploadés
- **Réseau** : HTTPS obligatoire, HSTS, CSP strict

### 3.4 Sous-traitance ultérieure
MemoLib fait appel aux sous-traitants suivants :

| Sous-traitant | Rôle | Localisation | Garanties |
|---|---|---|---|
| Vercel Inc. | Hébergement frontend | UE (Paris, cdg1) | DPA Vercel, SCCs |
| Stripe Inc. | Paiements | UE | Certifié PCI-DSS, DPA Stripe |
| Sentry Inc. | Monitoring erreurs | UE | DPA Sentry, données anonymisées |
| Upstash | Rate limiting (Redis) | UE | DPA Upstash |

Le Cabinet est informé de tout changement de sous-traitant et dispose d'un droit d'opposition.

### 3.5 Droits des personnes concernées
MemoLib fournit au Cabinet les outils techniques pour répondre aux demandes :
- **Droit d'accès** : Export des données via l'interface
- **Droit de rectification** : Modification via l'interface
- **Droit à l'effacement** : Anonymisation RGPD intégrée
- **Droit à la portabilité** : Export JSON/CSV
- **Droit d'opposition** : Suppression du compte

### 3.6 Notification de violation
En cas de violation de données, MemoLib s'engage à :
- Notifier le Cabinet dans un délai de **24 heures** après en avoir pris connaissance
- Fournir toutes les informations nécessaires (nature, catégories, mesures prises)
- Coopérer avec le Cabinet pour la notification à la CNIL (72h) et aux personnes concernées

### 3.7 Audit
Le Cabinet peut :
- Demander les certifications et rapports de sécurité de MemoLib
- Réaliser ou faire réaliser un audit annuel (avec préavis de 30 jours)
- Accéder aux logs d'audit via l'interface d'administration

## Article 4 — Obligations du Cabinet

Le Cabinet s'engage à :
- Informer ses clients du traitement de leurs données via MemoLib
- S'assurer de la licéité des traitements effectués
- Répondre aux demandes d'exercice des droits des personnes concernées
- Conserver la clé de chiffrement E2E de manière sécurisée (la perte de la clé entraîne la perte irréversible des données chiffrées)

## Article 5 — Sort des données en fin de contrat

À l'expiration du contrat :
1. MemoLib met à disposition un export complet des données (30 jours)
2. Après récupération confirmée, suppression définitive sous 30 jours
3. Certificat de destruction fourni sur demande
4. Les données chiffrées E2E deviennent inaccessibles sans la clé du Cabinet

## Article 6 — Données sensibles et HDS

Si le Cabinet traite des **données de santé** (certificats médicaux, expertises) :
- Le Cabinet en informe MemoLib par écrit
- MemoLib active l'hébergement HDS (Hébergeur de Données de Santé) certifié
- Surcoût éventuel communiqué au Cabinet avant activation
- Hébergeurs HDS partenaires : OVHcloud, Scaleway

## Article 7 — Transferts hors UE

MemoLib s'engage à :
- Héberger toutes les données dans l'Union Européenne
- Ne procéder à aucun transfert hors UE sans le consentement écrit du Cabinet
- En cas de transfert nécessaire : Clauses Contractuelles Types (SCCs) de la Commission Européenne

## Article 8 — Responsabilité

- MemoLib est responsable des dommages causés par un traitement non conforme aux instructions du Cabinet
- La responsabilité totale de MemoLib est limitée au montant des sommes versées par le Cabinet au cours des 12 derniers mois
- MemoLib ne saurait être tenu responsable de la perte de données due à la perte de la clé de chiffrement E2E par le Cabinet

## Article 9 — Durée et résiliation

- Le présent accord entre en vigueur à la date de souscription
- Il prend fin automatiquement à la résiliation du contrat de service
- Les obligations de confidentialité survivent à la résiliation

## Article 10 — Droit applicable

Le présent accord est soumis au droit français. Tout litige sera soumis aux tribunaux compétents de Paris.

---

## Annexe A — Mesures techniques et organisationnelles

### Chiffrement
- Données au repos : AES-256-GCM (E2E côté client)
- Données en transit : TLS 1.3
- Clés : dérivées via PBKDF2 (310 000 itérations, SHA-256)

### Contrôle d'accès
- RBAC : 9 rôles (SUPER_ADMIN → CLIENT)
- Isolation multi-tenant par cabinet
- Sessions JWT avec expiration

### Journalisation
- EventLog immuable avec hash chain
- Horodatage RFC 3161 (TSA qualifié en production)
- Rétention des logs : 5 ans minimum

### Continuité
- Backups quotidiens chiffrés
- RTO : 4 heures / RPO : 1 heure
- Plan de reprise documenté

### Personnel
- Accès limité au strict nécessaire
- Formation RGPD annuelle
- Clause de confidentialité dans les contrats de travail

---

## Annexe B — Liste des sous-traitants ultérieurs

*Voir Article 3.4*

Dernière mise à jour de la liste : [DATE]

---

**Pour le Cabinet :**

Nom : ____________________
Fonction : ____________________
Date : ____________________
Signature : ____________________

**Pour MemoLib :**

Nom : ____________________
Fonction : ____________________
Date : ____________________
Signature : ____________________

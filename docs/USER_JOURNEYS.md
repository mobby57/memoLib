# Parcours Utilisateurs - iaPostemanage

> **Version**: 2.0.0  
> **Date**: 2026-01-24  
> **Alignement**: Definition Workspace Janvier 2026

---

## 1. Personas et Roles

### 1.1 SUPER_ADMIN (Plateforme)

| Attribut | Valeur |
|----------|--------|
| **Role** | Gestionnaire de la plateforme SaaS |
| **Acces** | Tous les tenants, toutes les donnees |
| **Responsabilites** | Plans, facturation, support, monitoring |

**Permissions**:
```
manage_platform, manage_tenants, view_all
```

**Pages accessibles**:
- `/super-admin/dashboard` - Vue globale plateforme
- `/super-admin/tenants` - Gestion cabinets
- `/super-admin/plans` - Formules d'abonnement
- `/super-admin/users` - Utilisateurs globaux
- `/super-admin/emails` - Monitoring emails
- `/super-admin/settings` - Configuration plateforme
- `/super-admin/support` - Tickets support

---

### 1.2 ADMIN (Cabinet d'avocat)

| Attribut | Valeur |
|----------|--------|
| **Role** | Avocat / Gestionnaire cabinet |
| **Acces** | Son tenant uniquement (isolation stricte) |
| **Responsabilites** | Clients, dossiers, facturation, documents |

**Permissions**:
```
manage_cabinet, manage_clients, manage_dossiers
```

**Pages accessibles**:
- `/admin` - Dashboard cabinet
- `/admin/clients` - Gestion clients
- `/admin/dossiers` - Gestion dossiers
- `/admin/documents` - Documents
- `/admin/messages` - Messagerie clients
- `/admin/workflows` - Automatisations
- `/admin/billing` - Facturation
- `/admin/analytics` - Statistiques
- `/admin/parametres` - Configuration cabinet

---

### 1.3 CLIENT (Personne physique)

| Attribut | Valeur |
|----------|--------|
| **Role** | Client du cabinet |
| **Acces** | Ses propres dossiers uniquement |
| **Responsabilites** | Consultation, depot documents |

**Permissions**:
```
view_own_dossiers, submit_documents
```

**Pages accessibles**:
- `/client` - Dashboard personnel
- `/client/dossiers` - Mes dossiers
- `/client/documents` - Mes documents
- `/client/messages` - Messagerie avocat
- `/client/profil` - Mon profil
- `/client/nouveau-dossier` - Nouvelle demande

---

## 2. Flux Principal: Traitement Email Entrant

```
+------------------+
|  EMAIL RECU      |
|  (IMAP/Gmail)    |
+--------+---------+
         |
         v
+--------+---------+
|  ENREGISTREMENT  |  <- InformationUnit.status = RECEIVED
|  Horodatage      |     AuditLog cree
+--------+---------+
         |
         v
+--------+---------+
|  ANALYSE IA      |  <- Ollama/LLaMA
|  - Categorie     |
|  - Urgence       |
|  - Sentiment     |
+--------+---------+
         |
         v
+--------+---------+
|  CLASSIFICATION  |  <- InformationUnit.status = CLASSIFIED
|  Auto-tagging    |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
+---+---+ +---+---+
|COMPLET| |INCOMP.|  <- InformationUnit.status = INCOMPLETE
+---+---+ +---+---+
    |         |
    v         v
+---+---+ +---+---+
|ANALYSE| |ATTENTE|  <- Notification Admin
|APPROF.| |HUMAIN |     status = HUMAN_ACTION_REQUIRED
+---+---+ +---+---+
    |         |
    +----+----+
         |
         v
+--------+---------+
|  LIAISON         |
|  - Client existant?
|  - Dossier lie?  |
+--------+---------+
         |
         v
+--------+---------+
|  ACTIONS         |  <- WorkspaceReasoning
|  - Creer dossier |     ProposedAction
|  - Notification  |
|  - RDV calendrier|
+--------+---------+
         |
         v
+--------+---------+
|  RESOLUTION      |  <- InformationUnit.status = RESOLVED
|  Journalisation  |     Proof cree si necessaire
+--------+---------+
         |
         v
+--------+---------+
|  CLOTURE         |  <- InformationUnit.status = CLOSED
|  Archivage       |     ArchivePolicy cree
+--------+---------+
```

---

## 3. Parcours ADMIN - Gestion d'un Dossier

### 3.1 Creation Dossier

```
[ADMIN] Connexion
    |
    v
[Dashboard] -> Vue globale + alertes delais
    |
    +-> [Nouveau Dossier]
          |
          v
        [Selection Client]
          |-- Client existant -> Selection liste
          |-- Nouveau client -> Creation fiche
          |
          v
        [Type de Dossier]
          |-- Titre de sejour
          |-- Recours OQTF
          |-- Asile
          |-- Regroupement familial
          |-- Autre
          |
          v
        [Informations]
          |-- Article CESEDA
          |-- Juridiction
          |-- Date notification
          |
          v
        [Calcul Delais Auto]  <- LegalDeadline cree
          |-- Recours gracieux: J+60
          |-- Recours contentieux: J+60
          |
          v
        [Documents Requis]
          |-- Liste pieces selon type
          |-- Statut: attendu/recu/valide
          |
          v
        [Confirmation]
          |
          v
        [AuditLog: CREATE Dossier]
          |
          v
        [Notifications]
          |-- Email client (portail actif)
          |-- Alerte delais configuree
```

### 3.2 Suivi Dossier

```
[ADMIN] Ouvre Dossier #123
    |
    v
[Vue Dossier]
    |
    +-- [Timeline] <- ReasoningTrace, transitions
    |     |-- Reception document (date)
    |     |-- Analyse IA (date)
    |     |-- Courrier envoye (date)
    |     +-- Audience prevue (date)
    |
    +-- [Documents] <- Document[]
    |     |-- Upload
    |     |-- OCR automatique
    |     |-- Categorisation IA
    |     +-- Validation manuelle
    |
    +-- [Delais] <- LegalDeadline[]
    |     |-- Recours gracieux: J-15 (orange)
    |     |-- Recours contentieux: J+45 (vert)
    |     +-- Rappel envoye (check)
    |
    +-- [Preuves] <- Proof[]
    |     |-- AR reception OQTF
    |     |-- Depot recours TA
    |     +-- Convocation audience
    |
    +-- [Actions IA] <- ProposedAction[]
    |     |-- Rediger memoire -> [Executer]
    |     |-- Envoyer rappel client -> [Executer]
    |     +-- [Toutes approuvees] ou [Rejeter]
    |
    +-- [Facturation] <- Facture[]
          |-- Honoraires consultation
          |-- Frais depot recours
          +-- [Nouvelle facture]
```

---

## 4. Parcours CLIENT - Portail Self-Service

### 4.1 Premiere Connexion

```
[CLIENT] Recoit email invitation
    |
    v
[Lien activation] -> /auth/activate?token=xxx
    |
    v
[Creation mot de passe]
    |
    v
[Acceptation CGU]
    |
    v
[Dashboard Client]
    |
    +-- [Mes Dossiers] (liste)
    |     |-- Dossier #123: Titre sejour (en cours)
    |     +-- Dossier #124: Recours OQTF (cloture)
    |
    +-- [Mon Profil]
    |     |-- Informations personnelles
    |     |-- Coordonnees
    |     +-- Preferences notifications
    |
    +-- [Mes Documents]
    |     |-- Documents fournis
    |     +-- Documents a fournir (alerte)
    |
    +-- [Messages]
          |-- Historique echanges
          +-- Nouveau message
```

### 4.2 Depot Document

```
[CLIENT] Ouvre Dossier #123
    |
    v
[Vue Dossier Simplifiee]
    |-- Statut: En cours d'instruction
    |-- Prochaine etape: Fournir justificatif domicile
    |-- Delai: 5 jours restants (alerte)
    |
    +-> [Deposer Document]
          |
          v
        [Selection Fichier]
          |-- PDF, JPG, PNG
          |-- Max 10 Mo
          |
          v
        [Categorisation]
          |-- Type: Justificatif domicile
          |-- Commentaire optionnel
          |
          v
        [Upload + Hash SHA-256]
          |
          v
        [Confirmation]
          |-- Document recu le XX/XX/XXXX a HH:MM
          |-- Numero de depot: DOC-2026-0001
          |
          v
        [Notifications]
          |-- Email confirmation client
          |-- Notification admin (nouveau document)
          |
          v
        [AuditLog + Proof cree]
```

### 4.3 Consultation Statut

```
[CLIENT] Dashboard
    |
    v
[Dossier #123]
    |
    +-- [Statut Global]
    |     |-- Phase: Instruction
    |     |-- Progression: 60%
    |     +-- Derniere mise a jour: il y a 2 jours
    |
    +-- [Timeline Simplifiee]
    |     |-- Dossier ouvert (date)
    |     |-- Documents recus (date)
    |     |-- En attente prefecture (statut actuel)
    |     +-- Decision attendue (estimation)
    |
    +-- [Documents]
    |     |-- ✅ Passeport (valide)
    |     |-- ✅ Photos identite (valide)
    |     |-- ⏳ Justificatif domicile (en attente)
    |     +-- ❌ Attestation employeur (manquant)
    |
    +-- [Prochaines Actions]
          |-- Fournir: Justificatif domicile
          |-- Delai: 5 jours
          +-- [Deposer maintenant]
```

---

## 5. Flux Alertes et Escalade

### 5.1 Alertes Delais (LegalDeadline)

```
[CRON] Verification quotidienne 08:00
    |
    v
[Pour chaque LegalDeadline]
    |
    +-- status = PENDING?
          |
          +-- dueDate - 7 jours?
          |     |
          |     v
          |   [DeadlineAlert J-7]
          |     |-- Email admin
          |     |-- Notification push
          |     +-- status = APPROACHING
          |
          +-- dueDate - 3 jours?
          |     |
          |     v
          |   [DeadlineAlert J-3]
          |     |-- Email admin + SMS
          |     |-- Notification push URGENT
          |     +-- status = URGENT
          |
          +-- dueDate - 1 jour?
          |     |
          |     v
          |   [DeadlineAlert J-1]
          |     |-- Email admin + SMS + Appel?
          |     |-- Dashboard banniere rouge
          |     +-- status = CRITICAL
          |
          +-- dueDate depasse?
                |
                v
              [DeadlineAlert OVERDUE]
                |-- Email SUPER_ADMIN (escalade)
                |-- AuditLog incident
                +-- status = OVERDUE
```

### 5.2 Escalade Intervention Humaine

```
[InformationUnit.status = INCOMPLETE ou AMBIGUOUS]
    |
    v
[Notification Admin]
    |-- "Email de client@email.com necessite attention"
    |-- Lien direct vers email
    |
    +-- [Admin intervient < 24h?]
          |
          +-- OUI -> Resolution normale
          |
          +-- NON (apres 24h)
                |
                v
              [Notification SUPER_ADMIN]
                |-- "Cabinet X: email non traite depuis 24h"
                |-- status = HUMAN_ACTION_REQUIRED
                |
                +-- [Intervention < 48h?]
                      |
                      +-- OUI -> Resolution
                      |
                      +-- NON
                            |
                            v
                          [Incident cree]
                            |-- AuditLog.action = ESCALATE
                            |-- Rapport automatique
```

---

## 6. Flux Zero Information Ignoree

```
[Toute entree: Email, Upload, API, Scan]
    |
    v
+---------------------------+
| ENREGISTREMENT IMMEDIAT   |
| - InformationUnit cree    |
| - contentHash SHA-256     |
| - receivedAt = now()      |
| - AuditLog.CREATE         |
+---------------------------+
    |
    v
[JAMAIS de suppression silencieuse]
    |
    +-- Erreur parsing? -> status = INCOMPLETE + log
    +-- Spam detecte? -> status = CLASSIFIED + tag:spam
    +-- Doublon? -> Lien vers original + log
    |
    v
[Garantie tracabilite]
    |-- Chaque changement = InformationStatusHistory
    |-- Chaque action = AuditLog
    +-- Chaque preuve = Proof avec hash
```

---

## 7. Matrice des Actions par Role

| Action | SUPER_ADMIN | ADMIN | CLIENT |
|--------|:-----------:|:-----:|:------:|
| Voir tous tenants | ✅ | ❌ | ❌ |
| Gerer plans | ✅ | ❌ | ❌ |
| Creer tenant | ✅ | ❌ | ❌ |
| Voir clients tenant | ✅ | ✅ | ❌ |
| Creer client | ✅ | ✅ | ❌ |
| Creer dossier | ✅ | ✅ | ❌ |
| Modifier dossier | ✅ | ✅ | ❌ |
| Voir son dossier | ✅ | ✅ | ✅ |
| Deposer document | ✅ | ✅ | ✅ |
| Envoyer message | ✅ | ✅ | ✅ |
| Creer facture | ✅ | ✅ | ❌ |
| Voir sa facture | ✅ | ✅ | ✅ |
| Payer facture | ❌ | ❌ | ✅ |
| Configurer workflows | ✅ | ✅ | ❌ |
| Acceder analytics | ✅ | ✅ | ❌ |
| Voir AuditLog | ✅ | ✅* | ❌ |

*Admin voit uniquement les logs de son tenant

---

## 8. Points de Controle Critiques

### 8.1 Authentification

```
[Toute requete]
    |
    v
[middleware.ts / proxy.ts]
    |
    +-- Token JWT valide?
    |     |-- NON -> 401 + redirect /auth/login
    |     +-- OUI -> Continue
    |
    +-- Role suffisant?
    |     |-- NON -> 403 Acces refuse
    |     +-- OUI -> Continue
    |
    +-- Tenant correct? (pour ADMIN)
    |     |-- NON -> 403 Cross-tenant interdit
    |     +-- OUI -> Continue
    |
    +-- Ressource autorisee? (pour CLIENT)
          |-- NON -> 403 Acces limite
          +-- OUI -> Traiter requete
```

### 8.2 Validation Donnees

```
[Toute creation/modification]
    |
    v
[Validation Zod/Schema]
    |
    +-- Invalide? -> 400 + details erreur
    +-- Valide -> Continue
    |
    v
[Verification metier]
    |
    +-- Delai depasse? -> Alerte + Continue
    +-- Document manquant? -> Notification + Continue
    +-- Anomalie detectee? -> Log + Alerte admin
    |
    v
[Enregistrement]
    |
    +-- Transaction Prisma
    +-- AuditLog.CREATE/UPDATE
    +-- Notifications si necessaire
```

---

## 9. Resume des Parcours

| Parcours | Etapes | Temps moyen | Points critiques |
|----------|--------|-------------|------------------|
| Email -> Dossier | 6 | < 5 min | Classification IA |
| Creation dossier | 8 | 10-15 min | Calcul delais |
| Depot document client | 5 | < 2 min | Upload + hash |
| Traitement delai | 4 alertes | Automatique | Escalade |
| Resolution complete | Variable | 1-90 jours | Preuves |

---

## 10. Diagramme Global des Parcours

```
                    +------------------+
                    |   PLATEFORME     |
                    |  (SUPER_ADMIN)   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
        +-----+----+   +-----+----+   +-----+----+
        |  TENANT  |   |  TENANT  |   |  TENANT  |
        | Cabinet1 |   | Cabinet2 |   | Cabinet3 |
        +----+-----+   +----+-----+   +----+-----+
             |              |              |
             v              v              v
        +----+----+    +----+----+    +----+----+
        |  ADMIN  |    |  ADMIN  |    |  ADMIN  |
        |(Avocat) |    |(Avocat) |    |(Avocat) |
        +----+----+    +----+----+    +----+----+
             |
    +--------+--------+
    |        |        |
    v        v        v
+---+--+ +---+--+ +---+--+
|CLIENT| |CLIENT| |CLIENT|
+------+ +------+ +------+
    |
    v
+---+---+
|DOSSIER|
+---+---+
    |
    +---> Documents
    +---> Delais (LegalDeadline)
    +---> Preuves (Proof)
    +---> Factures
    +---> Timeline (AuditLog)
```

---

*Document genere automatiquement - iaPostemanage v2.0*

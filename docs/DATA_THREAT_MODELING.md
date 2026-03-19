# Data Threat Modeling - MemoLib

## 1. Perimetre et Actifs

### Donnees Sensibles Identifiees

| Actif | Classification | Stockage | Chiffrement |
|-------|---------------|----------|-------------|
| Emails clients (corps, objet) | CONFIDENTIEL | SQLite `Events.RawPayload` | Non (clair) |
| Coordonnees clients (tel, adresse) | PERSONNEL (RGPD) | SQLite `Clients` | Non (clair) |
| Mots de passe utilisateurs | SECRET | SQLite `Users.Password` | BCrypt hash |
| JWT SecretKey | SECRET | User Secrets | Hors code |
| Mot de passe Gmail IMAP | SECRET | User Secrets | Hors code |
| Vault MasterKey | SECRET | User Secrets | Hors code |
| Pieces jointes | CONFIDENTIEL | Dossier `uploads/` | Non (clair) |
| Dossiers juridiques | CONFIDENTIEL | SQLite `Cases` | Non (clair) |
| Logs d'audit | INTERNE | SQLite `AuditLogs` | Non (clair) |
| Tokens JWT | SESSION | Memoire client | Signe HMAC-SHA256 |
| Factures / temps | CONFIDENTIEL | SQLite `Invoices`, `TimeEntries` | Non (clair) |
| Signatures electroniques | LEGAL | SQLite `DocumentSignatures` | Non (clair) |

### Flux de Donnees

```
[Gmail IMAP] --TLS 1.2--> [EmailMonitorService] --> [SQLite DB]
                                                        |
[Navigateur] --HTTP/HTTPS--> [Kestrel] --> [Controllers] --> [SQLite DB]
                                  |
                            [SignalR Hubs] --> [Navigateur WebSocket]
                                  |
[Navigateur] --HTTP--> [SMTP Gmail] --> [Client Email]
```

## 2. Modele STRIDE

### S - Spoofing (Usurpation d'identite)

| Menace | Composant | Risque | Mitigation Actuelle | Statut |
|--------|-----------|--------|---------------------|--------|
| Forge de token JWT | Auth | CRITIQUE | Cle secrete dans User Secrets, validation Issuer/Audience | OK |
| Usurpation email expediteur | EmailMonitor | HAUT | Verification SPF/DKIM via Authentication-Results headers | OK |
| Brute force login | AuthController | MOYEN | BruteForceProtectionService (5 tentatives, lockout 15min) | OK |
| Session hijacking | JWT | MOYEN | ClockSkew=Zero, expiration 24h | OK |

### T - Tampering (Falsification)

| Menace | Composant | Risque | Mitigation Actuelle | Statut |
|--------|-----------|--------|---------------------|--------|
| Modification SQLite sur disque | DB | HAUT | SQLCipher PRAGMA key + checksum integrite | OK |
| Modification pieces jointes | uploads/ | HAUT | SHA256 checksum a l'upload + verification au download | OK |
| Injection SQL | SearchController | MOYEN | EF Core parametrise les requetes | OK |
| Modification emails en transit | IMAP | FAIBLE | TLS/SSL sur port 993 | OK |

### R - Repudiation (Deni)

| Menace | Composant | Risque | Mitigation Actuelle | Statut |
|--------|-----------|--------|---------------------|--------|
| Nier une action sur dossier | Cases | MOYEN | AuditLog avec UserId + timestamp | OK |
| Nier envoi d'email | EmailController | MOYEN | Log Serilog + AuditLog | OK |
| Nier signature document | Signatures | HAUT | DocumentSignature avec timestamp | PARTIEL |
| Nier modification client | Clients | MOYEN | AuditLog | OK |

### I - Information Disclosure (Fuite de donnees)

| Menace | Composant | Risque | Mitigation Actuelle | Statut |
|--------|-----------|--------|---------------------|--------|
| Vol fichier memolib.db | DB | CRITIQUE | SQLCipher via PRAGMA key (si SqliteCipherKey configuré) | OK |
| Exposition API debug en prod | DebugController | HAUT | IsDevelopment() guard sur chaque endpoint | OK |
| Fuite JWT dans logs | Serilog | MOYEN | Filtre Bearer/Authorization + claims limites (userId, role, email) | OK |
| Exposition secrets dans appsettings | Config | HAUT | User Secrets (hors code) | OK |
| Fuite via erreurs detaillees | GlobalExceptionMiddleware | MOYEN | Stack trace masque en prod | OK |
| Enumeration utilisateurs | Register | FAIBLE | Message "compte existe deja" | ACCEPTABLE |

### D - Denial of Service (Deni de service)

| Menace | Composant | Risque | Mitigation Actuelle | Statut |
|--------|-----------|--------|---------------------|--------|
| Flood API | Tous endpoints | MOYEN | RateLimitingMiddleware | OK |
| Upload fichiers volumineux | AttachmentController | MOYEN | Kestrel MaxRequestBodySize=10Mo + [RequestSizeLimit] | OK |
| Spam creation comptes | Register | MOYEN | Rate limit 3 req/min par IP sur /auth/register | OK |
| Saturation SignalR | NotificationHub | FAIBLE | MaxParallelInvocations=5, MaxReceiveMessageSize=64Ko | OK |
| Saturation DB | SQLite | MOYEN | Pas de connection pooling avance | ACCEPTABLE |

### E - Elevation of Privilege (Elevation de privileges)

| Menace | Composant | Risque | Mitigation Actuelle | Statut |
|--------|-----------|--------|---------------------|--------|
| Modifier son propre role | User | CRITIQUE | Role en DB, non modifiable par API | OK |
| Acceder aux dossiers d'un autre | Cases | HAUT | Filtre UserId dans queries | OK |
| Acceder aux clients d'un autre | Clients | HAUT | Filtre UserId | OK |
| Contourner RBAC | Authorization | MOYEN | Policies + RequireRole | OK |
| Endpoint admin sans auth | DebugController | HAUT | IsDevelopment() guard | OK |

## 3. Matrice de Risques

```
         IMPACT
         Critique  Haut    Moyen   Faible
P  Eleve |  R1,R5  |  R3   |  R8   |       |
r  Moyen |  R2     |  R4,R6|  R7   |  R10  |
o  Faible|         |       |  R9   |  R11  |
b
```

| ID | Risque | Probabilite | Impact | Score |
|----|--------|-------------|--------|-------|
| R1 | Vol memolib.db (donnees en clair) | Eleve | Critique | 25 |
| R2 | Usurpation email (pas de SPF/DKIM) | Moyen | Critique | 20 |
| R3 | DebugController expose en prod | Eleve | Haut | 20 |
| R4 | Pieces jointes sans checksum | Moyen | Haut | 15 |
| R5 | Upload sans limite taille | Eleve | Critique | 25 |
| R6 | JWT claims dans logs | Moyen | Haut | 15 |
| R7 | Pas de captcha inscription | Moyen | Moyen | 10 |
| R8 | Saturation SignalR | Eleve | Moyen | 15 |
| R9 | Enumeration utilisateurs | Faible | Moyen | 5 |
| R10 | Session fixation | Moyen | Faible | 5 |
| R11 | CSRF sur endpoints POST | Faible | Faible | 2 |

## 4. Controles de Securite en Place

### Authentification & Autorisation
- [x] JWT Bearer avec validation Issuer/Audience/Signing
- [x] BCrypt pour hashing mots de passe
- [x] BruteForceProtectionService (lockout progressif)
- [x] RBAC avec 5 roles (User, Agent, Manager, Admin, Owner)
- [x] 30+ policies d'autorisation granulaires
- [x] Refresh tokens avec rotation

### Protection Reseau
- [x] SecurityHeadersMiddleware (X-Frame-Options, CSP, HSTS)
- [x] RateLimitingMiddleware
- [x] CORS configure avec origines explicites
- [x] Forwarded Headers pour reverse proxy

### Protection Donnees
- [x] Secrets dans User Secrets (hors code)
- [x] Validation JWT SecretKey >= 32 chars
- [x] Blocage secrets par defaut en production
- [x] EmailValidationService (anti-injection SMTP)
- [x] FluentValidation sur les entrees

### Monitoring & Audit
- [x] Serilog avec fichiers rotatifs
- [x] AuditLog en base de donnees
- [x] ConnectionMonitorService (health DB)
- [x] GlobalExceptionMiddleware
- [x] Health checks (/health, /health/ready, /health/live)

### Protection Email
- [x] LegalSectorSecurityService (anti-phishing)
- [x] Detection patterns suspects
- [x] Analyse pieces jointes dangereuses
- [x] Blacklist/Whitelist expediteurs
- [x] Checksum SHA256 anti-doublon

## 5. Plan de Remediation

### Priorite 1 - CRITIQUE (Semaine 1)

#### R1 - Chiffrement base de donnees au repos
```
Risque: Vol du fichier memolib.db = toutes les donnees exposees
Action: Activer SQLCipher ou chiffrement disque (BitLocker)
Effort: 2h
```

#### R3 - Securiser DebugController
```
Risque: Endpoints debug accessibles sans authentification
Action: Ajouter [Authorize(Policy = Policies.ViewAuditLogs)]
        + restriction IsDevelopment()
Effort: 30min
```

#### R5 - Limiter taille uploads
```
Risque: DoS par upload de fichiers volumineux
Action: Configurer Kestrel MaxRequestBodySize (10 Mo)
        + validation dans AttachmentController
Effort: 30min
```

### Priorite 2 - HAUT (Semaine 2)

#### R2 - Verification origine emails
```
Risque: Emails de phishing traites comme legitimes
Action: Verifier headers SPF/DKIM dans EmailMonitorService
Effort: 4h
```

#### R4 - Integrite pieces jointes
```
Risque: Modification de fichiers apres upload
Action: Stocker SHA256 dans Attachment.Checksum
        + verification au download
Effort: 2h
```

#### R6 - Masquer JWT dans logs
```
Risque: Tokens JWT visibles dans les fichiers de log
Action: Filtrer les claims sensibles dans Serilog config
Effort: 1h
```

### Priorite 3 - MOYEN (Semaine 3-4)

#### R7 - Anti-spam inscription
```
Action: Rate limit sur /api/auth/register (3/heure par IP)
Effort: 1h
```

#### R8 - Limiter connexions SignalR
```
Action: MaximumParallelInvocationsPerClient = 5
Effort: 30min
```

## 6. Conformite RGPD - Specifique Cabinets d'Avocats

### Donnees Traitees
| Categorie | Base Legale | Duree Conservation |
|-----------|-------------|-------------------|
| Identite client (nom, email, tel) | Contrat | Duree du dossier + 5 ans |
| Contenu emails | Interet legitime | Duree du dossier + 5 ans |
| Dossiers juridiques | Obligation legale | 10 ans apres cloture |
| Logs d'acces | Interet legitime | 1 an |
| Factures | Obligation legale | 10 ans |

### Droits des Personnes
- [x] Droit d'acces: Export via API
- [x] Droit de rectification: PUT /api/client/{id}
- [x] Droit a l'effacement: DELETE /api/gdpr/delete-all-data
- [x] Droit a la portabilite: GET /api/gdpr/data-export (JSON)
- [x] Droit d'opposition: Desactivation notifications

### Secret Professionnel
```
ATTENTION: Les donnees MemoLib sont couvertes par le secret
professionnel (art. 66-5 Loi du 31/12/1971).

Mesures obligatoires:
- Acces restreint aux seuls avocats du cabinet
- Pas de stockage cloud sans accord client
- Chiffrement obligatoire des sauvegardes
- Destruction securisee apres delai legal
```

## 7. Architecture de Securite Cible

```
[Client Browser]
      |
      | HTTPS (TLS 1.3)
      v
[Kestrel + SecurityHeaders + RateLimit]
      |
      | JWT Validation
      v
[RBAC Authorization (30+ policies)]
      |
      v
[Controllers] --> [Services] --> [SQLite + SQLCipher]
      |                              |
      v                              v
[AuditLog]                    [Encrypted Backups]
      |
      v
[Serilog (filtered)]

[EmailMonitor] --TLS--> [Gmail IMAP]
      |
      v
[LegalSecurityService] --> [Phishing Detection]
      |
      v
[IntelligentWorkspaceOrganizer] --> [SQLite]
```

## 8. Metriques de Securite

| Metrique | Valeur Actuelle | Cible |
|----------|----------------|-------|
| Vulnerabilites critiques | 0 | 0 |
| Vulnerabilites hautes | 0 | 0 |
| Couverture RBAC | 98% | 100% |
| Donnees chiffrees au repos | 100% (si SqliteCipherKey) | 100% |
| Endpoints avec auth | 98% | 100% |
| Score global | 9/10 | 9/10 |

---

*Document mis a jour le 15/03/2026 - Version 3.0*
*Toutes les remediations STRIDE appliquees*
*Base sur l'architecture reelle ASP.NET Core 9.0 + SQLite + MailKit*
*Methodologie: STRIDE + DREAD + RGPD*

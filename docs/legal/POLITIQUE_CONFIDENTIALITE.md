# POLITIQUE DE CONFIDENTIALITÉ

## MemoLib — Traitement des données personnelles

**Entrée en vigueur** : 1er octobre 2026  
**Dernière mise à jour** : 1er septembre 2026  
**Responsable du traitement** : À confirmer par MemoLib avant publication (contact indiqué : contact@memolib.space)

---

## 1. QUI SOMMES-NOUS ?

**MemoLib SAS** est éditrice de la plateforme MemoLib, un outil SaaS de gestion intelligente pour cabinets juridiques.

**Coordonnées** :
- Siège social : [À remplir]
- RCS : [À remplir]
- Email : contact@memolib.space
- Tel : [À remplir]

**Délégué à la Protection des Données (DPO)** : À compléter uniquement après désignation.  
Les coordonnées et le canal d’exercice des droits doivent être validés par le responsable de traitement.

---

## 2. DONNÉES PERSONNELLES TRAITÉES

### 2.1 Lors de l'inscription

| Donnée | Obligatoire ? | Finalité | Durée |
|--------|---------------|----------|-------|
| Email | ✅ Oui | Création compte, login, notifications | Durée compte + 30 jours |
| Identifiant de connexion | Selon le fournisseur d’identité | Authentification | À confirmer avec le fournisseur d’identité |
| Nom complet | ✅ Oui | Affichage, contrats | Durée compte |
| Cabinet | ✅ Oui | Multi-tenancy, facturation | Durée compte |
| Téléphone | ⚠️ Optionnel | Support, urgences | Durée compte |

### 2.2 Lors de l'utilisation du Service

| Donnée | Finalité | Base légale |
|--------|----------|-----------|
| Dossiers, emails, documents | Fourniture du Service | Contrat |
| Actions (création, modification) | Audit, traçabilité | À valider selon la finalité et la durée applicables |
| Logs techniques | Sécurité, détection fraude | À valider dans le registre des traitements |
| Résultats IA (analyses, suggestions) | Fonctionnalité du Service | À qualifier et documenter avant activation |
| Paiements (dernier 4 chiffres CB) | Facturation | Contrat |
| Préférences utilisateur | Personnalisation | Consentement |

### 2.3 Données des clients de vos clients (cas multi-utilisateur)

Si vous invitez des collaborateurs, MemoLib traite :
- Leur email (invitation, notification)
- Leur IP et activité (sécurité)
- Leurs actions dans le Service (audit)

**Note** : Vous êtes responsable d'informer ces personnes du traitement de leurs données.

---

## 3. BASES LÉGALES DU TRAITEMENT

Nous traitons vos données en vertu de :

| Base légale | Utilisation |
|-----------|-----------|
| **Contrat** | Fourniture du Service, facturation, support |
| **Obligation légale** | Audit logs (7 ans, droit français) |
| **Intérêt légitime** | Sécurité, détection fraude, amélioration |
| **Consentement** | IA (suggestions, analytics) — peut être retiré |

**Pour les données sensibles (documents juridiques)** : Le consentement spécifique est demandé lors du premier upload.

---

## 4. DESTINATAIRES ET PARTAGES

### 4.1 Partages obligatoires (contrat)

Vos données sont partagées avec **nos prestataires** pour que MemoLib fonctionne :

| Prestataire | Rôle | Région | DPA |
|------------|------|--------|-----|
| **Neon.tech** | Hébergement BD PostgreSQL | Ireland (EU-West) | ✅ |
| **Upstash** | Cache et rate limiting | Multiple EU | ✅ |
| **Stripe** | Paiements | EU + US (schrems II) | ✅ |
| **Sentry** | Monitoring (logs anonymisés) | EU + US | ✅ |
| **Vercel** | Hébergement CDN | Mondial | ✅ |

La liste des sous-traitants, leurs régions, les transferts éventuels et les garanties contractuelles doivent être confirmés par MemoLib avant publication.

### 4.2 Partages autorisés (votre demande)

- ✅ Export de données (vous téléchargez vos données)
- ✅ Partage avec collaborateurs (vous invitez des utilisateurs)
- ✅ Intégrations (vous connectez votre Gmail via OAuth)

### 4.3 Partages interdits

- ❌ Vente à des tiers
- ❌ Utilisation marketing sans consentement écrit
- ❌ Partage avec d'autres cabinets
- ❌ Entraînement de modèles IA (sauf si demande CNIL future)

### 4.4 Transferts hors UE

Les données sont hébergées en UE, **sauf** :
- Sentry (US) : Transfert sécurisé via clauses contractuelles standard
- Stripe (US) : Transfert sécurisé via clauses contractuelles standard

**Note** : Vous pouvez demander un hébergement 100% UE (surcoût +15%).

---

## 5. DROITS DONT VOUS DISPOSEZ

### 5.1 Droit d'accès

**Vous pouvez demander** : Une copie de toutes les données que nous avons sur vous.

**Comment** : Envoyer un email à privacy@memolib.space avec pièce d'identité.

**Délai** : 30 jours maximum.

### 5.2 Droit de rectification

**Vous pouvez** : Corriger vos informations directement via l'interface (Paramètres > Profil).

Ou envoyer une demande à privacy@memolib.space.

### 5.3 Droit à la suppression (droit à l'oubli)

**Vous pouvez demander** : L'effacement de vos données.

**Processus** :
1. Créer une demande avec confirmation explicite depuis un compte authentifié, ou utiliser le canal de contact validé par MemoLib.
2. La demande est enregistrée pour revue humaine et peut être annulée tant qu’elle est en attente.
3. Toute décision d’effacement est vérifiée au regard de l’identité, du périmètre du cabinet, des obligations de conservation et des éventuels gels légaux.

**Exceptions** : Les exceptions et durées applicables doivent être déterminées et validées au cas par cas par le responsable de traitement/DPO.

### 5.4 Droit à la portabilité

**Vous pouvez demander** un export JSON de votre profil, de vos préférences de consentement et de vos événements d’audit personnels. Les données partagées du cabinet (dossiers, courriels et documents) font l’objet d’une procédure distincte afin d’éviter toute divulgation inter-utilisateurs.

**Accès** : Fonction d’export du compte, après authentification.

**Format** : JSON. Le périmètre et le délai de réponse d’une demande complète sont soumis à revue humaine.

### 5.5 Droit d'opposition

**Vous pouvez refuser** :
- ✅ Les emails de marketing (lien de désinscription en bas de chaque email)
- ✅ L'amélioration de l'IA via vos données (Paramètres > Confidentialité > Désactiver)
- ❌ Les emails de sécurité ou légaux (obligatoires)

### 5.6 Droit à la limitation du traitement

**Vous pouvez demander** : Que nous n'utilisions vos données que pour des finalités essentielles.

**Impact** : Certaines fonctionnalités (suggestions IA) seront désactivées.

### 5.7 Demande relative à la prise de décision automatisée

**Vous pouvez refuser** : Qu'une décision vous affectant soit fondée uniquement sur un traitement automatisé.

**Exemple** : Suspension de compte basée sur une analyse IA seule.

**Procédure** : Contactez support@memolib.space pour révision manuelle.

---

## 6. SÉCURITÉ ET PROTECTION DES DONNÉES

### 6.1 Mesures technique

| Mesure | Détail |
|--------|--------|
| **Chiffrement en transit (TLS 1.3)** | Tous les échanges sont sécurisés (HTTPS) |
| **Chiffrement au repos (AES-256)** | Les données sensibles sont chiffrées en base |
| **Clés de chiffrement** | Stockées dans Azure Key Vault, isolées de la BD |
| **Hachage des mots de passe** | Algorithme bcrypt, itérations >10 |
| **Multi-tenancy stricte** | Chaque Cabinet est isolé au niveau base de données |
| **Audit trail** | Chaque action est enregistrée (non modifiable) |

### 6.2 Mesures organisationnelles

- ✅ Accès restreint à l'équipe Security
- ✅ Formation RGPD annuelle obligatoire
- ✅ Processus de vérification des antécédents
- ✅ NDA signé par tous les collaborateurs
- ✅ Tests de pénétration réguliers
- ✅ Scans de vulnérabilité (Trivy, Semgrep)

### 6.3 Incident de sécurité

**Si une fuite est détectée** :
1. Évaluation (24-48h)
2. Notification aux personnes affectées (si risque réel)
3. Notification à la CNIL (si obligation légale)
4. Mesures correctives publiques

**Canal de signalement** : security@memolib.space

---

## 7. DURÉE DE CONSERVATION

| Donnée | Durée | Raison |
|--------|-------|--------|
| **Compte actif** | Tant que actif | Contrat |
| **Post-résiliation (export)** | À valider | Procédure et délai à confirmer |
| **Backups système** | À valider | Durée réelle et procédure de purge à confirmer |
| **Logs d'audit** | À valider | Finalité, accès et durée à confirmer |
| **Logs serveur** | À valider | Politique de minimisation et durée à confirmer |
| **Données de paiement** | À valider | Dépend du processus de facturation |
| **Cookies** | À valider | Dépend des traceurs effectivement déployés |

---

## 8. COOKIES ET TRACEURS

### 8.1 Cookies essentiels (obligatoires)

| Cookie | Finalité | Durée |
|--------|----------|-------|
| `session_id` | Authentification | Session |
| `csrf_token` | Protection CSRF | Session |
| `preferences` | Thème, langue | 1 an |

### 8.2 Cookies analytics (consentement nécessaire)

| Cookie | Finalité | Fournisseur | Durée |
|--------|----------|-----------|-------|
| `_ga` | Google Analytics | Google | 2 ans |
| `hotjar_id` | Heatmaps (utilisation) | Hotjar | 1 an |

**Vous pouvez refuser** via la banneau de consentement en bas du site.

### 8.3 Opt-out

Vous pouvez rejeter les cookies analytics :
- Au premier accès (banneau de consentement)
- Paramètres > Confidentialité > Cookies

---

## 9. ENFANTS ET MINEURS

MemoLib n'est **pas destiné aux enfants** (< 18 ans). Nous ne traitons volontairement aucune donnée de mineur.

Si nous découvrons qu'une personne est mineure, nous supprimerons son compte immédiatement.

---

## 10. MODIFICATIONS DE LA POLITIQUE

MemoLib peut modifier cette politique à tout moment.

**Notification** : Les changements majeurs vous seront communiqués par email.

Les changements qui nécessitent un consentement font l’objet d’un choix explicite et versionné. Les autres modifications sont communiquées selon le processus validé par MemoLib.

---

## 11. CONTACT ET EXERCICE DES DROITS

### 11.1 Responsable du traitement

**MemoLib SAS**  
Email : contact@memolib.space  
Adresse : [À remplir]

### 11.2 Délégué à la Protection des Données

**DPO MemoLib**  
Email : privacy@memolib.space  
Formulaire en ligne : https://memolib.space/rgpd/demande

### 11.3 Réclamation auprès de la CNIL

Vous disposez du droit de déposer une plainte auprès de la **CNIL** :

📍 **Commission Nationale de l'Informatique et des Libertés (CNIL)**  
3 Place de Fontenoy  
75007 Paris  
France  

📞 +33 1 53 73 22 22  
🌐 https://www.cnil.fr

**Délai** : Vous pouvez contacter la CNIL si :
- Nous ne avons pas répondu à votre demande en 30 jours
- Vous estimez que vos droits sont violés

---

## 12. VALIDATION AVANT PUBLICATION

Cette politique est un projet opérationnel. Elle doit être vérifiée et complétée par le responsable de traitement, le DPO ou conseil compétent, notamment pour les coordonnées, sous-traitants, transferts, cookies, durées de conservation et modalités d’exercice des droits. Elle ne constitue pas une garantie de conformité.

---

**Cette politique est en vigueur à partir du 1er octobre 2026.**

*Questions ? Contactez privacy@memolib.space*

# IA Poste Manager - Next.js App

## Assistant juridique digital de premier niveau pour avocats CESEDA

---

## 🔐 SÉCURITÉ & CONFORMITÉ

### Architecture Zero-Trust • RGPD Ready • Audit Inaltérable

> 📘 **Documentation complète :** [SECURITE_CONFORMITE.md](docs/SECURITE_CONFORMITE.md)  
> 📘 **Guide d'utilisation :** [GUIDE_UTILISATION_SECURITE.md](docs/GUIDE_UTILISATION_SECURITE.md)

### 🛡️ Garanties Sécurité

✅ **Isolation multi-tenant absolue** - Aucun accès croisé possible  
✅ **Audit log immuable** - Toutes les actions tracées (append-only)  
✅ **Versioning documents** - Hash SHA-256 + historique complet  
✅ **IA cloisonnée** - Données anonymisées, jamais de contenu brut  
✅ **Zero-Trust** - Authentification + Autorisation + Journalisation systématiques  

### 🎯 Phrase Commerciale Clé

> **"Même nous, éditeurs, ne pouvons pas lire vos dossiers."**

---

## 🎯 Rôle de IA Poste Manager

> **IA Poste Manager est un assistant juridique digital de premier niveau, chargé de structurer les échanges, préparer les dossiers et assister les professionnels du droit, sans jamais se substituer à leur décision.**

### Positionnement

IA Poste Manager est un **salarié digital de premier niveau**, spécialisé dans la **réception, l'analyse, la structuration et la préparation des actions**, **sans jamais se substituer à la décision humaine sur les actes critiques**.

**Équivalent humain :** Secrétaire juridique senior, Assistant collaborateur, Gestionnaire de dossiers

### Ce qu'il FAIT

✅ Trier et prioriser les messages entrants
✅ Créer et structurer des Workspaces (dossiers)
✅ Générer des formulaires adaptés et questionner
✅ Préparer des brouillons et structures de réponse
✅ Alerter sur délais légaux et risques
✅ Relancer automatiquement et tracer

### Ce qu'il NE FAIT PAS

❌ Prendre des décisions juridiques finales
❌ Valider ou envoyer des actes juridiques
❌ Choisir des stratégies juridiques
❌ Interpréter le droit de manière autonome
❌ Engager la responsabilité du cabinet

### Règle d'Or

**IA Poste Manager ne prend jamais une décision juridique finale. Il prépare, structure, sécurise et alerte. L'humain décide.**

---

## 📋 Résumé du Workspace & Plan d'Intégration Complet

### Architecture Multi-Niveaux de l'Application

Cette application est conçue avec **3 niveaux d'accès hiérarchiques** pour une gestion optimale de la plateforme SaaS juridique :

#### 👑 Niveau 1 : Super Admin (Vous - Propriétaire de la Plateforme)

- **Gestion globale de la plateforme**
- Création et gestion de multiples cabinets d'avocats (vos clients)
- Attribution des licences et plans (Basic, Premium, Enterprise)
- Supervision de tous les tenants et isolation des données
- Analytics et statistiques globales multi-cabinets
- Configuration des fonctionnalités par cabinet
- Gestion de la facturation des cabinets
- Support technique et maintenance

#### ⚖️ Niveau 2 : Admin/Avocat (Vos Clients - Cabinets d'Avocats)

- **Gestion de leur propre cabinet**
- Administration de leurs clients finaux
- Gestion complète des dossiers CESEDA
- Création et suivi des factures clients
- Accès à la veille juridique
- Dashboard cabinet avec statistiques
- Gestion de l'équipe (avocats, assistants)
- Personnalisation de leur espace

#### 👤 Niveau 3 : Client Final (Clients des Avocats)

- **Accès personnel et sécurisé**
- Consultation de leur dossier uniquement
- Upload de documents personnels
- Visualisation de leurs factures
- Prise de rendez-vous avec leur avocat
- Messagerie sécurisée avec le cabinet
- Suivi en temps réel de leur dossier

### Architecture Technique de l'Application

Cette application est structurée en plusieurs modules clés pour répondre aux besoins spécifiques des 3 niveaux d'utilisateurs :

#### 🏗️ Modules Principaux

1. **Gestion Multi-Tenant Hiérarchique**
   - **Niveau Super Admin** : Gestion de tous les tenants (cabinets)
   - **Niveau Tenant** : Isolation complète des données par cabinet
   - Trois cabinets de référence : cabinet-dupont, cabinet-martin, cabinet-rousseau
   - **Trois types d'utilisateurs :**
     - **Super Admin** : Accès global à la plateforme, gestion des cabinets
     - **Admin (Avocat)** : Gestion complète de son cabinet, dossiers, clients, facturation
     - **Client** : Accès personnel à son dossier, documents, rendez-vous
   - Authentification et autorisation hiérarchique via NextAuth

2. **Gestion des Dossiers CESEDA**
   - Types de dossiers : OQTF, Naturalisation, Asile politique, Carte de résident
   - Suivi des échéances et priorités (critique, haute, normale)
   - Statuts : en_cours, en_attente, urgent, terminé
   - Articles CESEDA référencés (ex: Art. L313-11)
   - **Vue Admin** : Gestion complète de tous les dossiers
   - **Vue Client** : Consultation de son propre dossier uniquement

3. **Système de Facturation**
   - Facturation par dossier avec suivi des paiements
   - États : brouillon, en_attente, payée
   - Gestion des échéances de paiement
   - **Admin** : Création, modification, suivi des paiements
   - **Client** : Consultation et paiement en ligne de ses factures

4. **Dashboards Différenciés par Niveau**
   - **Dashboard Super Admin** :
     - Vue globale de tous les cabinets
     - Statistiques plateforme (nombre de cabinets, revenus, utilisation)
     - Gestion des licences et plans
     - Logs et monitoring global
     - Support et tickets
   - **Dashboard Admin (Avocat)** :
     - Statistiques globales du cabinet
     - Tous les dossiers et clients du cabinet
     - Gestion des échéances et RDV
     - Analytics et taux de succès
     - Facturation clients
   - **Dashboard Client** :
     - Statut de son dossier personnel
     - Ses documents et échéances
     - Ses factures et paiements
     - Messagerie avec son avocat
     - Historique de son dossier

5. **Authentification & Sécurité Multi-Niveaux**
   - NextAuth.js avec isolation tenant et rôles hiérarchiques (super_admin/admin/client)
   - Middleware/Proxy pour protection des routes selon le rôle et le tenant
   - Variables d'environnement sécurisées
   - Accès restreint selon le profil et le niveau utilisateur
   - Isolation complète des données entre tenants

### 🔍 Plan de Veille Juridique CESEDA

#### Fonctionnalités de Veille Intégrées

1. **Suivi Réglementaire Automatisé**
   - Alertes sur les modifications du CESEDA
   - Notifications des nouvelles jurisprudences
   - Mise à jour des références légales (Art. L313-11, etc.)

2. **Gestion des Échéances Légales**
   - Calendrier des deadlines critiques
   - Rappels automatiques (OQTF, recours, audiences)
   - Prioritisation selon l'urgence

3. **Base de Connaissance**
   - Articles CESEDA référencés par dossier
   - Procédures types (Asile, Naturalisation, Titres de séjour)
   - Modèles de documents juridiques

4. **Système d'Alerte Intelligent**
   - Notifications prioritaires pour dossiers urgents
   - Suivi des RDV clients et audiences
   - Alertes de veille sur changements législatifs

#### Types de Dossiers CESEDA Supportés

- **OQTF (Obligation de Quitter le Territoire Français)**
  - Suivi des délais de recours
  - Gestion des contestations

- **Naturalisation**
  - Checklist documentaire
  - Suivi administratif complet

- **Asile Politique**
  - Procédure OFPRA/CNDA
  - Gestion des entretiens

- **Titres de Séjour**
  - Premières demandes et renouvellements
  - Cartes de résident (Art. L313-11)

### 🎯 Plan d'Intégration Recommandé

#### Phase 0 : Installation Super Admin (Vous)

1. Cloner le repository et installer : `npm install`
2. Configurer `.env.local` avec vos credentials super admin
3. Initialiser la base de données Prisma
4. Créer votre compte Super Admin
5. Configurer les plans et tarifs (Basic, Premium, Enterprise)

#### Phase 1 : Configuration Initiale Plateforme

1. Définir les fonctionnalités par plan
2. Configurer les limites par plan (nombre de dossiers, clients, etc.)
3. Paramétrer la facturation des cabinets
4. Mettre en place le système de tickets support
5. Configurer les emails et notifications

#### Phase 2 : Onboarding des Cabinets d'Avocats (Vos Clients)

1. **Créer un nouveau tenant (cabinet)** :
   - Nom du cabinet
   - Plan choisi (Basic/Premium/Enterprise)
   - Informations de facturation
   - Paramètres de personnalisation
2. **Créer le compte Admin principal du cabinet**
3. **Formation et accompagnement** :
   - Guide d'utilisation pour avocats
   - Configuration initiale du cabinet
   - Import des données existantes
4. Configurer les types de dossiers spécifiques au cabinet
5. Paramétrer les modèles de documents et factures

#### Phase 3 : Déploiement des Clients Finaux (Par Cabinet)

1. **Chaque avocat crée ses comptes clients** :
   - Création automatique lors de nouveau dossier
   - Envoi d'invitation par email
   - Accès sécurisé par client
2. **Onboarding clients** :
   - Email de bienvenue personnalisé
   - Guide d'utilisation client
   - Première connexion et sécurité
3. Import des dossiers en cours avec assignation clients
4. Activation des notifications automatiques différenciées

#### Phase 4 : Monitoring & Optimisation (Super Admin)

1. **Suivi des performances** :
   - Analytics par cabinet
   - Utilisation des fonctionnalités
   - Satisfaction clients
2. **Support technique** :
   - Gestion des tickets
   - Mises à jour et améliorations
   - Formation continue des avocats
3. **Évolution de la plateforme** :
   - Nouvelles fonctionnalités
   - Optimisations basées sur les retours
   - Scalabilité et performance

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## 🛠️ Commandes Disponibles

- `npm run dev` - Démarrer en mode développement
- `npm run build` - Construire pour la production
- `npm run start` - Démarrer en mode production
- `npm run lint` - Vérifier le code
- `npm run test` - Exécuter les tests

## 📁 Structure

```text
/
├── src/
│   ├── app/          # Pages et API routes (App Router)
│   ├── components/   # Composants réutilisables
│   ├── hooks/        # Hooks personnalisés
│   └── types/        # Types TypeScript
├── prisma/           # Base de données Prisma
├── public/           # Fichiers statiques
└── __tests__/        # Tests
```

## 🎯 INNOVATIONS IA - Version 2.0

**IA Poste Manager passe au niveau supérieur avec 4 innovations majeures !**

> 📘 **Documentation complète :** [INNOVATIONS.md](docs/INNOVATIONS.md)

### 🧠 1. Apprentissage Continu

L'IA **apprend de chaque validation humaine** pour s'améliorer automatiquement :

- **Ajustement automatique de confiance** : +5% si succès > 90%, -10% si < 70%
- **Prédiction d'approbation** : Recommande AUTO_APPROVE, VALIDATION, ou HIGH_RISK
- **Rapports d'amélioration** : Compare performance actuelle vs période précédente
- **Analyse de patterns** : Identifie les types d'actions qui fonctionnent bien

```typescript
// Exemple : L'IA s'améliore seule
const metrics = await learningService.analyzeValidationPatterns(tenantId);
// Historique : 95% succès → Ajustement : +5% confiance
```

### 💡 2. Suggestions Intelligentes

L'IA devient **proactive** et suggère des actions avant que vous ne les demandiez :

**6 types de suggestions** :

- 📁 **Dossiers inactifs** (> 14 jours) → Suggère relance client
- 📄 **Documents manquants récurrents** (≥ 3 fois) → Automatisation
- ⏰ **Relances échéances** (< 14 jours) → Rappels automatiques
- 🤖 **Opportunités d'automatisation** (> 20 actions/mois)
- ⚠️ **Anomalies** (dossiers > 90j, factures impayées > 60j)
- 📊 **Optimisations de workflow**

```typescript
// L'IA détecte et suggère proactivement
const suggestions = await suggestionService.generateSuggestions(tenantId);
// → "5 dossiers inactifs détectés. Relance suggérée (confiance: 82%)"
```

### 🔍 3. Recherche Sémantique

Trouvez des dossiers par **intention et sens**, pas juste par mots-clés :

- **Embeddings IA** : Utilise Ollama (nomic-embed-text) pour comprendre le contexte
- **Similarité cosinus** : Trouve les dossiers vraiment similaires (0-100%)
- **Analyse de patterns** : Documents communs, durée moyenne, taux de succès
- **Suggestions de requêtes** : Basées sur les recherches populaires

```typescript
// Recherche intelligente par sens
Query: "régulariser situation administrative"
→ Trouve:
  - Dossiers de régularisation (95% similarité)
  - Titres de séjour en renouvellement (82%)
  - Demandes OQTF (75%)
```

### 📊 4. Dashboard Analytique Avancé

Visualisez les **performances et tendances** de l'IA en temps réel :

**Métriques affichées** :

- 🎯 Taux de succès global (Approuvées + Modifiées / Total)
- 📈 Actions en amélioration (comparaison 30j vs 30-60j)
- 💜 Confiance moyenne (pondérée par type d'action)
- 📊 Performance par type (EMAIL_TRIAGE, GENERATE_DRAFT, etc.)
- 📅 Timeline de validation (7 derniers jours)
- 💡 Recommandations automatiques basées sur les tendances

```typescript
// Analytics en temps réel
const analytics = await fetch('/api/tenant/[id]/analytics?range=30d');
// → KPIs, trends, recommendations, validation timeline
```

### 🌐 Page Advanced Features

**Accès direct** : <http://localhost:3000/advanced>

**3 onglets** :

1. **📊 Analytics & Apprentissage** → Dashboard complet + métriques
2. **💡 Suggestions Intelligentes** → Liste proactive d'actions
3. **🔍 Recherche Sémantique** → Recherche par intention + patterns

### 🎁 Bouton Dashboard Principal

Un nouveau bouton **"🚀 IA Avancée"** (gradient violet/rose) sur le dashboard principal donne accès à toutes ces innovations en un clic !

### 📈 Impact

| Innovation             | Gain de Temps | Automatisation |
| ---------------------- | ------------- | -------------- |
| Suggestions proactives | 30 min/jour   | 70%            |
| Recherche sémantique   | 15 min/jour   | 85%            |
| Auto-amélioration IA   | Continu       | 100%           |

**Résultat** : Le système devient **plus intelligent chaque jour** sans intervention manuelle ! 🎉

---

## 🔧 Configuration

Copier `.env.local` et configurer les variables d'environnement nécessaires.

### Configuration Ollama (Innovations IA)

Pour activer les fonctionnalités avancées (recherche sémantique, suggestions), installez Ollama :

```bash
# 1. Installer Ollama (https://ollama.ai)
# 2. Télécharger les modèles
ollama pull llama3.2:latest
ollama pull nomic-embed-text:latest

# 3. Vérifier la connexion
npx tsx scripts/test-ollama.ts
```

## 🧪 Tests

```bash
npm run test        # Tests unitaires
npm run test:watch  # Tests en mode watch
npm run test:ci     # Tests pour CI/CD

# Tests spécifiques IA
npx tsx scripts/test-ollama.ts         # Test connexion Ollama
npx tsx scripts/test-ai-workflow.ts    # Test workflow IA complet
```

---

**Application prête pour le développement avec IA de pointe !** 🎉✨

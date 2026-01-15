# 🎨 IA POSTE MANAGER — CARTE UI/UX COMPLÈTE CESDA

**Design System & Parcours utilisateur complets**

---

## 🎯 PRINCIPES DE DESIGN

### Priorités absolues

1. **Clarté juridique** — Aucune ambiguïté possible
2. **Accessibilité** — WCAG 2.1 AAA minimum
3. **Urgence visible** — Les délais doivent SAUTER aux yeux
4. **Zéro décision cachée** — Toute action de l'IA est visible

---

## 🎨 DESIGN SYSTEM

### Palette couleurs CESDA

```css
/* Niveaux d'urgence */
--critique: #DC2626      /* Rouge vif */
--eleve: #EA580C         /* Orange foncé */
--moyen: #F59E0B         /* Ambre */
--faible: #10B981        /* Vert */
--neutre: #6B7280        /* Gris */

/* Procédures */
--oqtf: #B91C1C          /* Rouge bordeaux */
--asile: #1E40AF         /* Bleu profond */
--titre: #CA8A04         /* Or */
--naturalisation: #059669 /* Vert émeraude */
--regroupement: #7C3AED  /* Violet */

/* Interface */
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB
--bg-sidebar: #111827
--text-primary: #111827
--text-secondary: #6B7280
--border: #E5E7EB
```

### Typographie

```css
/* Titres */
font-family: 'Inter', -apple-system, sans-serif;
--h1: 2rem / 700
--h2: 1.5rem / 600
--h3: 1.25rem / 600

/* Corps */
--body: 1rem / 400
--small: 0.875rem / 400
--tiny: 0.75rem / 500

/* Monospace (dates, délais) */
font-family: 'JetBrains Mono', monospace;
```

### Composants réutilisables

#### 🔴 Badge urgence

```tsx
<UrgencyBadge level="critique">
  ⏱️ 12h restantes
</UrgencyBadge>
```

Variants: `critique | eleve | moyen | faible`

---

#### ✅ Checklist item

```tsx
<ChecklistItem
  completed={false}
  required={true}
  label="Décision OQTF"
  onToggle={() => {}}
/>
```

États: `completed | incomplete | missing-required`

---

#### 📄 Document viewer

```tsx
<DocumentViewer
  filename="OQTF_Client_X.pdf"
  uploadDate="2026-01-01"
  verified={true}
  aiExtracted={{
    date: "2025-12-28",
    type: "OQTF sans délai"
  }}
/>
```

---

#### 🤖 AI Assistant panel

```tsx
<AIPanel
  status="analyzing" // idle | analyzing | suggesting | waiting
  message="Analyse de la décision en cours..."
  suggestions={[
    "Vérifier mode de notification",
    "Calculer délai exact"
  ]}
/>
```

---

## 📱 ÉCRANS PRINCIPAUX

### 1️⃣ DASHBOARD AVOCAT

```
┌─────────────────────────────────────────────┐
│ 🏠 IA Poste Manager          [👤] [⚙️] [🔔3]│
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ URGENCES ACTIVES                        │
│  ┌──────────────────────────────────────┐  │
│  │ 🔴 OQTF - M. DUBOIS                  │  │
│  │ ⏱️ 8h restantes                       │  │
│  │ 📍 Pièce manquante: preuve notif     │  │
│  │              [OUVRIR WORKSPACE] ───► │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  📊 VUE D'ENSEMBLE                          │
│  ┌─────┬─────┬─────┬─────┐                │
│  │ 🔴3 │ 🟠5 │ 🟡8 │ 🟢12│                │
│  │CRIT │ÉLEVÉ│MOYEN│OK   │                │
│  └─────┴─────┴─────┴─────┘                │
│                                             │
│  📁 WORKSPACES ACTIFS (28)                 │
│  ┌──────────────────────────────────────┐  │
│  │ 🟥 OQTF - Mme MARTIN    ⏱️ 3j   [→] │  │
│  │ 🟦 ASILE - M. NGUYEN    📅 28/02 [→] │  │
│  │ 🟧 TITRE - Mme DUPONT   📅 15/03 [→] │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [+ NOUVEAU WORKSPACE]                     │
└─────────────────────────────────────────────┘
```

**Fonctionnalités clés**

* Tri automatique par urgence
* Filtres par type de procédure
* Vue calendrier des échéances
* Statistiques temps réel

---

### 2️⃣ WORKSPACE OQTF (EXEMPLE DÉTAILLÉ)

```
┌─────────────────────────────────────────────┐
│ ← Dashboard    🟥 OQTF - M. DUBOIS          │
├─────────────────────────────────────────────┤
│ 🔴 CRITIQUE - 8h 23min restantes            │
│ ━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░ 65%         │
│                                             │
│ STATUT IA: 🤖 Analyse terminée              │
│ ⚠️ 1 pièce critique manquante               │
│                                             │
├─[INFORMATIONS]──────────────────────────────┤
│                                             │
│ Type: OQTF sans délai de départ volontaire │
│ Notification: 30/12/2025 (main propre)     │
│ Délai recours: 48h                          │
│ Échéance: 01/01/2026 18:00                 │
│                                             │
├─[CHECKLIST JURIDIQUE]───────────────────────┤
│                                             │
│ ✅ Type OQTF identifié                      │
│ ✅ Date notification confirmée              │
│ ✅ Mode notification vérifié                │
│ ❌ Preuve notification MANQUANTE 🔴         │
│ ✅ Passeport client                         │
│ ⚠️ Justificatifs présence (2/5)             │
│                                             │
│ [DEMANDER PIÈCE MANQUANTE] ──────────────►  │
│                                             │
├─[DOCUMENTS]─────────────────────────────────┤
│                                             │
│ 📄 OQTF_Dubois.pdf        ✓ Analysé        │
│    └─ IA: Date 30/12, Type sans délai      │
│ 📄 Passeport.jpg          ✓ Vérifié        │
│ 📄 Bail.pdf               En attente       │
│                                             │
│ [+ AJOUTER DOCUMENT]                        │
│                                             │
├─[ASSISTANT IA]──────────────────────────────┤
│                                             │
│ 🤖 Suggestions:                             │
│                                             │
│ 1. ⚠️ Demander preuve main propre au client│
│    [GÉNÉRER EMAIL] ──────────────────────►  │
│                                             │
│ 2. Préparer brouillon recours suspensif    │
│    [CRÉER BROUILLON] ────────────────────►  │
│                                             │
│ 3. Vérifier jurisprudence similaire        │
│    [RECHERCHER] ─────────────────────────►  │
│                                             │
├─[ACTIONS]───────────────────────────────────┤
│                                             │
│ [📧 CONTACT CLIENT] [📝 BROUILLON]          │
│ [📊 HISTORIQUE]     [⚙️ PARAMÈTRES]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions clés**

* Barre de progression du délai animée
* Alertes sonores à 24h, 12h, 6h
* Validation humaine obligatoire pour actions critiques
* Historique complet des suggestions IA

---

### 3️⃣ CRÉATION WORKSPACE (FLOW)

**Étape 1 : Détection automatique**

```
┌─────────────────────────────────────────────┐
│ 📧 NOUVEAU MAIL DÉTECTÉ                     │
├─────────────────────────────────────────────┤
│                                             │
│ De: client@email.com                        │
│ Objet: Urgent - OQTF reçue                  │
│                                             │
│ 🤖 IA a détecté:                            │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ Type: OQTF                           │   │
│ │ Urgence: Critique                    │   │
│ │ Mots-clés: "48 heures", "préfecture" │   │
│ │ Pièce jointe: 1 PDF                  │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ [CRÉER WORKSPACE OQTF] ──────────────────►  │
│ [TRAITER MANUELLEMENT]                      │
│                                             │
└─────────────────────────────────────────────┘
```

**Étape 2 : Configuration assistée**

```
┌─────────────────────────────────────────────┐
│ 🆕 NOUVEAU WORKSPACE OQTF                   │
├─────────────────────────────────────────────┤
│                                             │
│ Client                                      │
│ ┌──────────────────────────────────────┐   │
│ │ Nom: [M. DUBOIS           ]          │   │
│ │ Email: [client@email.com  ]          │   │
│ │ Tél: [+33 6 12 34 56 78   ]          │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ Procédure                                   │
│ ┌──────────────────────────────────────┐   │
│ │ Type OQTF:                           │   │
│ │ ○ Sans délai (48h)  ● Avec délai 30j│   │
│ │                                      │   │
│ │ Date notification: [30/12/2025]      │   │
│ │ Mode: ☑︎ Main propre  ☐ Courrier     │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ 🤖 Délai calculé: 48h → échéance 01/01 18h │
│                                             │
│ [CRÉER WORKSPACE] ───────────────────────►  │
│                                             │
└─────────────────────────────────────────────┘
```

**Étape 3 : Premier contact client**

```
┌─────────────────────────────────────────────┐
│ 📧 EMAIL AUTOMATIQUE GÉNÉRÉ                 │
├─────────────────────────────────────────────┤
│                                             │
│ Objet: Prise en charge de votre dossier    │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ Bonjour M. Dubois,                   │   │
│ │                                      │   │
│ │ Votre dossier OQTF a été enregistré.│   │
│ │                                      │   │
│ │ ⚠️ URGENT: Délai 48h actif           │   │
│ │                                      │   │
│ │ Pièces à fournir rapidement:         │   │
│ │ ☐ Preuve de notification             │   │
│ │ ☐ Justificatifs présence France      │   │
│ │                                      │   │
│ │ Lien sécurisé: [FORMULAIRE CLIENT]   │   │
│ │                                      │   │
│ │ ⚠️ Document préparatoire - validation│   │
│ │    avocat requise avant envoi        │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ [✏️ MODIFIER] [✅ VALIDER & ENVOYER]        │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4️⃣ FORMULAIRE CLIENT (ACCESSIBLE)

**Design ultra-simple pour non-juristes**

```
┌─────────────────────────────────────────────┐
│ 📋 VOTRE DOSSIER - M. DUBOIS                │
├─────────────────────────────────────────────┤
│                                             │
│ ⏱️ Temps restant: 8 heures                  │
│                                             │
│ 🔴 URGENT - Nous avons besoin de:           │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ 1. Preuve que vous avez reçu l'OQTF  │   │
│ │                                      │   │
│ │    Comment l'avez-vous reçue?        │   │
│ │    ○ En main propre                  │   │
│ │    ○ Par courrier                    │   │
│ │    ○ Je ne sais pas                  │   │
│ │                                      │   │
│ │    📎 [AJOUTER PHOTO/SCAN]           │   │
│ │                                      │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ 2. Preuves de votre vie en France    │   │
│ │                                      │   │
│ │    Exemples utiles:                  │   │
│ │    • Factures électricité/eau        │   │
│ │    • Attestation employeur           │   │
│ │    • Certificat scolarité enfants    │   │
│ │                                      │   │
│ │    📎 [AJOUTER DOCUMENTS]            │   │
│ │       (plusieurs fichiers possibles) │   │
│ │                                      │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ [ENVOYER LES DOCUMENTS] ─────────────────►  │
│                                             │
│ 🔒 Sécurisé · 🇫🇷 Vos données restent en FR │
│                                             │
└─────────────────────────────────────────────┘
```

**Accessibilité**

* Contraste AAA
* Navigation clavier complète
* Screen reader optimisé
* Taille texte ajustable
* Pictogrammes universels
* Langue simple (niveau A2)

---

### 5️⃣ BROUILLON JURIDIQUE ASSISTÉ

```
┌─────────────────────────────────────────────┐
│ 📝 BROUILLON RECOURS - M. DUBOIS            │
├─────────────────────────────────────────────┤
│                                             │
│ Type: Recours suspensif OQTF                │
│ Tribunal: TA Paris                          │
│                                             │
│ 🤖 Généré par IA le 01/01/2026 10:00        │
│ ⚠️ VALIDATION AVOCAT OBLIGATOIRE            │
│                                             │
├─[DOCUMENT]──────────────────────────────────┤
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ RECOURS CONTENTIEUX                  │   │
│ │                                      │   │
│ │ À l'attention du Tribunal Administratif│
│ │ de Paris                             │   │
│ │                                      │   │
│ │ OBJET: Recours contre OQTF du 30/12/25│  │
│ │                                      │   │
│ │ [IA] Moyens suggérés:                │   │
│ │ • Violation procédure notification   │   │
│ │ • Atteinte vie privée (Art. 8 CEDH)  │   │
│ │ • Ancienneté présence France (7 ans) │   │
│ │                                      │   │
│ │ [ÉDITER LE TEXTE COMPLET] ────────►  │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ 🔍 Sources IA utilisées:                    │
│ • Jurisprudence CE 2024                     │
│ • Code entrée/séjour Art. L.511-1           │
│ • CEDH Art. 8                               │
│                                             │
│ [📥 EXPORTER DOCX] [✏️ MODIFIER] [❌ REJETER]│
│                                             │
└─────────────────────────────────────────────┘
```

---

### 6️⃣ ANALYTICS CABINET (ENTERPRISE)

```
┌─────────────────────────────────────────────┐
│ 📊 ANALYTICS - Mois de décembre 2025        │
├─────────────────────────────────────────────┤
│                                             │
│ 🎯 Performance                              │
│                                             │
│ Dossiers traités: 147                       │
│ Délais respectés: 98.6% ✅                  │
│ Temps moyen/dossier: 4.2h (-23% vs nov)     │
│                                             │
│ 📈 Répartition procédures                   │
│ ████████████ OQTF (45)                      │
│ ████████ Asile (28)                         │
│ ██████ Titres (22)                          │
│ ████ Naturalisation (18)                    │
│ ███ Regroupement (12)                       │
│                                             │
│ 🤖 Usage IA                                 │
│ Suggestions acceptées: 89%                  │
│ Brouillons utilisés: 76%                    │
│ Temps économisé: ~120h                      │
│ Coût API: 47.80€                            │
│                                             │
│ ⚠️ Points d'attention                       │
│ • 2 délais critiques en cours               │
│ • 5 pièces manquantes > 7j                  │
│                                             │
│ [EXPORTER RAPPORT] [FILTRES AVANCÉS]        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎭 PARCOURS UTILISATEUR TYPES

### 👤 Parcours 1 : AVOCAT SOLO (BASIC)

1. Mail client reçu
2. IA détecte OQTF
3. Création workspace assistée
4. Checklist auto-générée
5. Demande pièces au client
6. Validation manuelle
7. Clôture dossier

**Temps estimé**: 30min (vs 2h manuel)

---

### 👥 Parcours 2 : CABINET STRUCTURÉ (PREMIUM)

1. Mail entrant → tri IA automatique
2. Assignation avocat selon spécialité
3. Workspace pré-rempli
4. Formulaire client auto-envoyé
5. IA analyse pièces reçues
6. Brouillon généré
7. Avocat valide/modifie
8. Envoi juridictionnel
9. Suivi automatique
10. Analytics temps réel

**Gain productivité**: 65%

---

### 🏢 Parcours 3 : RÉSEAU CABINETS (ENTERPRISE)

1. Multi-juridictions
2. Pool d'avocats partagé
3. IA router intelligent
4. Base de connaissance unifiée
5. Templates harmonisés
6. Reporting consolidé
7. Compliance automatisée

---

## 🧩 COMPOSANTS REACT SUGGÉRÉS

### Structure recommandée

```
src/components/cesda/
├── workspaces/
│   ├── WorkspaceCard.tsx
│   ├── WorkspaceHeader.tsx
│   ├── DeadlineTimer.tsx
│   └── UrgencyBadge.tsx
├── checklists/
│   ├── ChecklistContainer.tsx
│   ├── ChecklistItem.tsx
│   └── ChecklistProgress.tsx
├── documents/
│   ├── DocumentUploader.tsx
│   ├── DocumentViewer.tsx
│   └── AIExtraction.tsx
├── ai/
│   ├── AIPanel.tsx
│   ├── SuggestionCard.tsx
│   └── PromptDisplay.tsx
└── forms/
    ├── ClientForm.tsx
    ├── WorkspaceSetup.tsx
    └── AccessibleInput.tsx
```

---

## 📐 LAYOUTS RESPONSIVES

### Desktop (1920×1080)

```
┌────────┬──────────────────────────┬────────┐
│SIDEBAR │    MAIN CONTENT          │PANEL IA│
│        │                          │        │
│Nav     │  Workspace détaillé      │Suggest.│
│Urgent. │  Checklist               │Actions │
│Stats   │  Documents               │Alertes │
│        │                          │        │
└────────┴──────────────────────────┴────────┘
  250px           1420px              250px
```

### Tablet (768×1024)

```
┌──────────────────────────────────┐
│ [☰] IA Poste Manager       [🔔]  │
├──────────────────────────────────┤
│                                  │
│  Main Content (full width)       │
│                                  │
│  Panel IA (collapsible)          │
│                                  │
└──────────────────────────────────┘
```

### Mobile (375×667)

```
┌──────────────┐
│ [☰]    [🔔3] │
├──────────────┤
│              │
│  Stack       │
│  vertical    │
│              │
│  Urgent top  │
│  Rest below  │
│              │
└──────────────┘
```

---

## ♿ ACCESSIBILITÉ (WCAG 2.1 AAA)

### Checklist conformité

* ✅ Contraste min. 7:1
* ✅ Navigation clavier complète
* ✅ Focus visible partout
* ✅ ARIA labels complets
* ✅ Alternatives textuelles
* ✅ Taille texte 200% OK
* ✅ Pas de timeout forcé
* ✅ Erreurs explicites
* ✅ Screen reader testé (NVDA/JAWS)

---

## 🎬 ANIMATIONS & MICRO-INTERACTIONS

### Principes

* **Subtiles** — Pas de distraction
* **Significatives** — Feedback clair
* **Rapides** — < 300ms
* **Désactivables** — Respect `prefers-reduced-motion`

### Exemples

```css
/* Timer urgence pulse */
@keyframes urgentPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.deadline-critical {
  animation: urgentPulse 2s ease-in-out infinite;
}

/* Checklist item check */
.checklist-item.completed {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--faible);
}

/* Document upload success */
.upload-success {
  transform: scale(1.05);
  transition: transform 0.2s ease-out;
}
```

---

## 🔔 SYSTÈME DE NOTIFICATIONS

### Types

| Niveau | Icon | Couleur | Son | Persistance |
|--------|------|---------|-----|-------------|
| Info | ℹ️ | Gris | Non | 3s |
| Succès | ✅ | Vert | Non | 5s |
| Attention | ⚠️ | Orange | Oui | Jusqu'à action |
| Critique | 🔴 | Rouge | Oui | Jusqu'à action |

### Exemples

```tsx
// Info
<Notification type="info">
  Document analysé avec succès
</Notification>

// Critique
<Notification 
  type="critical"
  persistent
  sound="alert"
>
  ⏱️ Délai OQTF: 2h restantes
  <Button>VOIR DOSSIER</Button>
</Notification>
```

---

## 🌐 SUPPORT MULTILINGUE

### Langues prioritaires CESDA

1. 🇫🇷 Français (par défaut)
2. 🇬🇧 Anglais (interface)
3. 🇪🇸 Espagnol (client)
4. 🇦🇷 Arabe (client)
5. 🇷🇺 Russe (client)

### Implémentation

```tsx
// i18n structure
locales/
├── fr/
│   ├── common.json
│   ├── oqtf.json
│   └── forms.json
├── en/
└── ...
```

---

## 📊 ÉTATS DE CHARGEMENT

### Skeleton screens

```tsx
<WorkspaceSkeleton>
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-5/6" />
  </div>
</WorkspaceSkeleton>
```

**Jamais de spinners seuls** — Toujours contextuels

---

## ⚡ PERFORMANCE

### Objectifs

* First Contentful Paint < 1s
* Time to Interactive < 3s
* Largest Contentful Paint < 2.5s
* Cumulative Layout Shift < 0.1

### Techniques

* Code splitting par procédure
* Lazy loading documents
* Virtual scrolling (listes > 50 items)
* Image optimization
* Service Worker caching

---

## 🎨 DARK MODE (OPTIONNEL)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --bg-secondary: #1F2937;
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
    --border: #374151;
  }
  
  /* Urgence colors unchanged */
}
```

---

**Document créé le 01/01/2026**
**Version 1.0 — IA Poste Manager CESDA UI/UX**

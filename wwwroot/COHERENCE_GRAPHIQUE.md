# 🎨 Cohérence Graphique MemoLib - Guide Complet

## ✅ Harmonisation Réalisée

### 📋 Résumé des Modifications

**Date**: 2025-01-XX  
**Modules harmonisés**: 2 (demo.html, integrations-dashboard.html)  
**Fichiers CSS unifiés**: memolib-theme.css (source unique de vérité)

---

## 🎯 Charte Graphique Unifiée

### Couleurs Principales

```css
--primary: #1e3a8a;           /* Bleu principal */
--primary-light: #1e40af;     /* Bleu clair */
--secondary: #d97706;         /* Orange accent */
--accent: #059669;            /* Vert accent */
```

### Couleurs Sémantiques

```css
--success: #10b981;           /* Vert succès */
--warning: #f59e0b;           /* Orange avertissement */
--danger: #dc2626;            /* Rouge danger */
--info: #3b82f6;              /* Bleu information */
```

### Couleurs Neutres

```css
--text-primary: #1f2937;      /* Texte principal */
--text-secondary: #6b7280;    /* Texte secondaire */
--border: #e5e7eb;            /* Bordures */
--bg: #f9fafb;                /* Arrière-plan */
--white: #ffffff;             /* Blanc */
```

---

## 🧩 Composants Standardisés

### 1. Boutons

**Classes disponibles:**
- `.btn` - Bouton principal (gradient bleu)
- `.btn-success` - Bouton succès (vert)
- `.btn-danger` - Bouton danger (rouge)
- `.btn-warning` - Bouton avertissement (orange)
- `.btn-secondary` - Bouton secondaire (gris)
- `.btn-sm` - Bouton petit format

**Exemple:**
```html
<button class="btn btn-primary">Action Principale</button>
<button class="btn btn-success btn-sm">Valider</button>
```

**Comportement:**
- Hover: Translation -2px + ombre accentuée
- Active: Retour position initiale
- Disabled: Opacité 50% + curseur interdit

---

### 2. Cards

**Classes disponibles:**
- `.card` - Card standard
- `.integration-card` - Card pour intégrations (bordure gauche colorée)
- `.integration-card.gmail` - Bordure rouge Gmail
- `.integration-card.outlook` - Bordure bleue Outlook
- `.integration-card.docusign` - Bordure jaune DocuSign
- `.integration-card.openai` - Bordure verte OpenAI

**Exemple:**
```html
<div class="integration-card gmail">
    <div class="integration-card-header">
        <span class="integration-card-title">📧 Gmail</span>
        <span class="integration-status healthy">
            <span class="integration-status-dot"></span>
            Opérationnel
        </span>
    </div>
    <div class="integration-metric">
        <span class="integration-metric-label">Temps de réponse</span>
        <span class="integration-metric-value">245ms</span>
    </div>
</div>
```

---

### 3. Status Badges

**Classes disponibles:**
- `.integration-status.healthy` - Statut sain (vert)
- `.integration-status.degraded` - Statut dégradé (orange)
- `.integration-status.unhealthy` - Statut défaillant (rouge)

**Avec dot animé:**
```html
<span class="integration-status healthy">
    <span class="integration-status-dot"></span>
    Opérationnel
</span>
```

---

### 4. Métriques

**Structure standardisée:**
```html
<div class="integration-metric">
    <span class="integration-metric-label">Libellé</span>
    <span class="integration-metric-value">Valeur</span>
</div>
```

**Caractéristiques:**
- Label: Gris secondaire, 0.875rem
- Value: Bleu primaire, 1.125rem, gras
- Séparateur: Bordure inférieure grise

---

### 5. Alertes

**Classes disponibles:**
- `.integration-alert.info` - Information (bleu)
- `.integration-alert.success` - Succès (vert)
- `.integration-alert.warning` - Avertissement (orange)
- `.integration-alert.error` - Erreur (rouge)

**Exemple:**
```html
<div class="integration-alert warning">
    ⚠️ Attention: Taux d'erreur élevé détecté
</div>
```

---

### 6. Badges

**Classes disponibles:**
- `.integration-badge.primary` - Badge primaire (bleu)
- `.integration-badge.success` - Badge succès (vert)
- `.integration-badge.warning` - Badge avertissement (orange)
- `.integration-badge.danger` - Badge danger (rouge)

**Exemple:**
```html
<span class="integration-badge success">Actif</span>
<span class="integration-badge warning">En attente</span>
```

---

### 7. Formulaires

**Structure standardisée:**
```html
<div class="integration-form-group">
    <label class="integration-form-label">Libellé</label>
    <input type="text" class="integration-form-input" placeholder="Saisie...">
</div>
```

**Comportement focus:**
- Bordure: Bleu primaire
- Ombre: 0 0 0 3px rgba(30, 58, 138, 0.1)

---

### 8. Tabs

**Structure standardisée:**
```html
<div class="tabs dashboard-tabs">
    <button class="tab active" onclick="switchTab('overview')">Vue d'ensemble</button>
    <button class="tab" onclick="switchTab('integrations')">Intégrations</button>
</div>
```

**États:**
- Normal: Transparent, texte gris
- Hover: Fond gris clair, texte bleu
- Active: Fond bleu, texte blanc, ombre

---

### 9. Grilles

**Classes disponibles:**
- `.dashboard-grid` - Grille responsive auto-fit (min 300px)
- `.stats` - Grille pour statistiques (min 240px)

**Exemple:**
```html
<div class="dashboard-grid">
    <div class="integration-card">...</div>
    <div class="integration-card">...</div>
    <div class="integration-card">...</div>
</div>
```

---

### 10. Modals

**Structure standardisée:**
```html
<div id="modal" class="modal integration-modal">
    <div class="modal-content">
        <div class="modal-header">
            <span class="modal-title">Titre</span>
            <span class="modal-close" onclick="closeModal()">&times;</span>
        </div>
        <div id="modal-body">Contenu...</div>
    </div>
</div>
```

**Activation:**
```javascript
document.getElementById('modal').classList.add('active');
```

---

## 🎬 Animations & Transitions

### Transitions Globales

```css
--transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

### Animations Spécifiques

**1. Spin (Loading)**
```css
@keyframes integration-spin {
    to { transform: rotate(360deg); }
}
```

**2. Slide In (Notifications)**
```css
@keyframes integration-slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
```

**3. Hover Cards**
- Transform: translateY(-2px)
- Shadow: Accentuée

---

## 📐 Espacements Standardisés

```css
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
```

---

## 🔲 Rayons de Bordure

```css
--radius-sm: 0.25rem;   /* 4px */
--radius: 0.5rem;       /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 999px;   /* Arrondi complet */
```

---

## 🌑 Ombres

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-md: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## 📱 Responsive Design

### Breakpoints

```css
@media (max-width: 768px) {
    /* Mobile */
    .header h1 { font-size: 2rem; }
    .stats { grid-template-columns: 1fr; }
    .tabs { flex-direction: column; }
}
```

---

## ✅ Checklist Intégration Nouveau Module

Lors de l'ajout d'un nouveau module HTML:

- [ ] Inclure `<link rel="stylesheet" href="css/memolib-theme.css">`
- [ ] Utiliser les classes standardisées (`.btn`, `.card`, `.integration-*`)
- [ ] Respecter la palette de couleurs (variables CSS)
- [ ] Utiliser les espacements standardisés (`var(--space-*)`)
- [ ] Appliquer les rayons de bordure (`var(--radius-*)`)
- [ ] Utiliser les ombres standardisées (`var(--shadow-*)`)
- [ ] Tester le responsive (< 768px)
- [ ] Vérifier les animations/transitions
- [ ] Valider l'accessibilité (contraste, focus)

---

## 🔧 Maintenance

### Modification de la Charte

**⚠️ IMPORTANT**: Toute modification de la charte graphique doit être effectuée dans:

1. **Source unique**: `wwwroot/css/memolib-theme.css`
2. **Documentation**: Mettre à jour ce fichier `COHERENCE_GRAPHIQUE.md`
3. **Propagation**: Vérifier tous les modules HTML

### Ajout de Nouveaux Composants

1. Créer le composant dans `memolib-theme.css`
2. Documenter dans cette section
3. Créer un exemple d'utilisation
4. Tester sur tous les modules existants

---

## 📊 Modules Harmonisés

| Module | Statut | Dernière MAJ | Composants |
|--------|--------|--------------|------------|
| demo.html | ✅ Harmonisé | 2025-01-XX | Tous |
| integrations-dashboard.html | ✅ Harmonisé | 2025-01-XX | Tous |
| dashboard-pro.html | ⏳ À harmoniser | - | - |
| team-management.html | ⏳ À harmoniser | - | - |

---

## 🎯 Prochaines Étapes

1. ✅ Harmoniser demo.html et integrations-dashboard.html
2. ⏳ Harmoniser dashboard-pro.html
3. ⏳ Harmoniser team-management.html
4. ⏳ Créer un guide de style interactif (style-guide.html)
5. ⏳ Automatiser les tests de cohérence graphique

---

## 📚 Ressources

- **Charte graphique**: `wwwroot/css/memolib-theme.css`
- **Design system**: `wwwroot/css/design-system.css` (legacy, à migrer)
- **Documentation**: Ce fichier
- **Exemples**: `demo.html`, `integrations-dashboard.html`

---

## 🤝 Contribution

Pour contribuer à l'harmonisation graphique:

1. Lire ce guide complet
2. Utiliser uniquement les classes standardisées
3. Ne pas créer de styles inline
4. Tester sur tous les breakpoints
5. Documenter les nouveaux composants

---

**Dernière mise à jour**: 2025-01-XX  
**Version**: 2.0  
**Auteur**: Équipe MemoLib

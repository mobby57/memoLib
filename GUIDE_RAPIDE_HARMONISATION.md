# 🚀 GUIDE RAPIDE: Harmoniser un Module

## ⚡ EN 5 ÉTAPES (15-30 MIN)

### 1️⃣ INCLURE LE THÈME (1 min)
```html
<head>
    <link rel="stylesheet" href="css/memolib-theme.css">
</head>
```

### 2️⃣ CRÉER CLASSES PRÉFIXÉES (10 min)
Dans `memolib-theme.css`:
```css
/* [Module] - Composants Spécifiques */
.[prefix]-container { ... }
.[prefix]-card { ... }
.[prefix]-button { ... }
```

**Préfixes par module**:
- dashboard-* → Dashboard
- team-* → Team Management
- parcours-* → Parcours
- client-* → Client
- integration-* → Integrations

### 3️⃣ REMPLACER STYLES INLINE (10 min)
**Avant**:
```html
<div style="background: #667eea; padding: 20px;">
```

**Après**:
```html
<div class="[prefix]-card">
```

### 4️⃣ UTILISER VARIABLES CSS (5 min)
**Avant**:
```css
color: #667eea;
padding: 20px;
```

**Après**:
```css
color: var(--primary);
padding: var(--space-lg);
```

### 5️⃣ TESTER & DOCUMENTER (5 min)
- [ ] Affichage correct
- [ ] Responsive (<768px)
- [ ] Hover effects
- [ ] Créer HARMONISATION_[MODULE].md

---

## 📋 CHECKLIST RAPIDE

- [ ] Inclure memolib-theme.css
- [ ] Supprimer `<style>` inline
- [ ] Préfixer classes spécifiques
- [ ] Utiliser variables CSS
- [ ] Tester responsive
- [ ] Documenter changements

---

## 🎨 VARIABLES CSS DISPONIBLES

### Couleurs
```css
var(--primary)      /* #1e3a8a */
var(--success)      /* #10b981 */
var(--warning)      /* #f59e0b */
var(--danger)       /* #dc2626 */
```

### Espacements
```css
var(--space-xs)     /* 4px */
var(--space-sm)     /* 8px */
var(--space-md)     /* 16px */
var(--space-lg)     /* 24px */
var(--space-xl)     /* 32px */
var(--space-2xl)    /* 48px */
```

### Rayons
```css
var(--radius-sm)    /* 4px */
var(--radius)       /* 8px */
var(--radius-lg)    /* 12px */
var(--radius-xl)    /* 16px */
var(--radius-full)  /* 999px */
```

### Ombres
```css
var(--shadow-sm)
var(--shadow)
var(--shadow-md)
var(--shadow-lg)
```

---

## 💡 EXEMPLES

### Bouton
```html
<button class="btn btn-primary">Action</button>
<button class="btn btn-success">Valider</button>
<button class="btn btn-danger">Supprimer</button>
```

### Card
```html
<div class="card">
    <h2>Titre</h2>
    <p>Contenu</p>
</div>
```

### Formulaire
```html
<div class="input-group">
    <label>Libellé</label>
    <input type="text" placeholder="Saisie...">
</div>
```

---

**Temps total**: 15-30 min/module  
**Résultat**: Module harmonisé à 100%

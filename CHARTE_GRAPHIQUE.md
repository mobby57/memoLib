# 🎨 CHARTE GRAPHIQUE MEMOLIB

## 📋 Identité Visuelle

### Nom du Projet
**MemoLib** - Système de Gestion d'Emails pour Cabinets d'Avocats

### Positionnement
Application professionnelle, moderne, fiable et accessible pour les professionnels du droit.

---

## 🎨 PALETTE DE COULEURS

### Couleurs Principales

#### Primaire - Bleu Professionnel
- **Couleur**: `#1e3a8a` (Bleu Marine)
- **Usage**: Boutons principaux, titres, éléments importants
- **Signification**: Confiance, professionnalisme, sérieux

#### Secondaire - Or Élégant  
- **Couleur**: `#d97706` (Or/Ambre)
- **Usage**: Accents, highlights, éléments d'attention
- **Signification**: Excellence, qualité, prestige

#### Accent - Vert Justice
- **Couleur**: `#059669` (Vert Émeraude)
- **Usage**: Succès, validations, confirmations
- **Signification**: Justice, équilibre, validation

### Couleurs Sémantiques

- **Succès**: `#10b981` (Vert)
- **Avertissement**: `#f59e0b` (Orange)
- **Erreur**: `#dc2626` (Rouge)
- **Information**: `#3b82f6` (Bleu Clair)

### Couleurs Neutres

- **Texte Principal**: `#1f2937` (Gris Foncé)
- **Texte Secondaire**: `#6b7280` (Gris Moyen)
- **Bordures**: `#e5e7eb` (Gris Clair)
- **Fond**: `#f9fafb` (Blanc Cassé)
- **Blanc**: `#ffffff`

---

## 📝 TYPOGRAPHIE

### Police Principale
**Segoe UI** (Windows) / **San Francisco** (Mac) / **Roboto** (Android)
- Disponible par défaut sur tous les systèmes
- Excellente lisibilité
- Professionnelle et moderne

### Hiérarchie des Tailles

```
H1 (Titres principaux):     2.5rem (40px) - Bold
H2 (Sous-titres):           1.875rem (30px) - SemiBold
H3 (Sections):              1.5rem (24px) - SemiBold
H4 (Sous-sections):         1.25rem (20px) - Medium
Body (Texte courant):       1rem (16px) - Regular
Small (Texte secondaire):   0.875rem (14px) - Regular
Tiny (Annotations):         0.75rem (12px) - Regular
```

### Poids de Police

- **Regular (400)**: Texte courant
- **Medium (500)**: Labels, sous-titres
- **SemiBold (600)**: Titres secondaires
- **Bold (700)**: Titres principaux, emphase

---

## 🔲 ESPACEMENTS & GRILLE

### Système d'Espacement (Multiple de 4px)

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

### Marges & Padding

- **Cards**: 24px (lg)
- **Sections**: 32px (xl)
- **Boutons**: 12px vertical, 24px horizontal
- **Inputs**: 12px vertical, 16px horizontal

---

## 🎯 COMPOSANTS

### Boutons

#### Bouton Principal
- **Fond**: Dégradé `#1e3a8a` → `#1e40af`
- **Texte**: Blanc `#ffffff`
- **Padding**: 12px 24px
- **Border-radius**: 8px
- **Ombre**: `0 4px 12px rgba(30, 58, 138, 0.25)`
- **Hover**: Légère élévation + ombre plus prononcée

#### Bouton Secondaire
- **Fond**: Transparent
- **Bordure**: 2px solid `#1e3a8a`
- **Texte**: `#1e3a8a`
- **Hover**: Fond `#eff6ff`

#### Bouton Succès
- **Fond**: `#10b981`
- **Texte**: Blanc
- **Usage**: Validations, confirmations

#### Bouton Danger
- **Fond**: `#dc2626`
- **Texte**: Blanc
- **Usage**: Suppressions, annulations

### Cards (Cartes)

- **Fond**: Blanc `#ffffff`
- **Bordure**: 1px solid `#e5e7eb`
- **Border-radius**: 12px
- **Ombre**: `0 4px 6px rgba(0, 0, 0, 0.05)`
- **Padding**: 24px
- **Hover**: Légère élévation

### Inputs (Champs de saisie)

- **Fond**: Blanc `#ffffff`
- **Bordure**: 2px solid `#e5e7eb`
- **Border-radius**: 8px
- **Padding**: 12px 16px
- **Focus**: Bordure `#1e3a8a` + ombre `0 0 0 3px rgba(30, 58, 138, 0.1)`

### Badges & Tags

- **Border-radius**: 999px (pill shape)
- **Padding**: 4px 12px
- **Font-size**: 0.75rem
- **Font-weight**: 600

---

## 🎭 OMBRES

### Hiérarchie des Ombres

```css
Aucune:     none
Subtile:    0 1px 2px rgba(0, 0, 0, 0.05)
Légère:     0 4px 6px rgba(0, 0, 0, 0.05)
Moyenne:    0 10px 15px rgba(0, 0, 0, 0.1)
Forte:      0 20px 25px rgba(0, 0, 0, 0.15)
Très forte: 0 25px 50px rgba(0, 0, 0, 0.25)
```

---

## 🔄 ANIMATIONS & TRANSITIONS

### Durées

- **Rapide**: 150ms (hover, focus)
- **Normal**: 250ms (transitions standard)
- **Lent**: 350ms (animations complexes)

### Courbes d'Animation

```css
Standard:   cubic-bezier(0.4, 0, 0.2, 1)
Entrée:     cubic-bezier(0, 0, 0.2, 1)
Sortie:     cubic-bezier(0.4, 0, 1, 1)
```

---

## 📐 BORDURES

### Rayons de Bordure

```
Petit:  4px   (boutons secondaires)
Moyen:  8px   (boutons, inputs)
Grand:  12px  (cards)
XL:     16px  (modals, sections)
Rond:   999px (badges, pills)
```

---

## 🎨 ÉTATS INTERACTIFS

### Hover (Survol)
- Légère élévation (translateY: -2px)
- Ombre plus prononcée
- Changement de couleur subtil

### Active (Clic)
- Retour à la position normale
- Ombre réduite

### Focus (Focus clavier)
- Bordure colorée
- Ombre de focus visible
- Outline pour accessibilité

### Disabled (Désactivé)
- Opacité: 0.5
- Cursor: not-allowed
- Pas d'interaction

---

## 📱 RESPONSIVE

### Breakpoints

```
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
Large:      > 1280px
```

### Adaptations

- **Mobile**: Navigation verticale, cards pleine largeur
- **Tablet**: Grille 2 colonnes
- **Desktop**: Grille 3-4 colonnes, sidebar

---

## ♿ ACCESSIBILITÉ

### Contrastes

- **Texte normal**: Ratio minimum 4.5:1
- **Texte large**: Ratio minimum 3:1
- **Éléments interactifs**: Ratio minimum 3:1

### Navigation Clavier

- Tous les éléments interactifs accessibles au clavier
- Focus visible sur tous les éléments
- Ordre de tabulation logique

### Lecteurs d'écran

- Labels appropriés sur tous les inputs
- Textes alternatifs sur les images
- ARIA labels quand nécessaire

---

## 🎯 PRINCIPES DE DESIGN

### 1. Clarté
- Interface épurée et lisible
- Hiérarchie visuelle claire
- Pas de surcharge d'informations

### 2. Cohérence
- Composants réutilisables
- Espacements uniformes
- Comportements prévisibles

### 3. Efficacité
- Actions rapides et directes
- Feedback immédiat
- Raccourcis clavier

### 4. Professionnalisme
- Design sobre et élégant
- Couleurs appropriées au secteur juridique
- Typographie lisible

---

## 📦 EXEMPLES D'UTILISATION

### Page d'Accueil
- Header avec logo et navigation
- Hero section avec titre principal
- Cards pour les fonctionnalités
- Footer avec informations

### Formulaires
- Labels clairs au-dessus des champs
- Messages d'erreur en rouge sous les champs
- Bouton de validation en bas à droite
- Feedback visuel sur la validation

### Listes & Tableaux
- Alternance de couleurs pour les lignes
- Hover sur les lignes cliquables
- Actions contextuelles visibles au survol
- Pagination en bas

---

## ✅ CHECKLIST DESIGN

- [ ] Couleurs conformes à la charte
- [ ] Typographie cohérente
- [ ] Espacements respectés
- [ ] Ombres appropriées
- [ ] Animations fluides
- [ ] Responsive testé
- [ ] Accessibilité validée
- [ ] Contrastes vérifiés

---

## 📄 FICHIERS DE RÉFÉRENCE

- **CSS Principal**: `modern-ui.css`
- **Variables CSS**: Définies dans `:root`
- **Composants**: Réutilisables et modulaires

---

**Version**: 1.0  
**Date**: 2025  
**Auteur**: Équipe MemoLib

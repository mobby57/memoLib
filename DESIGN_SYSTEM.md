# 🎨 Design System - IAPosteManager

## 🎯 **Philosophie Design**

### **Centré Utilisateur**
- Interface intuitive et accessible
- Feedback visuel immédiat
- Navigation claire et logique
- Responsive design mobile-first

### **Moderne & Professionnel**
- Design épuré et minimaliste
- Couleurs cohérentes et apaisantes
- Typographie lisible (Inter font)
- Animations subtiles et fluides

## 🎨 **Palette de Couleurs**

```css
--primary: #2563eb    /* Bleu principal - Actions */
--secondary: #64748b  /* Gris - Texte secondaire */
--success: #10b981    /* Vert - Succès/IA */
--warning: #f59e0b    /* Orange - Attention */
--danger: #ef4444     /* Rouge - Erreurs */
--dark: #1e293b       /* Texte principal */
--light: #f8fafc      /* Arrière-plan */
```

## 📐 **Layout & Grille**

### **Structure Principale**
- Header fixe avec gradient
- Sidebar 300px (sticky)
- Contenu principal responsive
- Grid system flexible

### **Breakpoints**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔤 **Typographie**

### **Font Stack**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### **Hiérarchie**
- H1: 1.5rem (Logo/Titre principal)
- H3: 1.1rem (Sections)
- Body: 0.9rem (Texte courant)
- Small: 0.8rem (Métadonnées)

## 🎛️ **Composants**

### **Boutons**
- Primary: Actions principales
- Success: Synchronisation
- Warning: Filtres IA
- Secondary: Actions secondaires
- Hover: Transform translateY(-1px)

### **Cards**
- Border-radius: 16px
- Box-shadow: 0 4px 20px rgba(0,0,0,0.08)
- Padding: 1.5rem
- Hover: Transform translateY(-2px)

### **Forms**
- Border-radius: 8px
- Focus: Border bleu + shadow
- Validation visuelle
- Labels descriptifs

## 🎭 **États & Interactions**

### **Loading States**
- Spinner animé
- Messages contextuels
- Skeleton screens

### **Notifications**
- Toast notifications
- Couleurs sémantiques
- Auto-dismiss (5s)
- Animations slide

### **Hover Effects**
- Boutons: Lift + couleur
- Cards: Subtle lift
- Links: Couleur change
- Transitions: 0.3s ease

## 📱 **Responsive Design**

### **Mobile (< 768px)**
- Navigation collapse
- Single column layout
- Touch-friendly buttons (44px min)
- Simplified interface

### **Tablet (768px - 1024px)**
- Sidebar collapse/expand
- Grid adaptation
- Optimized spacing

### **Desktop (> 1024px)**
- Full sidebar visible
- Multi-column grids
- Hover states active
- Keyboard navigation

## ♿ **Accessibilité**

### **WCAG 2.1 AA**
- Contraste minimum 4.5:1
- Focus indicators visibles
- Navigation clavier
- Screen reader friendly

### **Semantic HTML**
- Proper heading hierarchy
- ARIA labels
- Form labels
- Alt text images

## 🎨 **Iconographie**

### **Font Awesome 6.4.0**
- Consistent icon style
- Semantic usage
- Proper sizing
- Color inheritance

### **Custom Icons**
- Logo SVG scalable
- Favicon optimized
- Brand consistency

## 🚀 **Performance**

### **Optimisations**
- CSS minification
- Font preloading
- Image optimization
- Lazy loading

### **Core Web Vitals**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## 📋 **Guidelines d'Usage**

### **Do's ✅**
- Utiliser les couleurs système
- Respecter les espacements
- Maintenir la cohérence
- Tester sur mobile

### **Don'ts ❌**
- Mélanger les styles
- Ignorer l'accessibilité
- Surcharger l'interface
- Négliger les états de chargement

## 🔄 **Évolution**

Le design system évolue avec :
- Feedback utilisateurs
- Tests d'usabilité
- Nouvelles fonctionnalités
- Standards web modernes
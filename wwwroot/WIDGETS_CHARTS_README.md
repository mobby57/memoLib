# 🎨 MemoLib Widgets & Charts

Système de composants réutilisables pour créer des dashboards modernes et interactifs.

## 📦 Composants Disponibles

### 1. Charts (Graphiques)

#### Line Chart (Graphique en ligne)
```javascript
chartManager.createLineChart('canvas-id', {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
    values: [12, 19, 15, 25, 22],
    label: 'Emails'
}, {
    color: '#667eea',
    fill: true,
    tension: 0.4
});
```

#### Bar Chart (Graphique en barres)
```javascript
chartManager.createBarChart('canvas-id', {
    labels: ['Jan', 'Fév', 'Mar', 'Avr'],
    values: [10, 20, 15, 30],
    label: 'Dossiers'
}, {
    color: '#10b981'
});
```

#### Doughnut Chart (Graphique en donut)
```javascript
chartManager.createDoughnutChart('canvas-id', {
    labels: ['Ouverts', 'En cours', 'Clôturés'],
    values: [15, 30, 28]
}, {
    colors: ['#f59e0b', '#667eea', '#10b981'],
    legendPosition: 'bottom'
});
```

#### Radar Chart (Graphique radar)
```javascript
chartManager.createRadarChart('canvas-id', {
    labels: ['Réactivité', 'Qualité', 'Communication'],
    values: [85, 92, 78],
    label: 'Performance'
}, {
    color: '#667eea',
    max: 100
});
```

### 2. Widgets

#### Stat Widget (Widget de statistique)
```javascript
widgetManager.createStatWidget('container-id', {
    icon: '📧',
    value: 1247,
    label: 'Emails reçus',
    color: '#667eea',
    trend: 12.5  // Optionnel: pourcentage de variation
});
```

#### Progress Widget (Widget de progression)
```javascript
widgetManager.createProgressWidget('container-id', {
    label: 'Dossiers traités',
    percentage: 75,
    color: '#667eea',
    subtitle: '45 sur 60 dossiers'
});
```

#### Activity Widget (Widget d'activités)
```javascript
widgetManager.createActivityWidget('container-id', {
    title: 'Activités récentes',
    showViewAll: true,
    activities: [
        {
            icon: '📧',
            color: '#667eea',
            title: 'Nouvel email',
            description: 'Marie Dubois - Divorce urgent',
            time: 'Il y a 5 minutes'
        }
    ]
});
```

#### Sparkline Widget (Mini graphique)
```javascript
widgetManager.createSparklineWidget('container-id', {
    value: 1247,
    label: 'Emails (7 jours)',
    data: [120, 135, 142, 128, 155, 148, 162],
    color: '#667eea'
});
```

#### Compact Dashboard (Dashboard compact)
```javascript
widgetManager.createCompactDashboard('container-id', {
    title: 'Vue d\'ensemble',
    metrics: [
        { icon: '📧', value: 127, label: 'Emails', color: '#667eea' },
        { icon: '📁', value: 45, label: 'Dossiers', color: '#10b981' }
    ]
});
```

## 🔄 Mise à Jour Dynamique

### Mettre à jour un chart
```javascript
chartManager.updateChart('canvas-id', {
    labels: ['Nouveau', 'Labels'],
    values: [10, 20, 30]
});
```

### Mettre à jour un widget
```javascript
widgetManager.updateWidget('container-id', {
    value: 1500,
    percentage: 85
});
```

## ⚡ Auto-Refresh

### Activer l'auto-refresh sur un widget
```javascript
widgetManager.enableAutoRefresh('container-id', (id) => {
    // Logique de mise à jour
    widgetManager.updateWidget(id, { value: newValue });
}, 5000); // Toutes les 5 secondes
```

### Désactiver l'auto-refresh
```javascript
widgetManager.disableAutoRefresh('container-id');
```

## 🎨 Couleurs par Défaut

```javascript
{
    primary: '#667eea',   // Violet
    success: '#10b981',   // Vert
    warning: '#f59e0b',   // Orange
    danger: '#ef4444',    // Rouge
    info: '#3b82f6',      // Bleu
    purple: '#764ba2'     // Violet foncé
}
```

## 📱 Responsive

Tous les composants sont responsive et s'adaptent automatiquement aux écrans mobiles.

## 🚀 Installation

### 1. Inclure les fichiers CSS
```html
<link rel="stylesheet" href="css/widgets.css">
```

### 2. Inclure Chart.js
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### 3. Inclure les composants
```html
<script src="js/components/charts.js"></script>
<script src="js/components/widgets.js"></script>
```

## 📖 Exemple Complet

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="css/widgets.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
    <div id="my-stat-widget"></div>
    <canvas id="my-chart"></canvas>

    <script src="js/components/charts.js"></script>
    <script src="js/components/widgets.js"></script>
    <script>
        // Créer un widget
        widgetManager.createStatWidget('my-stat-widget', {
            icon: '📧',
            value: 1247,
            label: 'Emails',
            color: '#667eea',
            trend: 12.5
        });

        // Créer un graphique
        chartManager.createLineChart('my-chart', {
            labels: ['Lun', 'Mar', 'Mer'],
            values: [12, 19, 15],
            label: 'Activité'
        });
    </script>
</body>
</html>
```

## 🧹 Nettoyage

### Détruire un chart
```javascript
chartManager.destroyChart('canvas-id');
```

### Détruire tous les charts
```javascript
chartManager.destroyAll();
```

### Supprimer un widget
```javascript
widgetManager.removeWidget('container-id');
```

### Supprimer tous les widgets
```javascript
widgetManager.removeAll();
```

## 🎯 Démo Live

Voir `widgets-demo.html` pour une démonstration complète de tous les composants.

## ✨ Fonctionnalités

- ✅ Animations fluides
- ✅ Responsive design
- ✅ Auto-refresh configurable
- ✅ Mise à jour dynamique
- ✅ Thème personnalisable
- ✅ Performance optimisée
- ✅ API simple et intuitive
- ✅ Pas de dépendances (sauf Chart.js)

## 📊 Performance

- Animations GPU-accelerated
- Lazy loading des graphiques
- Debouncing des mises à jour
- Memory management automatique

## 🔧 Configuration Avancée

### Personnaliser les animations
```javascript
// Dans widgets.css
.stat-widget {
    animation: slideInUp 0.4s ease-out;
}
```

### Personnaliser les couleurs
```javascript
chartManager.defaultColors.primary = '#your-color';
```

## 📝 Notes

- Les widgets utilisent Flexbox et Grid pour le layout
- Les graphiques sont responsive par défaut
- Les animations sont optimisées pour les performances
- Compatible avec tous les navigateurs modernes

## 🐛 Dépannage

### Le graphique ne s'affiche pas
- Vérifier que Chart.js est chargé
- Vérifier que le canvas existe dans le DOM
- Vérifier la console pour les erreurs

### Le widget ne se met pas à jour
- Vérifier que l'ID du container est correct
- Vérifier que le widget a été créé avant la mise à jour
- Utiliser `console.log()` pour déboguer

## 📚 Ressources

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [MDN Web Docs - Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

**Développé pour MemoLib** - Système de gestion d'emails pour cabinets d'avocats

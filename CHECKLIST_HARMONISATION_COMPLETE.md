# ✅ CHECKLIST HARMONISATION COMPLÈTE

## 🎯 OBJECTIF: 100% MODULES HARMONISÉS

**Progression actuelle**: 6/13+ (46%)  
**Objectif**: 13/13+ (100%)  
**Restant**: 7 modules

---

## 📋 MODULES À HARMONISER

### Priorité 1 (Parcours Utilisateurs)
- [ ] parcours-assistant.html
- [ ] parcours-compliance.html
- [ ] parcours-finance.html
- [ ] parcours-manager.html
- [ ] parcours-owner.html

### Priorité 2 (Formulaires)
- [ ] intake-forms.html

### Priorité 3 (Autres)
- [ ] Identifier autres modules wwwroot/

---

## 🔧 PROCESSUS PAR MODULE

### 1. Analyse
- [ ] Lire le fichier HTML
- [ ] Identifier CSS inline
- [ ] Lister classes à créer
- [ ] Estimer temps (15-30 min/module)

### 2. Harmonisation
- [ ] Ajouter `<link rel="stylesheet" href="css/memolib-theme.css">`
- [ ] Créer classes préfixées dans memolib-theme.css
- [ ] Remplacer styles inline par classes
- [ ] Remplacer couleurs hardcodées par variables CSS
- [ ] Supprimer balise `<style>`

### 3. Validation
- [ ] Tester affichage
- [ ] Vérifier responsive (<768px)
- [ ] Valider accessibilité (focus, contraste)
- [ ] Tester interactions (hover, click)

### 4. Documentation
- [ ] Créer HARMONISATION_[MODULE].md
- [ ] Mettre à jour HARMONISATION_PROGRESSION.md
- [ ] Lister classes créées

---

## 📊 MÉTRIQUES CIBLES

### Par Module
- **CSS inline**: 0 ligne
- **Classes préfixées**: 100%
- **Variables CSS**: 100%
- **Cohérence**: 100%

### Globale
- **Modules harmonisés**: 13/13+ (100%)
- **Classes totales**: 200+
- **CSS inline supprimé**: 500+ lignes
- **Temps économisé**: 30 jours/an

---

## 🚀 PLAN D'EXÉCUTION

### Session 1 (2h)
- [ ] parcours-assistant.html
- [ ] parcours-compliance.html
- [ ] parcours-finance.html

### Session 2 (2h)
- [ ] parcours-manager.html
- [ ] parcours-owner.html
- [ ] intake-forms.html

### Session 3 (1h)
- [ ] Autres modules
- [ ] Tests finaux
- [ ] Documentation finale

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] 100% modules harmonisés
- [ ] 0 CSS inline
- [ ] Documentation complète
- [ ] Tests passent
- [ ] Guide de style créé
- [ ] ROI 600% validé

---

## 📝 COMMANDES UTILES

```powershell
# Analyser modules restants
.\harmonize-remaining-modules.ps1

# Compter lignes CSS inline
Get-ChildItem wwwroot\*.html | Select-String "<style>" | Measure-Object

# Lister modules non harmonisés
Get-ChildItem wwwroot\*.html | Where-Object { 
    (Get-Content $_.FullName -Raw) -notmatch 'memolib-theme\.css' 
}
```

---

**Créé**: 2025-03-09  
**Objectif**: 100% fin de semaine  
**Responsable**: Équipe MemoLib

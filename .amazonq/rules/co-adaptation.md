# Règle : Co-Adaptation Utilisateur–Application

## Principe

> L'application ne doit ni imposer ses logiques à l'utilisateur, ni se conformer intégralement à ses habitudes.

## Avant toute fonctionnalité, demande-toi :

« Cette fonctionnalité renforce-t-elle la collaboration entre l'utilisateur et le système, ou cherche-t-elle à faire disparaître l'identité de l'un au profit de l'autre ? »

## Règles pratiques

### NON-NÉGOCIABLE (identité application)
- Délais légaux CESEDA → calculés, jamais modifiables
- Audit trail RGPD → automatique, jamais désactivable
- Isolation multi-tenant → sécurité absolue
- Déduplication emails → intégrité données

### ADAPTABLE (identité utilisateur)
- Vocabulaire, labels, noms de statuts
- Ordre d'affichage, filtres par défaut
- Seuils d'urgence, préférences de notification
- Templates de documents personnalisés

### CO-ADAPTATIF (enrichissement mutuel)
- Le système OBSERVE les corrections récurrentes
- Il PROPOSE des ajustements (jamais impose)
- L'utilisateur peut ACCEPTER, MODIFIER ou REFUSER
- Toute adaptation est EXPLICABLE et RÉVERSIBLE

## Pattern d'implémentation

```typescript
// ❌ MAUVAIS — impose la logique système
const priority = aiClassification.priority; // forcé

// ❌ MAUVAIS — ignore la logique système
const priority = userInput.priority; // pas de garde-fou

// ✅ BON — co-adaptation
const suggestedPriority = aiClassification.priority;
const userOverride = getUserPreference(userId, 'priority_override', caseType);
const priority = userOverride ?? suggestedPriority;
// Si l'utilisateur override 3x de suite → proposer d'ajuster le défaut
```

## Référence complète

Voir `docs/DESIGN_PHILOSOPHY.md`

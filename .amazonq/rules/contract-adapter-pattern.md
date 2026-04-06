# Règle : Contract First + Adapter Pattern

## Principe fondamental

> L'API est la source de vérité. Le frontend s'adapte à l'API, jamais l'inverse.
> Les données libres (emails, formulaires partiels) passent TOUJOURS par une couche d'adaptation avant d'atteindre l'API.

---

## 1. Flux obligatoire pour toute donnée entrante

```
Input brut (email, formulaire, webhook)
       ↓
  Adapter / Parser
       ↓
  Draft (objet partiel typé)
       ↓
  Validation humaine (UI)
       ↓
  Mapper → format API
       ↓
  Appel API (données complètes)
```

**JAMAIS** de connexion directe `Input brut → API`.

---

## 2. Contrat de données (Contract First)

### Règles

- Chaque endpoint API a un type TypeScript dans `src/lib/api-types.ts` (source de vérité)
- Chaque formulaire UI a un type `*FormData` dans le composant ou dans `src/types/`
- La conversion entre les deux passe par un mapper dans `src/lib/mappers/`
- Les types Prisma/DB ne sont JAMAIS exposés directement au frontend

### Structure des types

```
src/lib/api-types.ts        → Types API (contrat backend)
src/types/*.types.ts        → Types UI / domaine
src/lib/mappers/*.mapper.ts → Conversion DB ↔ UI ↔ API
```

### Exemple

```typescript
// api-types.ts — contrat API
interface CreateCaseRequest {
  title: string;
  clientName?: string;
  clientEmail?: string;
  tags?: string[];
  priority?: number;
}

// types/dossier.types.ts — type UI
interface DossierFormData {
  typeDossier: string;
  objetDemande: string;
  nom: string;
  prenom: string;
  email: string;
  // ... champs UI
}

// mappers/dossier.mapper.ts — conversion
function mapFormToAPI(form: DossierFormData): CreateCaseRequest {
  return {
    title: `${form.typeDossier} - ${form.objetDemande}`,
    clientName: `${form.prenom} ${form.nom}`,
    clientEmail: form.email,
    priority: mapPrioriteToNumber(form.priorité),
  };
}
```

---

## 3. Pattern Adapter pour emails

### Flux email → dossier

```
Email brut (corps texte libre)
       ↓
  EmailAdapter.extractDraft(email)
       ↓
  LegalCaseDraft (champs nullable)
       ↓
  UI validation (champs pré-remplis, utilisateur complète)
       ↓
  mapDraftToAPI(draft) → CreateCaseRequest
       ↓
  POST /api/dossiers
```

### Draft = objet partiel

```typescript
// Tous les champs sont optionnels
interface LegalCaseDraft {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  caseType?: string;
  deadline?: string;
  rawContent: string; // toujours garder l'original
  confidence: Record<string, number>; // score de confiance par champ
}
```

### Règles du Draft

- Un draft n'est JAMAIS envoyé directement à l'API
- Un draft incomplet déclenche un écran de validation humaine
- Le champ `rawContent` est toujours conservé pour traçabilité
- Le champ `confidence` indique la fiabilité de l'extraction

---

## 4. UI des formulaires — Design unifié

### Composants obligatoires

Tout formulaire de saisie utilise les composants partagés :

```
src/components/forms/FormField.tsx   → FormField, FormInput, FormSelect, FormTextarea
src/components/forms/FormLayout.tsx  → FormPageLayout, FormCard, FormHeader, FormError, FormSuccessPage, StepProgress
src/components/forms/Button.tsx      → Button
```

### Règles visuelles (alignées sur la page login)

- Fond page : `bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900`
- Carte formulaire : `bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20`
- Inputs : `border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 py-3`
- Labels : `text-sm font-semibold text-gray-700`
- Bouton principal : `bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl`
- Erreurs : `border-l-4 border-red-500` avec icône AlertCircle
- Succès : composant `FormSuccessPage` avec CheckCircle

### Pages internes (dashboard, admin)

- Fond : `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`
- Cartes : `bg-white rounded-2xl shadow-xl p-8`
- Mêmes inputs/labels/boutons que ci-dessus

---

## 5. Validation

### Côté frontend

- Validation Zod pour les formulaires complexes (multi-étapes)
- Validation HTML native (`required`, `type="email"`) pour les formulaires simples
- Message d'erreur sous le champ via `FormField` error prop

### Côté API

- Chaque endpoint valide son input avec le type attendu
- Retour `400` avec message clair si données invalides
- JAMAIS de `any` dans les handlers API

---

## 6. Checklist avant tout nouveau formulaire

- [ ] Type API défini dans `api-types.ts`
- [ ] Type FormData défini (composant ou `types/`)
- [ ] Mapper créé dans `mappers/` si conversion nécessaire
- [ ] Composants `FormField` / `FormLayout` utilisés
- [ ] Validation (Zod ou HTML native)
- [ ] Gestion erreur avec `FormError`
- [ ] Gestion succès avec `FormSuccessPage` ou redirect
- [ ] Si input libre (email) : Draft + validation humaine obligatoire

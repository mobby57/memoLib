# 🚀 Guide Rapide - Nouvelle Architecture

## 📦 Import Essentiels

```typescript
// Constantes
import { 
  STATUTS_UI, 
  PRIORITES_UI,
  TYPES_DOSSIER,
  mapStatutToDB,
  mapPrioriteToDB 
} from '@/lib/constants/dossier.constants'

// Types
import type { 
  DossierUI,
  CreateDossierDTO,
  CreateDemandeClientDTO 
} from '@/types/dossier.types'

// Services
import { DossierService } from '@/lib/services/dossier.service'

// Mappers
import { mapDossierToUI, formatDate } from '@/lib/mappers/dossier.mapper'

// Validations
import { createDossierSchema } from '@/lib/validations/dossier.validation'
```

---

## 🎯 Cas d'Usage Courants

### 1. Créer un Dossier (Avocat)

```typescript
// Dans une route API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const tenantId = (session.user as any).tenantId
    
    // 1. Parser le body
    const body = await request.json()
    
    // 2. Valider avec Zod
    const data = createDossierSchema.parse(body)
    
    // 3. Créer via service
    const dossierDB = await DossierService.createDossier(data, tenantId)
    
    // 4. Transformer pour UI
    const dossierUI = mapDossierToUI(dossierDB)
    
    // 5. Retourner
    return NextResponse.json({ dossier: dossierUI }, { status: 201 })
  } catch (error) {
    // Gestion d'erreur...
  } finally {
    await DossierService.disconnect()
  }
}
```

### 2. Créer une Demande (Client)

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  const clientId = (session.user as any).clientId
  const tenantId = (session.user as any).tenantId
  
  const body = await request.json()
  const data = createDemandeClientSchema.parse(body)
  
  const dossierDB = await DossierService.createDemandeClient(
    data,
    tenantId,
    clientId
  )
  
  const dossierUI = mapDossierToUI(dossierDB)
  return NextResponse.json({ dossier: dossierUI })
}
```

### 3. Lister les Dossiers

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession()
  const tenantId = (session.user as any).tenantId
  
  const dossiersDB = await DossierService.getDossiersByTenant(tenantId)
  const dossiersUI = dossiersDB.map(mapDossierToUI)
  
  return NextResponse.json({ dossiers: dossiersUI })
}
```

### 4. Mettre à Jour un Dossier

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  const tenantId = (session.user as any).tenantId
  
  const body = await request.json()
  const data = updateDossierSchema.parse(body)
  
  const dossierDB = await DossierService.updateDossier(
    params.id,
    tenantId,
    data
  )
  
  const dossierUI = mapDossierToUI(dossierDB)
  return NextResponse.json({ dossier: dossierUI })
}
```

### 5. Supprimer un Dossier

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  const tenantId = (session.user as any).tenantId
  
  await DossierService.deleteDossier(params.id, tenantId)
  
  return NextResponse.json({ message: 'Dossier supprimé' })
}
```

---

## 🎨 Utilisation dans les Composants UI

### Afficher un Statut avec Badge

```typescript
import { STATUT_COLORS } from '@/lib/constants/dossier.constants'
import { Badge } from '@/components/ui'

function DossierCard({ dossier }: { dossier: DossierUI }) {
  return (
    <div>
      <h3>{dossier.numeroDossier}</h3>
      <Badge variant={STATUT_COLORS[dossier.statut]}>
        {dossier.statut}
      </Badge>
    </div>
  )
}
```

### Formater une Date

```typescript
import { formatDate } from '@/lib/mappers/dossier.mapper'

function DossierInfo({ dossier }: { dossier: DossierUI }) {
  return (
    <p>Créé le {formatDate(dossier.dateCreation)}</p>
  )
}
```

### Formulaire avec Validation

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDossierSchema } from '@/lib/validations/dossier.validation'

function NouveauDossierForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createDossierSchema)
  })
  
  const onSubmit = async (data) => {
    const res = await fetch('/api/admin/dossiers', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    // ...
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* champs... */}
    </form>
  )
}
```

---

## 🔍 Debugging

### Vérifier le Type d'un Dossier

```typescript
import type { DossierUI, DossierDB } from '@/types/dossier.types'

// Hover sur la variable pour voir le type
const dossier: DossierUI = ...

// TypeScript vous dira si vous utilisez mal un champ
dossier.numeroDossier  // ✅ OK
dossier.numero         // ❌ Erreur: Property 'numero' does not exist
```

### Logger les Transformations

```typescript
const dossierDB = await DossierService.getDossierById(id, tenantId)
console.log('DB format:', dossierDB)

const dossierUI = mapDossierToUI(dossierDB)
console.log('UI format:', dossierUI)
```

---

## ⚠️ Erreurs Courantes

### ❌ Utiliser les mauvais noms de champs

```typescript
// WRONG
const dossier = await prisma.dossier.create({
  data: {
    numeroDossier: 'D-2026-001',  // ❌ N'existe pas en DB
    objetDemande: '...'            // ❌ N'existe pas en DB
  }
})

// CORRECT
const dossier = await prisma.dossier.create({
  data: {
    numero: 'D-2026-001',  // ✅ Champ DB
    objet: '...'           // ✅ Champ DB
  }
})

// BETTER: Utiliser le service
const dossier = await DossierService.createDossier(data, tenantId)
```

### ❌ Oublier les mappers

```typescript
// WRONG
return NextResponse.json({ dossier: dossierDB })  // ❌ Format DB au front

// CORRECT
const dossierUI = mapDossierToUI(dossierDB)
return NextResponse.json({ dossier: dossierUI })  // ✅ Format UI
```

### ❌ Utiliser des valeurs en dur

```typescript
// WRONG
if (dossier.statut === 'en_cours') { }  // ❌ Typo facile

// CORRECT
import { STATUTS_DB } from '@/lib/constants/dossier.constants'
if (dossier.statut === STATUTS_DB.EN_COURS) { }  // ✅ Type-safe
```

---

## 📝 Checklist Route API

Quand vous créez une nouvelle route API pour les dossiers:

- [ ] Importer les types: `DossierUI`, `DossierDB`, `CreateDossierDTO`
- [ ] Utiliser `DossierService` au lieu de Prisma direct
- [ ] Valider avec schéma Zod approprié
- [ ] Transformer DB → UI avec `mapDossierToUI()`
- [ ] Gérer les erreurs (401, 403, 404, 500)
- [ ] Appeler `DossierService.disconnect()` dans `finally`
- [ ] Tester avec différents rôles (CLIENT, AVOCAT)
- [ ] Vérifier l'isolation multi-tenant

---

## 🎯 Exemple Complet: Route GET /api/admin/dossiers

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { DossierService } from '@/lib/services/dossier.service'
import { mapDossiersToUI } from '@/lib/mappers/dossier.mapper'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentification
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Vérification rôle
    const userRole = (session.user as any).role
    if (userRole !== 'AVOCAT' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux avocats' },
        { status: 403 }
      )
    }

    // 3. Vérification tenant
    const tenantId = (session.user as any).tenantId
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant non trouvé' },
        { status: 403 }
      )
    }

    // 4. Récupération via service
    const dossiersDB = await DossierService.getDossiersByTenant(tenantId)

    // 5. Transformation UI
    const dossiersUI = mapDossiersToUI(dossiersDB)

    // 6. Réponse
    return NextResponse.json({ dossiers: dossiersUI })
  } catch (error) {
    console.error('Erreur récupération dossiers:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: (error as Error).message },
      { status: 500 }
    )
  } finally {
    await DossierService.disconnect()
  }
}
```

---

## 🚀 Prochaines Étapes

1. **Lire** [`AMELIORATIONS_REALISEES.md`](./AMELIORATIONS_REALISEES.md)
2. **Voir** les exemples dans les nouveaux services
3. **Migrer** une route API existante
4. **Partager** vos feedbacks

**Happy coding! 🎉**

import os
import re

print("🚀 Démarrage du script automatique - Tâche 1 (Sécurité & CESEDA)")

# ==========================================
# 1. CORRECTION DE L'ERREUR CLERK (logs/route.ts)
# ==========================================
route_logs = "src/app/api/admin/logs/route.ts"
if os.path.exists(route_logs):
    with open(route_logs, "r", encoding="utf-8") as f:
        code = f.read()
    
    # Ajouter l'import si manquant
    if "currentUser" not in code:
        code = "import { currentUser } from '@clerk/nextjs/server';\n" + code
    
    # Remplacer l'usage de auth() par currentUser()
    code = code.replace("const { user } = await auth();", "const user = await currentUser();")
    
    with open(route_logs, "w", encoding="utf-8") as f:
        f.write(code)
    print("✅ 1. Erreur Clerk corrigée dans logs/route.ts")
else:
    print("⚠️ 1. Fichier logs/route.ts introuvable.")

# ==========================================
# 2. CRÉATION DU MOTEUR DE DÉLAIS (ceseda-delais.ts)
# ==========================================
os.makedirs("src/lib", exist_ok=True)
fichier_delais = """import { addHours, addDays, addMonths } from 'date-fns';

export type TypeRecours = 'OQTF_48H' | 'REFUS_TITRE_2MOIS' | 'ASILE_15J';

export function calculerDateLimite(typeRecours: TypeRecours, dateNotification: Date): Date {
  switch (typeRecours) {
    case 'OQTF_48H':
      return addHours(dateNotification, 48);
    case 'REFUS_TITRE_2MOIS':
      return addMonths(dateNotification, 2);
    case 'ASILE_15J':
      return addDays(dateNotification, 15);
    default:
      throw new Error("Type de recours inconnu");
  }
}

export function estUrgent(dateLimite: Date): boolean {
  const maintenant = new Date();
  const differenceEnJours = (dateLimite.getTime() - maintenant.getTime()) / (1000 * 3600 * 24);
  return differenceEnJours < 7 && differenceEnJours > 0;
}
"""
with open("src/lib/ceseda-delais.ts", "w", encoding="utf-8") as f:
    f.write(fichier_delais)
print("✅ 2. Fichier src/lib/ceseda-delais.ts créé.")

# ==========================================
# 3. CRÉATION DE LA ROUTE API SÉCURISÉE (cases/route.ts)
# ==========================================
os.makedirs("src/app/api/cases", exist_ok=True)
fichier_api = """import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { calculerDateLimite, TypeRecours } from '@/lib/ceseda-delais';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation stricte des données avec Zod
const CreateCaseSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  clientId: z.string().cuid("ID client invalide"),
  typeDossier: z.enum(['OQTF', 'REFUS_TITRE', 'ASILE', 'RETENTION']),
  dateNotification: z.string().datetime().optional(),
  prefecture: z.string().optional(),
  numeroAGDREF: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Authentification Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 2. Validation Zod
    const body = await req.json();
    const validation = CreateCaseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() }, 
        { status: 400 }
      );
    }

    const { title, clientId, typeDossier, dateNotification, prefecture, numeroAGDREF } = validation.data;

    // 3. Sécurité Prisma (Isolation multi-tenant)
    const clientExists = await prisma.client.findFirst({
      where: { id: clientId, userId: userId } 
    });

    if (!clientExists) {
      return NextResponse.json({ error: "Client introuvable ou non autorisé" }, { status: 404 });
    }

    // 4. Calcul automatique du délai CESEDA
    let dateLimiteRecours = null;
    if (dateNotification) {
      const dateNotif = new Date(dateNotification);
      const typeRecours: TypeRecours = 
        typeDossier === 'OQTF' ? 'OQTF_48H' : 
        typeDossier === 'ASILE' ? 'ASILE_15J' : 'REFUS_TITRE_2MOIS';
      dateLimiteRecours = calculerDateLimite(typeRecours, dateNotif);
    }

    // 5. Création sécurisée
    const newCase = await prisma.case.create({
      data: {
        title, clientId, typeDossier, prefecture, numeroAGDREF,
        dateNotification: dateNotification ? new Date(dateNotification) : null,
        dateLimiteRecours,
        statut: 'OUVERT'
      }
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });

  } catch (error) {
    console.error("[SECURE_API] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
"""
with open("src/app/api/cases/route.ts", "w", encoding="utf-8") as f:
    f.write(fichier_api)
print("✅ 3. Route API sécurisée créée : src/app/api/cases/route.ts")

# ==========================================
# 4. MISE À JOUR DE PRISMA (schema.prisma)
# ==========================================
prisma_path = "prisma/schema.prisma"
if os.path.exists(prisma_path):
    with open(prisma_path, "r", encoding="utf-8") as f:
        schema = f.read()

    nouveau_modele = """model Case {
  id                String   @id @default(cuid())
  title             String
  clientId          String
  client            Client   @relation(fields: [clientId], references: [id])
  
  typeDossier       String
  prefecture        String?
  numeroAGDREF      String?
  dateNotification  DateTime?
  dateLimiteRecours DateTime?
  statut            String   @default("OUVERT")
  
  documents         Document[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}"""

    if "model Case" in schema:
        schema = re.sub(r'model Case \{.*?\}', nouveau_modele, schema, flags=re.DOTALL)
        print("✅ 4. Modèle 'Case' mis à jour dans schema.prisma.")
    else:
        schema += "\n\n" + nouveau_modele
        print("✅ 4. Modèle 'Case' ajouté à schema.prisma.")

    with open(prisma_path, "w", encoding="utf-8") as f:
        f.write(schema)
else:
    print("⚠️ 4. Fichier prisma/schema.prisma introuvable.")
    
print("\n🎉 Script terminé ! Passe à l'étape 2 (installation des dépendances).")

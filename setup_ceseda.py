import os
import re

# ==========================================
# 1. MISE À JOUR DU SCHÉMA PRISMA
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
  
  // --- SPÉCIFIQUE CESEDA ---
  typeDossier       String
  prefecture        String?
  numeroAGDREF      String?
  dateNotification  DateTime?
  dateLimiteRecours DateTime?
  statut            String   @default("OUVERT")
  
  // --- GESTION DES DOCUMENTS ---
  documents         Document[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}"""

    if "model Case" in schema:
        # Remplacer le modèle existant
        schema = re.sub(r'model Case \{.*?\}', nouveau_modele, schema, flags=re.DOTALL)
        print("✅ Modèle 'Case' existant remplacé dans schema.prisma.")
    else:
        # Ajouter à la fin
        schema += "\n\n" + nouveau_modele
        print("✅ Modèle 'Case' ajouté à schema.prisma.")

    with open(prisma_path, "w", encoding="utf-8") as f:
        f.write(schema)
else:
    print("❌ Fichier prisma/schema.prisma introuvable.")

# ==========================================
# 2. CRÉATION DE L'UTILITAIRE DE DÉLAIS
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
print("✅ Fichier src/lib/ceseda-delais.ts créé.")

# ==========================================
# 3. CRÉATION DE LA ROUTE API NEXT.JS
# ==========================================
os.makedirs("src/app/api/cases", exist_ok=True)
fichier_api = """import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculerDateLimite, TypeRecours } from '@/lib/ceseda-delais';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { title, clientId, typeDossier, dateNotification, prefecture, numeroAGDREF } = body;

    let dateLimiteRecours = null;
    if (dateNotification) {
      const dateNotif = new Date(dateNotification);
      const typeRecours: TypeRecours = 
        typeDossier === 'OQTF' ? 'OQTF_48H' : 
        typeDossier === 'ASILE' ? 'ASILE_15J' : 'REFUS_TITRE_2MOIS';
        
      dateLimiteRecours = calculerDateLimite(typeRecours, dateNotif);
    }

    const newCase = await prisma.case.create({
      data: {
        title,
        clientId,
        typeDossier,
        prefecture,
        numeroAGDREF,
        dateNotification: dateNotification ? new Date(dateNotification) : null,
        dateLimiteRecours,
        statut: 'OUVERT'
      }
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });

  } catch (error) {
    console.error("Erreur création dossier:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
"""
with open("src/app/api/cases/route.ts", "w", encoding="utf-8") as f:
    f.write(fichier_api)
print("✅ Fichier src/app/api/cases/route.ts créé.")
print("\n🚀 Tout est prêt ! N'oublie pas d'installer 'date-fns' et de mettre à jour Prisma.")

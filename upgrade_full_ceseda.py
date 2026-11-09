import os
import re

print("🚀 Mise à niveau vers l'écosystème CESEDA COMPLET...")

# ==========================================
# 1. NOUVELLE TAXONOMIE CESEDA (TypeScript)
# ==========================================
os.makedirs("src/lib", exist_ok=True)
fichier_delais = """import { addDays, addMonths, addHours, isWeekend } from 'date-fns';

// 1. Définition de TOUS les types de dossiers CESEDA
export type CategorieCESEDA = 
  | 'SEJOUR' 
  | 'ELOIGNEMENT' 
  | 'ASILE' 
  | 'NATIONALITE';

export type TypeProcedure = 
  // Séjour
  | 'REFUS_TITRE_2MOIS' | 'REFUS_RENOUVELLEMENT_2MOIS' | 'RETRAIT_TITRE_2MOIS'
  // Éloignement
  | 'OQTF_48H' | 'OQTF_7J' | 'OQTF_30J' | 'RETENTION_48H' | 'IRTF_2MOIS'
  // Asile
  | 'REFUS_OFPRA_1MOIS' | 'REFUS_CNDA_2MOIS'
  // Nationalité
  | 'REFUS_NATURALISATION_2MOIS' | 'REFUS_VISA_CRV_2MOIS';

// 2. Configuration des règles métier
interface RegleDelai {
  categorie: CategorieCESEDA;
  duree: number;
  unite: 'heures' | 'jours' | 'mois';
  juridiction: string; // Où on dépose le recours
  description: string;
}

export const CESEDA_TAXONOMY: Record<TypeProcedure, RegleDelai> = {
  // --- SÉJOUR ---
  'REFUS_TITRE_2MOIS': { categorie: 'SEJOUR', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Refus initial de titre de séjour' },
  'REFUS_RENOUVELLEMENT_2MOIS': { categorie: 'SEJOUR', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Refus de renouvellement' },
  'RETRAIT_TITRE_2MOIS': { categorie: 'SEJOUR', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Retrait de titre de séjour' },

  // --- ÉLOIGNEMENT ---
  'OQTF_48H': { categorie: 'ELOIGNEMENT', duree: 48, unite: 'heures', juridiction: 'Tribunal Administratif', description: 'OQTF sans délai (urgence absolue)' },
  'OQTF_7J': { categorie: 'ELOIGNEMENT', duree: 7, unite: 'jours', juridiction: 'Tribunal Administratif', description: 'OQTF avec délai de départ de 7 jours' },
  'OQTF_30J': { categorie: 'ELOIGNEMENT', duree: 30, unite: 'jours', juridiction: 'Tribunal Administratif', description: 'OQTF avec délai de départ de 30 jours' },
  'RETENTION_48H': { categorie: 'ELOIGNEMENT', duree: 48, unite: 'heures', juridiction: 'Juge des Libertés et de la Détention (JLD)', description: 'Contestation de placement en rétention' },
  'IRTF_2MOIS': { categorie: 'ELOIGNEMENT', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Interdiction de Retour sur le Territoire Français' },

  // --- ASILE ---
  'REFUS_OFPRA_1MOIS': { categorie: 'ASILE', duree: 1, unite: 'mois', juridiction: 'CNDA', description: 'Recours contre refus de l\'OFPRA' },
  'REFUS_CNDA_2MOIS': { categorie: 'ASILE', duree: 2, unite: 'mois', juridiction: 'Conseil d\'État', description: 'Recours contre décision de la CNDA' },

  // --- NATIONALITÉ / VISA ---
  'REFUS_NATURALISATION_2MOIS': { categorie: 'NATIONALITE', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Refus de naturalisation' },
  'REFUS_VISA_CRV_2MOIS': { categorie: 'NATIONALITE', duree: 2, unite: 'mois', juridiction: 'Commission de Recours contre les refus de Visa (CRV)', description: 'Refus de visa' }
};

// 3. Le Moteur de Calcul Universel
export function calculerDateLimiteUniverselle(type: TypeProcedure, dateNotification: Date): Date {
  const regle = CESEDA_TAXONOMY[type];
  if (!regle) throw new Error("Type de procédure inconnu dans la taxonomie");

  // Application des jours francs (on commence le lendemain pour les jours/mois)
  let dateDepart = new Date(dateNotification);
  if (regle.unite !== 'heures') {
    dateDepart.setDate(dateDepart.getDate() + 1);
    dateDepart.setHours(0, 0, 0, 0);
  }

  let dateLimite: Date;
  if (regle.unite === 'heures') {
    dateLimite = addHours(dateNotification, regle.duree);
  } else if (regle.unite === 'jours') {
    dateLimite = addDays(dateDepart, regle.duree);
  } else {
    dateLimite = addMonths(dateDepart, regle.duree);
  }

  // Report des week-ends (sauf si c'est de la rétention ou des heures strictes)
  if (regle.unite !== 'heures') {
    while (isWeekend(dateLimite)) {
      dateLimite = addDays(dateLimite, 1);
    }
  }

  return dateLimite;
}

export function getJuridiction(type: TypeProcedure): string {
  return CESEDA_TAXONOMY[type].juridiction;
}
"""
with open("src/lib/ceseda-delais.ts", "w", encoding="utf-8") as f:
    f.write(fichier_delais)
print("✅ 1. Taxonomie CESEDA complète déployée (12 types de procédures).")

# ==========================================
# 2. MISE À JOUR DU SCHÉMA PRISMA
# ==========================================
prisma_path = "prisma/schema.prisma"
if os.path.exists(prisma_path):
    with open(prisma_path, "r", encoding="utf-8") as f:
        schema = f.read()

    modele_case = """model Case {
  id                String   @id @default(cuid())
  title             String
  clientId          String
  client            Client   @relation(fields: [clientId], references: [id])
  
  // --- SPÉCIFIQUE CESEDA ---
  categorieCESEDA   String   // "SEJOUR", "ELOIGNEMENT", "ASILE", "NATIONALITE"
  typeProcedure     String   // "OQTF_48H", "REFUS_TITRE_2MOIS", etc.
  juridiction       String?  // Tribunal Administratif, CNDA, JLD...
  prefecture        String?
  numeroAGDREF      String?
  paysOrigine       String?
  dateNotification  DateTime?
  dateLimiteRecours DateTime?
  statut            String   @default("OUVERT")
  
  documents         Document[]
  emails            EmailLog[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}"""

    if "model Case" in schema:
        schema = re.sub(r'model Case \{.*?\}', modele_case, schema, flags=re.DOTALL)
        with open(prisma_path, "w", encoding="utf-8") as f:
            f.write(schema)
        print("✅ 2. Schéma Prisma mis à jour (champs Catégorie & Juridiction ajoutés).")

# ==========================================
# 3. MISE À JOUR DE L'API DE CRÉATION
# ==========================================
api_cases = """import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculerDateLimiteUniverselle, TypeProcedure, getJuridiction, CESEDA_TAXONOMY } from '@/lib/ceseda-delais';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { title, clientId, typeProcedure, dateNotification, prefecture, numeroAGDREF, paysOrigine } = body;

    // Récupération automatique de la catégorie et de la juridiction
    const regle = CESEDA_TAXONOMY[typeProcedure as TypeProcedure];
    if (!regle) return NextResponse.json({ error: "Procédure inconnue" }, { status: 400 });

    let dateLimiteRecours = null;
    if (dateNotification) {
      dateLimiteRecours = calculerDateLimiteUniverselle(typeProcedure as TypeProcedure, new Date(dateNotification));
    }

    const newCase = await prisma.case.create({
      data: {
        title, clientId, 
        categorieCESEDA: regle.categorie,
        typeProcedure, 
        juridiction: regle.juridiction,
        prefecture, numeroAGDREF, paysOrigine,
        dateNotification: dateNotification ? new Date(dateNotification) : null,
        dateLimiteRecours, statut: 'OUVERT'
      }
    });
    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}"""
with open("src/app/api/cases/route.ts", "w", encoding="utf-8") as f:
    f.write(api_cases)
print("✅ 3. API de création mise à jour pour gérer les 12 procédures.")

print("\n🎉 MISE À NIVEAU TERMINÉE ! Ton application gère désormais tout le CESEDA.")
print("👉 N'oublie pas de lancer : npx prisma db push")

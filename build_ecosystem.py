import os
import re

print("🚀 Déploiement de l'écosystème MemoLib (CESEDA)...")

# ==========================================
# 1. MISE À JOUR DU SCHÉMA PRISMA
# ==========================================
prisma_path = "prisma/schema.prisma"
if os.path.exists(prisma_path):
    with open(prisma_path, "r", encoding="utf-8") as f:
        schema = f.read()

    modeles = """model Case {
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
  emails            EmailLog[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model EmailLog {
  id                String   @id @default(cuid())
  sender            String
  subject           String
  receivedAt        DateTime @default(now())
  rawText           String?
  processed         Boolean  @default(false)
  caseId            String?
  case              Case?    @relation(fields: [caseId], references: [id])
}"""

    if "model Case" in schema:
        schema = re.sub(r'model Case \{.*?\}', modeles, schema, flags=re.DOTALL)
    else:
        schema += "\n\n" + modeles
    
    with open(prisma_path, "w", encoding="utf-8") as f:
        f.write(schema)
    print("✅ 1. Schéma Prisma mis à jour (Case + EmailLog).")

# ==========================================
# 2. LOGIQUE AVANCÉE DES DÉLAIS
# ==========================================
os.makedirs("src/lib", exist_ok=True)
fichier_delais = """import { addHours, addDays, addMonths, isWeekend } from 'date-fns';

export type TypeRecours = 'OQTF_48H' | 'REFUS_TITRE_2MOIS' | 'ASILE_15J';

interface RegleDelai { duree: number; unite: 'heures' | 'jours' | 'mois'; }

const REGLES_CESEDA: Record<TypeRecours, RegleDelai> = {
  'OQTF_48H': { duree: 48, unite: 'heures' },
  'REFUS_TITRE_2MOIS': { duree: 2, unite: 'mois' },
  'ASILE_15J': { duree: 15, unite: 'jours' }
};

export function calculerDateLimiteAvancee(typeRecours: TypeRecours, dateNotification: Date): Date {
  const regle = REGLES_CESEDA[typeRecours];
  if (!regle) throw new Error("Type inconnu");

  let dateDepart = new Date(dateNotification);
  dateDepart.setDate(dateDepart.getDate() + 1);
  dateDepart.setHours(0, 0, 0, 0);

  let dateLimite: Date;
  if (regle.unite === 'heures') { dateLimite = addHours(dateNotification, regle.duree); }
  else if (regle.unite === 'jours') { dateLimite = addDays(dateDepart, regle.duree); }
  else { dateLimite = addMonths(dateDepart, regle.duree); }

  while (isWeekend(dateLimite)) { dateLimite = addDays(dateLimite, 1); }
  return dateLimite;
}"""
with open("src/lib/ceseda-delais.ts", "w", encoding="utf-8") as f:
    f.write(fichier_delais)
print("✅ 2. Moteur de délais avancé créé (ceseda-delais.ts).")

# ==========================================
# 3. API : CRÉATION DE DOSSIER
# ==========================================
os.makedirs("src/app/api/cases", exist_ok=True)
api_cases = """import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculerDateLimiteAvancee, TypeRecours } from '@/lib/ceseda-delais';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    let dateLimiteRecours = null;
    
    if (body.dateNotification) {
      const type: TypeRecours = body.typeDossier === 'OQTF' ? 'OQTF_48H' : (body.typeDossier === 'ASILE' ? 'ASILE_15J' : 'REFUS_TITRE_2MOIS');
      dateLimiteRecours = calculerDateLimiteAvancee(type, new Date(body.dateNotification));
    }

    const newCase = await prisma.case.create({
      data: {
        title: body.title, clientId: body.clientId, typeDossier: body.typeDossier,
        prefecture: body.prefecture, numeroAGDREF: body.numeroAGDREF,
        dateNotification: body.dateNotification ? new Date(body.dateNotification) : null,
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
print("✅ 3. API de création de dossier prête (api/cases/route.ts).")

# ==========================================
# 4. API : WEBHOOK EMAIL (IA)
# ==========================================
os.makedirs("src/app/api/webhooks/email", exist_ok=True)
api_webhook = """import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculerDateLimiteAvancee } from '@/lib/ceseda-delais';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // On enregistre l'email pour la traçabilité
    const log = await prisma.emailLog.create({
      data: { sender: body.sender, subject: body.subject, rawText: body.body, processed: false }
    });

    // LOGIQUE IA SIMULÉE (À remplacer par un appel OpenAI)
    const isOQTF = body.subject.includes("OQTF") || body.body.includes("Obligation de quitter");
    
    if (isOQTF) {
      const dateNotif = new Date();
      const dateLimite = calculerDateLimiteAvancee('OQTF_48H', dateNotif);

      const newCase = await prisma.case.create({
        data: {
          title: `OQTF - ${body.sender}`,
          clientId: "client-temporaire", // À lier dynamiquement
          typeDossier: "OQTF",
          dateNotification: dateNotif,
          dateLimiteRecours: dateLimite,
          statut: 'OUVERT',
          emails: { connect: { id: log.id } }
        }
      });
      return NextResponse.json({ success: true, message: "Dossier OQTF créé", caseId: newCase.id });
    }
    return NextResponse.json({ success: true, message: "Email loggué, pas d'action" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}"""
with open("src/app/api/webhooks/email/route.ts", "w", encoding="utf-8") as f:
    f.write(api_webhook)
print("✅ 4. Webhook Email (IA) configuré.")

# ==========================================
# 5. DASHBOARD AVOCAT (FRONTEND)
# ==========================================
os.makedirs("src/app/dashboard", exist_ok=True)
dashboard = """import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) redirect("/sign-in");

  const cases = await prisma.case.findMany({ orderBy: { dateLimiteRecours: 'asc' }, take: 10 });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bienvenue, Maître {user?.firstName}</h1>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800">Dossiers Actifs</h2>
          <p className="text-4xl font-bold text-blue-600">{cases.length}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h2 className="text-xl font-semibold text-red-800">Urgents (&lt; 48h)</h2>
          <p className="text-4xl font-bold text-red-600">
            {cases.filter(c => c.dateLimiteRecours && new Date(c.dateLimiteRecours).getTime() - new Date().getTime() < 48*3600*1000).length}
          </p>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-4">Prochaines Échéances</h2>
      <div className="space-y-4">
        {cases.map((c) => (
          <div key={c.id} className={\`p-4 rounded-lg border-l-4 \${c.dateLimiteRecours && new Date(c.dateLimiteRecours).getTime() - new Date().getTime() < 48*3600*1000 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}\`}>
            <h3 className="font-bold text-lg">{c.title}</h3>
            <p className="text-sm font-semibold text-gray-800 mt-2">Date limite : {c.dateLimiteRecours ? new Date(c.dateLimiteRecours).toLocaleString('fr-FR') : 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}"""
with open("src/app/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(dashboard)
print("✅ 5. Dashboard React généré.")

# ==========================================
# 6. MOTEUR D'AUDIT (MEMOLIBDEV)
# ==========================================
os.makedirs("memoLibDev_tools", exist_ok=True)
audit_script = """import json, hashlib
from datetime import datetime
from pathlib import Path

AUDIT_LOG = Path("audit_trail.jsonl")
class AuditEngine:
    @staticmethod
    def log_action(action: str, details: dict, status: str = "PENDING_APPROVAL"):
        timestamp = datetime.now().isoformat()
        block = {"timestamp": timestamp, "action": action, "details": details, "status": status, "human_approved_by": None}
        if AUDIT_LOG.exists():
            with open(AUDIT_LOG, "r") as f: last_line = f.readlines()[-1]
            block["previous_hash"] = hashlib.sha256(last_line.encode()).hexdigest()
        else: block["previous_hash"] = "0" * 64
        block["hash"] = hashlib.sha256(json.dumps(block, sort_keys=True).encode()).hexdigest()
        with open(AUDIT_LOG, "a") as f: f.write(json.dumps(block) + "\\n")
        print(f"✅ [AUDIT] Action '{action}' logguée.")
"""
with open("memoLibDev_tools/audit_engine.py", "w", encoding="utf-8") as f:
    f.write(audit_script)
print("✅ 6. Moteur d'audit Python créé (dossier memoLibDev_tools).")

print("\n🎉 TOUS LES SCRIPTS ONT ÉTÉ DÉPLOYÉS AVEC SUCCÈS !")
print("👉 Prochaines étapes dans PowerShell :")
print("   1. npm install date-fns")
print("   2. npx prisma db push")
print("   3. npm run dev")

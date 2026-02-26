import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const DEMO_MODE = process.env.DEMO_MODE === '1' || process.env.DEMO_MODE === 'true';
const DEMO_SEED_TOKEN = process.env.DEMO_SEED_TOKEN || '';
const DEMO_DEFAULT_PASSWORD = process.env.DEMO_DEFAULT_PASSWORD || '';

export async function POST(req: Request) {
  if (!DEMO_MODE) {
    return NextResponse.json({ error: 'Demo mode disabled' }, { status: 403 });
  }

  const token = req.headers.get('x-demo-seed-token') || '';
  if (!DEMO_SEED_TOKEN || token !== DEMO_SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!DEMO_DEFAULT_PASSWORD) {
    return NextResponse.json({ error: 'Demo default password not configured' }, { status: 500 });
  }

  try {
    const hashedPassword = await bcrypt.hash(DEMO_DEFAULT_PASSWORD, 12);

    const plan = await prisma.plan.upsert({
      where: { name: 'DEMO' },
      update: {},
      create: {
        name: 'DEMO',
        displayName: 'Plan Démo',
        description: 'Plan de démonstration pour cabinet',
        priceMonthly: 0,
        priceYearly: 0,
        maxWorkspaces: 10,
        maxDossiers: 200,
        maxClients: 50,
        maxStorageGb: 10,
        maxUsers: 10,
        aiAutonomyLevel: 2,
        humanValidation: true,
        advancedAnalytics: true,
        externalAiAccess: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: true,
      },
    });

    const tenant = await prisma.tenant.upsert({
      where: { subdomain: 'demo' },
      update: {},
      create: {
        name: 'Cabinet Démo Avocate',
        subdomain: 'demo',
        planId: plan.id,
        status: 'active',
        billingEmail: 'billing@demo.com',
      },
    });

    const admin = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        password: hashedPassword,
        name: 'Admin Demo',
        role: 'ADMIN',
        tenantId: tenant.id,
        phone: '+33 6 12 34 56 78',
        status: 'active',
      },
    });

    const clientsSeed = [
      {
        civilite: 'Mme',
        firstName: 'Claire',
        lastName: 'Dupont',
        email: 'client1@demo.com',
        phone: '+33 6 11 11 11 11',
        nationality: 'Française',
        ville: 'Paris',
      },
      {
        civilite: 'M.',
        firstName: 'Amine',
        lastName: 'Belaid',
        email: 'client2@demo.com',
        phone: '+33 6 22 22 22 22',
        nationality: 'Algérienne',
        ville: 'Lyon',
      },
      {
        civilite: 'Mme',
        firstName: 'Sara',
        lastName: 'Kacem',
        email: 'client3@demo.com',
        phone: '+33 6 33 33 33 33',
        nationality: 'Tunisienne',
        ville: 'Marseille',
      },
    ];

    const clients = [] as { id: string; email: string; firstName: string; lastName: string }[];
    for (const c of clientsSeed) {
      const client = await prisma.client.upsert({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: c.email,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          civilite: c.civilite,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          nationality: c.nationality,
          ville: c.ville,
          status: 'actif',
        },
      });
      clients.push({
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
      });

      await prisma.user.upsert({
        where: { email: client.email },
        update: {},
        create: {
          email: client.email,
          password: hashedPassword,
          name: `${client.firstName} ${client.lastName}`,
          role: 'CLIENT',
          tenantId: tenant.id,
          clientId: client.id,
          phone: client.phone || undefined,
          status: 'active',
        },
      });
    }

    const dossiersSeed = [
      {
        numero: `D-${new Date().getFullYear()}-0001`,
        typeDossier: 'TitreSejour',
        statut: 'en_cours',
        priorite: 'haute',
        phase: 'instruction',
      },
      {
        numero: `D-${new Date().getFullYear()}-0002`,
        typeDossier: 'Naturalisation',
        statut: 'en_attente',
        priorite: 'normale',
        phase: 'instruction',
      },
      {
        numero: `D-${new Date().getFullYear()}-0003`,
        typeDossier: 'OQTF',
        statut: 'urgent',
        priorite: 'haute',
        phase: 'recours',
      },
    ];

    const dossiers = [] as { id: string; numero: string }[];
    for (let i = 0; i < dossiersSeed.length; i++) {
      const client = clients[i % clients.length];
      const d = dossiersSeed[i];
      const dossier = await prisma.dossier.upsert({
        where: {
          tenantId_numero: {
            tenantId: tenant.id,
            numero: d.numero,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          numero: d.numero,
          clientId: client.id,
          typeDossier: d.typeDossier,
          statut: d.statut,
          priorite: d.priorite,
          phase: d.phase,
          objet: `Dossier ${d.typeDossier}`,
          description: `Dossier de démonstration pour ${client.firstName} ${client.lastName}`,
          dateOuverture: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dateEcheance: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
      });
      dossiers.push({ id: dossier.id, numero: dossier.numero });
    }

    for (const dossier of dossiers) {
      const existing = await prisma.document.findFirst({
        where: {
          tenantId: tenant.id,
          dossierId: dossier.id,
          originalName: 'passeport.pdf',
        },
      });
      if (!existing) {
        await prisma.document.create({
          data: {
            tenantId: tenant.id,
            dossierId: dossier.id,
            filename: `${Date.now()}_passeport.pdf`,
            originalName: 'passeport.pdf',
            mimeType: 'application/pdf',
            size: 245000,
            storageKey: `demo/${dossier.numero}/passeport.pdf`,
            uploadedBy: admin.id,
          },
        });
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Demo data seeded',
      accounts: {
        admin: { email: 'admin@demo.com' },
        clients: clients.map(c => ({ email: c.email })),
      },
      notes: {
        password: 'Use DEMO_DEFAULT_PASSWORD environment variable',
      },
      summary: {
        tenant: tenant.name,
        plan: plan.displayName,
        clients: clients.length,
        dossiers: dossiers.length,
        documentsPerDossier: 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}

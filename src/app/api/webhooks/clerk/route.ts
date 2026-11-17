import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { mapClerkOrganizationRole } from '@/lib/auth/clerk-role-mapping';

const eventSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const userEventSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  primary_email_address_id: z.string().nullable().optional(),
  email_addresses: z
    .array(
      z.object({
        id: z.string(),
        email_address: z.string().email(),
        verification: z
          .object({ status: z.string().optional() })
          .nullable()
          .optional(),
      })
    )
    .optional(),
});

const organizationEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

const organizationCreatedEventSchema = organizationEventSchema.extend({
  created_by: z.string().min(1),
});

const membershipEventSchema = z.object({
  role: z.string().min(1),
  organization: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  public_user_data: z.object({
    user_id: z.string().min(1),
  }),
});

const membershipDeletedEventSchema = z.object({
  organization: z.object({ id: z.string().min(1) }),
  public_user_data: z.object({ user_id: z.string().min(1) }),
});

type ClerkUserEvent = z.infer<typeof userEventSchema>;
type ClerkOrganization = z.infer<typeof organizationEventSchema>;

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('[Clerk Webhook] Configuration manquante');
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
  }

  const headersList = request.headers;
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Headers Svix manquants' }, { status: 400 });
  }

  let eventPayload: unknown;
  try {
    eventPayload = new Webhook(webhookSecret).verify(await request.text(), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (error) {
    logger.error(
      '[Clerk Webhook] Signature invalide',
      new Error(error instanceof Error ? error.name : 'UnknownError')
    );
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const parsedEvent = eventSchema.safeParse(eventPayload);
  if (!parsedEvent.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  try {
    const { type, data } = parsedEvent.data;

    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const parsedUser = userEventSchema.safeParse(data);
        if (!parsedUser.success) {
          return NextResponse.json({ error: 'Événement utilisateur invalide' }, { status: 400 });
        }
        await synchronizeClerkUser(parsedUser.data);
        break;
      }
      case 'user.deleted': {
        const parsedUserId = z.object({ id: z.string().min(1) }).safeParse(data);
        if (!parsedUserId.success) {
          return NextResponse.json({ error: 'Événement utilisateur invalide' }, { status: 400 });
        }
        await prisma.user.updateMany({
          where: { clerkUserId: parsedUserId.data.id },
          data: { status: 'deleted', updatedAt: new Date() },
        });
        break;
      }
      case 'organization.updated': {
        const parsedOrganization = organizationEventSchema.safeParse(data);
        if (!parsedOrganization.success) {
          return NextResponse.json({ error: 'Événement organisation invalide' }, { status: 400 });
        }
        await prisma.tenant.updateMany({
          where: { clerkOrganizationId: parsedOrganization.data.id },
          data: { name: parsedOrganization.data.name, updatedAt: new Date() },
        });
        break;
      }
      case 'organization.created': {
        const parsedOrganization = organizationCreatedEventSchema.safeParse(data);
        if (!parsedOrganization.success) {
          return NextResponse.json({ error: 'Événement organisation invalide' }, { status: 400 });
        }
        const creator = await prisma.user.findUnique({
          where: { clerkUserId: parsedOrganization.data.created_by },
          select: { tenantId: true },
        });
        if (!creator) {
          throw new Error('Créateur Clerk non synchronisé');
        }
        await ensureTenantForOrganization(parsedOrganization.data, creator.tenantId);
        break;
      }
      case 'organization.deleted': {
        const parsedOrganizationId = z.object({ id: z.string().min(1) }).safeParse(data);
        if (!parsedOrganizationId.success) {
          return NextResponse.json({ error: 'Événement organisation invalide' }, { status: 400 });
        }
        await prisma.tenant.updateMany({
          where: { clerkOrganizationId: parsedOrganizationId.data.id },
          data: { status: 'inactive', updatedAt: new Date() },
        });
        break;
      }
      case 'organizationMembership.created':
      case 'organizationMembership.updated': {
        const parsedMembership = membershipEventSchema.safeParse(data);
        if (!parsedMembership.success) {
          return NextResponse.json({ error: 'Événement adhésion invalide' }, { status: 400 });
        }
        await synchronizeMembership(parsedMembership.data);
        break;
      }
      case 'organizationMembership.deleted': {
        const parsedMembership = membershipDeletedEventSchema.safeParse(data);
        if (!parsedMembership.success) {
          return NextResponse.json({ error: 'Événement adhésion invalide' }, { status: 400 });
        }
        const user = await prisma.user.findUnique({
          where: { clerkUserId: parsedMembership.data.public_user_data.user_id },
          select: { id: true },
        });
        const tenant = await prisma.tenant.findUnique({
          where: { clerkOrganizationId: parsedMembership.data.organization.id },
          select: { id: true },
        });
        if (user && tenant) {
          await prisma.tenantMembership.deleteMany({
            where: { tenantId: tenant.id, userId: user.id },
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      `[Clerk Webhook] Échec du traitement ${parsedEvent.data.type}`,
      new Error(error instanceof Error ? error.name : 'UnknownError')
    );
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 });
  }
}

async function synchronizeClerkUser(data: ClerkUserEvent): Promise<void> {
  const emailAddress =
    data.email_addresses?.find(address => address.id === data.primary_email_address_id) ??
    data.email_addresses?.find(address => address.verification?.status === 'verified');
  if (!emailAddress || emailAddress.verification?.status !== 'verified') return;

  const email = emailAddress.email_address.toLowerCase();
  const name = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || email;
  const mappedUser = await prisma.user.findUnique({ where: { clerkUserId: data.id } });

  if (mappedUser) {
    await prisma.user.update({
      where: { id: mappedUser.id },
      data: { email, name, emailVerified: mappedUser.emailVerified ?? new Date(), updatedAt: new Date() },
    });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.clerkUserId && existingUser.clerkUserId !== data.id) {
      throw new Error('Adresse vérifiée déjà liée à une autre identité Clerk');
    }
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkUserId: data.id,
        name,
        emailVerified: existingUser.emailVerified ?? new Date(),
        updatedAt: new Date(),
      },
    });
    return;
  }

  const unusablePasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  await prisma.user.create({
    data: {
      id: randomUUID(),
      clerkUserId: data.id,
      email,
      emailVerified: new Date(),
      name,
      password: unusablePasswordHash,
      role: 'CLIENT',
      status: 'active',
      updatedAt: new Date(),
    },
  });
}

async function synchronizeMembership(data: z.infer<typeof membershipEventSchema>): Promise<void> {
  const role = mapClerkOrganizationRole(data.role);
  if (!role) {
    throw new Error(`Rôle Clerk non pris en charge: ${data.role}`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: data.public_user_data.user_id },
    select: { id: true, tenantId: true },
  });
  if (!user) {
    throw new Error('Utilisateur Clerk non synchronisé');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrganizationId: data.organization.id },
  });
  if (!tenant || tenant.status !== 'active') {
    throw new Error('Organisation Clerk non synchronisée');
  }

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role, clerkRole: data.role, updatedAt: new Date() },
    create: {
      id: randomUUID(),
      tenantId: tenant.id,
      userId: user.id,
      role,
      clerkRole: data.role,
    },
  });
}

async function ensureTenantForOrganization(
  organization: ClerkOrganization,
  userTenantId: string | null
) {
  const mappedTenant = await prisma.tenant.findUnique({
    where: { clerkOrganizationId: organization.id },
  });
  if (mappedTenant) return mappedTenant;

  if (userTenantId) {
    const userTenant = await prisma.tenant.findUnique({ where: { id: userTenantId } });
    if (userTenant?.status !== 'active') {
      userTenantId = null;
    }
  }

  if (userTenantId) {
    const claimResult = await prisma.tenant.updateMany({
      where: { id: userTenantId, clerkOrganizationId: null },
      data: { clerkOrganizationId: organization.id, name: organization.name, updatedAt: new Date() },
    });
    if (claimResult.count === 1) {
      const claimedTenant = await prisma.tenant.findUnique({
        where: { clerkOrganizationId: organization.id },
      });
      if (claimedTenant) return claimedTenant;
    }
  }

  const plan = await prisma.plan.upsert({
    where: { name: 'STARTER' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'STARTER',
      displayName: 'Starter (Gratuit)',
      priceMonthly: 0,
      priceYearly: 0,
      updatedAt: new Date(),
    },
  });

  try {
    return await prisma.tenant.create({
      data: {
        id: randomUUID(),
        clerkOrganizationId: organization.id,
        name: organization.name,
        subdomain: `clerk-${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        planId: plan.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const tenantAfterConflict = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: organization.id },
    });
    if (tenantAfterConflict) return tenantAfterConflict;
    throw error;
  }
}

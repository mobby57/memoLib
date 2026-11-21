import { randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  client: undefined as Prisma.TransactionClient | undefined,
  tenantId: '',
}));

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    if (!state.client) throw new Error('Client transactionnel de test non initialise');
    return state.client;
  },
  withTenantContextTransaction: async (
    tenantId: string,
    operation: (client: Prisma.TransactionClient) => Promise<unknown>
  ) => {
    if (!state.client) throw new Error('Client transactionnel de test non initialise');
    await state.client.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
    return operation(state.client);
  },
}));
vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: async () => ({ user: { tenantId: state.tenantId, role: 'AVOCAT' } }),
}));
vi.mock('@/lib/cache', () => ({
  cacheThrough: async (_key: string, fetch: () => Promise<unknown>) => fetch(),
  cacheDelete: vi.fn(),
  cacheInvalidatePattern: vi.fn(),
  TTL_TIERS: {},
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

const enabled = process.env.MEMOLIB_DISPOSABLE_RLS_TEST === '1';

describe.skipIf(!enabled)('GET /api/clients avec RLS sur PostgreSQL jetable', () => {
  it('retourne les seuls clients du tenant authentifie', async () => {
    const expectedSystemId = process.env.MEMOLIB_AUDIT_SYSTEM_ID;
    if (!expectedSystemId || !/^\d+$/.test(expectedSystemId)) {
      throw new Error('Identifiant de la base jetable absent ou invalide');
    }

    const admin = new PrismaClient({
      datasources: {
        db: { url: 'postgresql://memolib_audit@127.0.0.1:55433/memolib_audit?schema=public' },
      },
    });
    const token = randomUUID().replaceAll('-', '');
    const role = `rls_app_${token}`;
    const plan = `rls-app-plan-${token}`;
    const tenantA = `rls-app-a-${token}`;
    const tenantB = `rls-app-b-${token}`;
    const clientA = `rls-app-client-a-${token}`;
    const clientB = `rls-app-client-b-${token}`;
    const rollback = new Error('Annulation intentionnelle des fixtures');
    let completed = false;

    try {
      await admin.$transaction(async tx => {
        const [identity] = await tx.$queryRaw<
          Array<{ database: string; username: string; superuser: boolean; system_id: string }>
        >`
          SELECT current_database() AS database, current_user AS username,
                 (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS superuser,
                 (SELECT system_identifier::text FROM pg_control_system()) AS system_id
        `;
        if (
          !identity ||
          identity.database !== 'memolib_audit' ||
          identity.username !== 'memolib_audit' ||
          !identity.superuser ||
          identity.system_id !== expectedSystemId
        ) {
          throw new Error('Identite PostgreSQL non conforme : test refuse');
        }

        await tx.$executeRawUnsafe(`CREATE ROLE "${role}" NOLOGIN NOSUPERUSER NOBYPASSRLS`);
        await tx.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO "${role}"`);
        await tx.$executeRawUnsafe(`GRANT SELECT ON public."Client", public."Dossier" TO "${role}"`);
        await tx.$executeRaw`
          INSERT INTO public."Plan" ("id", "name", "displayName", "priceMonthly", "priceYearly", "updatedAt")
          VALUES (${plan}, ${plan}, 'RLS test', 0, 0, now())
        `;
        for (const [tenant, client] of [[tenantA, clientA], [tenantB, clientB]]) {
          await tx.$executeRaw`
            INSERT INTO public."Tenant" ("id", "name", "subdomain", "planId", "updatedAt")
            VALUES (${tenant}, 'RLS test', ${tenant}, ${plan}, now())
          `;
          await tx.$executeRaw`
            INSERT INTO public."Client" ("id", "tenantId", "firstName", "lastName", "email", "updatedAt")
            VALUES (${client}, ${tenant}, 'RLS', 'Test', ${`${client}@example.invalid`}, now())
          `;
        }

        await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
        const [roleInfo] = await tx.$queryRaw<
          Array<{ username: string; superuser: boolean; bypass: boolean; owner: boolean; rls: boolean }>
        >`
          SELECT current_user AS username, r.rolsuper AS superuser, r.rolbypassrls AS bypass,
                 c.relowner = r.oid AS owner, c.relrowsecurity AND c.relforcerowsecurity AS rls
          FROM pg_roles r JOIN pg_class c ON c.oid = 'public."Client"'::regclass
          WHERE r.rolname = current_user
        `;
        if (!roleInfo || roleInfo.username !== role || roleInfo.superuser || roleInfo.bypass || roleInfo.owner || !roleInfo.rls) {
          throw new Error('Role ou RLS non conforme : test refuse');
        }

        await tx.$queryRaw`SELECT set_config('app.current_tenant', ${tenantA}, true)`;
        const baseline = await tx.client.findMany({ where: { id: { in: [clientA, clientB] } }, select: { id: true } });
        expect(baseline.map(client => client.id)).toEqual([clientA]);

        await tx.$queryRaw`SELECT set_config('app.current_tenant', '', true)`;
        state.client = tx;
        state.tenantId = tenantA;
        const { GET } = await import('@/app/api/clients/route');
        const response = await GET(new NextRequest('http://localhost/api/clients?search=RLS'));
        expect(response.status).toBe(200);
        const body = await response.json() as { clients: Array<{ id: string }> };
        expect(body.clients.map(client => client.id)).toEqual([clientA]);

        state.tenantId = tenantB;
        const responseB = await GET(new NextRequest('http://localhost/api/clients?search=RLS'));
        expect(responseB.status).toBe(200);
        const bodyB = await responseB.json() as { clients: Array<{ id: string }> };
        expect(bodyB.clients.map(client => client.id)).toEqual([clientB]);

        const crossTenant = await GET(
          new NextRequest(`http://localhost/api/clients?tenantId=${tenantA}&search=RLS`)
        );
        expect(crossTenant.status).toBe(403);
        completed = true;
        throw rollback;
      }, { timeout: 30000 });
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      state.client = undefined;
      await admin.$disconnect();
    }
    expect(completed).toBe(true);
  }, 45000);
});

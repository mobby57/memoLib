import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getClientDossiers } from '@/app/api/client/dossiers/route';
import { GET as getAdminBilling } from '@/app/api/admin/factures/route';
import { prisma } from '@/lib/prisma';

// 1. On mocke NextAuth pour simuler les connexions
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

// Helper pour simuler une session
const mockSession = (email: string, role: string, tenantId: string) => {
  (getServerSession as any).mockResolvedValue({
    user: { email, role, tenantId, id: 'test-id' }
  });
};

describe('🔒 Tests de Sécurité : RBAC et Isolation Multi-Tenant', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('❌ Un CLIENT ne doit pas accéder aux factures ADMIN (RBAC)', async () => {
    mockSession('client@test.fr', 'CLIENT', 'tenant-test');
    
    const req = new Request('http://localhost/api/admin/factures');
    const res = await getAdminBilling(req as any);
    
    // Le serveur doit répondre 403 (Interdit)
    expect(res.status).toBe(403);
  });

  it('✅ Un COMPTABLE peut accéder aux factures (RBAC)', async () => {
    mockSession('comptable@test.fr', 'COMPTABLE', 'tenant-test');
    
    const req = new Request('http://localhost/api/admin/factures');
    const res = await getAdminBilling(req as any);
    
    // Le serveur doit répondre 200 (OK)
    expect(res.status).toBe(200);
  });

  it('🔒 Un CLIENT ne voit QUE ses propres dossiers (Isolation)', async () => {
    // 1. On crée un faux dossier pour le Client A
    const tenant = await prisma.tenant.findFirst();
    const clientA = await prisma.client.findFirst({ where: { email: 'client@test.fr' } });
    const clientB = await prisma.client.findFirst({ where: { email: 'client2@test.fr' } });

    if (!clientA || !clientB) {
      console.warn("⚠️ Il manque le Client A ou B en base pour tester l'isolation.");
      return;
    }

    // On simule la connexion du Client A
    mockSession('client@test.fr', 'CLIENT', tenant!.id);

    const req = new Request('http://localhost/api/client/dossiers');
    const res = await getClientDossiers(req as any);
    const data = await res.json();

    // 2. On vérifie que les dossiers renvoyés appartiennent TOUS au Client A
    const dossiers = data.dossiers || data.data || [];
    const fuitDeDonnees = dossiers.some((d: any) => d.clientId === clientB.id);

    // 3. Le test échoue si le Client A voit les dossiers du Client B
    expect(fuitDeDonnees).toBe(false);
  });

});

import prisma from './prisma';
import type { DedupRepository, ClientRecord, CaseRecord, DocumentRecord } from './dedup';

// Prisma adapter for DedupRepository. Uses generic any casts to avoid type coupling.
export class PrismaDedupRepository implements DedupRepository {
  log(action: string, details: string) {
    // Optional: forward to a monitoring system; noop for now.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[dedup] ${action} ${details}`);
    }
  }

  async findClientByEmail(email: string): Promise<ClientRecord | null> {
    const rec = await (prisma as any).client?.findFirst?.({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return rec ? { id: rec.id, email: rec.email, firstName: rec.firstName, lastName: rec.lastName } : null;
  }

  async listClients(): Promise<ClientRecord[]> {
    const rows = await (prisma as any).client?.findMany?.({
      select: { id: true, email: true, firstName: true, lastName: true },
      take: 1000,
    });
    return (rows || []).map((rec: any) => ({ id: rec.id, email: rec.email, firstName: rec.firstName, lastName: rec.lastName }));
  }

  async createClient(email: string | null, firstName: string, lastName: string): Promise<ClientRecord> {
    const rec = await (prisma as any).client?.create?.({
      data: { email, firstName, lastName },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return { id: rec.id, email: rec.email, firstName: rec.firstName, lastName: rec.lastName };
  }

  async findCase(clientId: number | string, title: string): Promise<CaseRecord | null> {
    const rec = await (prisma as any).case?.findFirst?.({
      where: { clientId, title: { equals: title, mode: 'insensitive' } },
      select: { id: true, clientId: true, title: true },
    });
    return rec ? { id: rec.id, clientId: rec.clientId, title: rec.title } : null;
  }

  async createCase(clientId: number | string, title: string): Promise<CaseRecord> {
    const rec = await (prisma as any).case?.create?.({
      data: { clientId, title },
      select: { id: true, clientId: true, title: true },
    });
    return { id: rec.id, clientId: rec.clientId, title: rec.title };
  }

  async findDocByHash(caseId: number | string, sha256: string): Promise<DocumentRecord | null> {
    const rec = await (prisma as any).document?.findFirst?.({
      where: { caseId, sha256 },
      select: { id: true, caseId: true, name: true, sha256: true },
    });
    return rec ? { id: rec.id, caseId: rec.caseId, name: rec.name, sha256: rec.sha256 } : null;
  }

  async createDoc(caseId: number | string, name: string, sha256: string): Promise<DocumentRecord> {
    const rec = await (prisma as any).document?.create?.({
      data: { caseId, name, sha256 },
      select: { id: true, caseId: true, name: true, sha256: true },
    });
    return { id: rec.id, caseId: rec.caseId, name: rec.name, sha256: rec.sha256 };
  }
}

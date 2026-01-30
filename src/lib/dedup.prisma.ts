// Stub adapter to satisfy types without binding to actual Prisma schema
import type { DedupRepository, ClientRecord, CaseRecord, DocumentRecord } from './dedup';

export class PrismaDedupRepository implements DedupRepository {
  log(action: string, details: string) {
    // eslint-disable-next-line no-console
    console.info(`[dedup] ${action} | ${details}`);
  }

  async findClientByEmail(_email: string): Promise<ClientRecord | null> {
    return null;
  }

  async listClients(): Promise<ClientRecord[]> {
    return [];
  }

  async createClient(
    email: string | null,
    firstName: string,
    lastName: string
  ): Promise<ClientRecord> {
    return { id: 'temp', email, firstName, lastName };
  }

  async findCase(_clientId: number | string, _title: string): Promise<CaseRecord | null> {
    return null;
  }

  async createCase(clientId: number | string, title: string): Promise<CaseRecord> {
    return { id: 'temp', clientId, title };
  }

  async findDocByHash(_caseId: number | string, _sha256: string): Promise<DocumentRecord | null> {
    return null;
  }

  async createDoc(caseId: number | string, name: string, sha256: string): Promise<DocumentRecord> {
    return { id: 'temp', caseId, name, sha256 };
  }
}

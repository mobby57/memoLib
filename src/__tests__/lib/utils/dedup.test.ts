// Jest test using globals (describe/it/expect)
import {
  normalizeName,
  similarityRatio,
  sha256,
  identifyOrCreateClient,
  associateCase,
  ingestDocument,
} from '@/lib/dedup';

class MemoryRepo {
  clients: any[] = [];
  cases: any[] = [];
  docs: any[] = [];
  log() {}
  async findClientByEmail(email: string) {
    return this.clients.find(c => c.email === email) ?? null;
  }
  async listClients() {
    return this.clients;
  }
  async createClient(email: string | null, firstName: string, lastName: string) {
    const c = { id: this.clients.length + 1, email, firstName, lastName };
    this.clients.push(c);
    return c;
  }
  async findCase(clientId: number, title: string) {
    return this.cases.find(k => k.clientId === clientId && k.title === title) ?? null;
  }
  async createCase(clientId: number, title: string) {
    const k = { id: this.cases.length + 1, clientId, title };
    this.cases.push(k);
    return k;
  }
  async findDocByHash(caseId: number, sha256: string) {
    return this.docs.find(d => d.caseId === caseId && d.sha256 === sha256) ?? null;
  }
  async createDoc(caseId: number, name: string, hash: string) {
    const d = { id: this.docs.length + 1, caseId, name, sha256: hash };
    this.docs.push(d);
    return d;
  }
}

describe('dedup utilities', () => {
  it('normalizes names and computes similarity', () => {
    expect(normalizeName(' Jean', 'DuPont ')).toBe('jean dupont');
    const r = similarityRatio('jean dupont', 'jeanne dupont');
    expect(r).toBeGreaterThan(0.8);
  });

  it('sha256 produces deterministic hash', () => {
    const h1 = sha256('hello');
    const h2 = sha256(Buffer.from('hello'));
    expect(h1).toEqual(h2);
    expect(h1).toHaveLength(64);
  });

  it('identify/create client, associate case, ingest document', async () => {
    const repo = new MemoryRepo();
    const c1 = await identifyOrCreateClient(repo as any, 'a@example.com', 'Alice', 'Martin', 0.8);
    expect(c1.id).toBe(1);
    const c2 = await identifyOrCreateClient(repo as any, 'a@example.com', 'Alice', 'Martin', 0.8);
    expect(c2.id).toBe(c1.id);
    const k1 = await associateCase(repo as any, c1, 'Dossier A');
    const k2 = await associateCase(repo as any, c1, 'Dossier A');
    expect(k2.id).toBe(k1.id);
    const res1 = await ingestDocument(repo as any, k1, 'note.txt', 'content');
    expect(res1.created).toBe(true);
    const res2 = await ingestDocument(repo as any, k1, 'note.txt', 'content');
    expect(res2.created).toBe(false);
  });
});

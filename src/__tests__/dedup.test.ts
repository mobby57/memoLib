import {
  associateCase,
  identifyOrCreateClient,
  ingestDocument,
  DedupRepository,
  ClientRecord,
  CaseRecord,
  DocumentRecord,
} from '../lib/dedup';

class InMemoryRepo implements DedupRepository {
  private clients: ClientRecord[] = [];
  private cases: CaseRecord[] = [];
  private docs: DocumentRecord[] = [];
  private cid = 1;
  private caseid = 1;
  private docid = 1;
  public events: string[] = [];

  log(action: string, details: string) {
    this.events.push(`${action} ${details}`);
  }
  async findClientByEmail(email: string) {
    return this.clients.find(c => (c.email || '').toLowerCase() === email.toLowerCase()) || null;
  }
  async listClients() {
    return this.clients;
  }
  async createClient(email: string | null, firstName: string, lastName: string) {
    const c: ClientRecord = { id: this.cid++, email: email ?? null, firstName, lastName };
    this.clients.push(c);
    return c;
  }
  async findCase(clientId: number | string, title: string) {
    const norm = title.trim().toLowerCase();
    return (
      this.cases.find(cs => cs.clientId === clientId && cs.title.trim().toLowerCase() === norm) ||
      null
    );
  }
  async createCase(clientId: number | string, title: string) {
    const cs: CaseRecord = { id: this.caseid++, clientId, title };
    this.cases.push(cs);
    return cs;
  }
  async findDocByHash(caseId: number | string, sha256: string) {
    return this.docs.find(d => d.caseId === caseId && d.sha256 === sha256) || null;
  }
  async createDoc(caseId: number | string, name: string, sha256: string) {
    const d: DocumentRecord = { id: this.docid++, caseId, name, sha256 };
    this.docs.push(d);
    return d;
  }
}

describe('dedup module', () => {
  test('end-to-end: client/dossier/document with duplicate detection', async () => {
    const repo = new InMemoryRepo();

    const client = await identifyOrCreateClient(repo, 'alice@example.com', 'Alice', 'Martin');
    const caseRec = await associateCase(repo, client, 'Dossier Contrat 2026');
    const doc1 = await ingestDocument(repo, caseRec, 'contrat.pdf', Buffer.from('PDF_CONTENT_V1'));
    expect(doc1.created).toBe(true);

    const client2 = await identifyOrCreateClient(repo, 'ALICE@example.com', 'Alicia', 'Martins');
    expect(client2.id).toBe(client.id);
    const caseRec2 = await associateCase(repo, client2, 'dossier contrat 2026'); // normalized
    const doc2 = await ingestDocument(
      repo,
      caseRec2,
      'contrat-copy.pdf',
      Buffer.from('PDF_CONTENT_V1')
    );
    expect(doc2.created).toBe(false);
    expect(doc2.doc.id).toBe(doc1.doc.id);

    const client3 = await identifyOrCreateClient(repo, null, 'Alyce', 'Martine', 0.8);
    expect(client3.id).toBe(client.id);
    const caseRec3 = await associateCase(repo, client3, 'Dossier Contrat 2026');
    const doc3 = await ingestDocument(repo, caseRec3, 'annexe.pdf', Buffer.from('ANNEXE_V1'));
    expect(doc3.created).toBe(true);
  });
});

import crypto from 'crypto';

export interface ClientRecord {
  id: number | string;
  email?: string | null;
  firstName: string;
  lastName: string;
}

export interface CaseRecord {
  id: number | string;
  clientId: number | string;
  title: string;
}

export interface DocumentRecord {
  id: number | string;
  caseId: number | string;
  name: string;
  sha256: string;
}

export interface DedupRepository {
  findClientByEmail(email: string): Promise<ClientRecord | null>;
  listClients?(): Promise<ClientRecord[]>; // optional for fuzzy search
  createClient(email: string | null, firstName: string, lastName: string): Promise<ClientRecord>;

  findCase(clientId: number | string, title: string): Promise<CaseRecord | null>;
  createCase(clientId: number | string, title: string): Promise<CaseRecord>;

  findDocByHash(caseId: number | string, sha256: string): Promise<DocumentRecord | null>;
  createDoc(caseId: number | string, name: string, sha256: string): Promise<DocumentRecord>;

  log?(action: string, details: string): void;
}

function normalizeName(first: string, last: string): string {
  return `${(first || '').trim().toLowerCase()} ${(last || '').trim().toLowerCase()}`.trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length) || 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

export function sha256(content: Buffer | Uint8Array | string): string {
  const buf =
    typeof content === 'string' ? Buffer.from(content) : Buffer.from(content as Uint8Array);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export async function identifyOrCreateClient(
  repo: DedupRepository,
  email: string | null,
  firstName: string,
  lastName: string,
  threshold = 0.88
): Promise<ClientRecord> {
  if (email) {
    const byEmail = await repo.findClientByEmail(email);
    if (byEmail) {
      repo.log?.('client.match_email', `id=${byEmail.id} email=${email}`);
      return byEmail;
    }
  }
  const target = normalizeName(firstName, lastName);
  if (repo.listClients) {
    const all = await repo.listClients();
    let best: { ratio: number; client: ClientRecord | null } = { ratio: 0, client: null };
    for (const c of all) {
      const r = similarityRatio(normalizeName(c.firstName, c.lastName), target);
      if (r > best.ratio) best = { ratio: r, client: c };
    }
    if (best.client && best.ratio >= threshold) {
      repo.log?.('client.match_name', `id=${best.client.id} name=${firstName} ${lastName}`);
      return best.client;
    }
  }
  const created = await repo.createClient(email, firstName, lastName);
  repo.log?.('client.create', `id=${created.id} email=${email} name=${firstName} ${lastName}`);
  return created;
}

export async function associateCase(
  repo: DedupRepository,
  client: ClientRecord,
  title: string
): Promise<CaseRecord> {
  const existing = await repo.findCase(client.id, title);
  if (existing) {
    repo.log?.('case.match', `id=${existing.id} client_id=${client.id} title=${title}`);
    return existing;
  }
  const created = await repo.createCase(client.id, title);
  repo.log?.('case.create', `id=${created.id} client_id=${client.id} title=${title}`);
  return created;
}

export async function ingestDocument(
  repo: DedupRepository,
  caseRec: CaseRecord,
  name: string,
  content: Buffer | Uint8Array | string
): Promise<{ doc: DocumentRecord; created: boolean }> {
  const hash = sha256(content);
  const existing = await repo.findDocByHash(caseRec.id, hash);
  if (existing) {
    repo.log?.('doc.skip_duplicate', `case_id=${caseRec.id} name=${name} sha256=${hash}`);
    return { doc: existing, created: false };
  }
  const created = await repo.createDoc(caseRec.id, name, hash);
  repo.log?.('doc.create', `id=${created.id} case_id=${caseRec.id} name=${name} sha256=${hash}`);
  return { doc: created, created: true };
}

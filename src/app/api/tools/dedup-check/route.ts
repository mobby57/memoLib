import { NextResponse } from 'next/server';
import {
  normalizeName,
  similarityRatio,
  sha256,
  identifyOrCreateClient,
  associateCase,
  ingestDocument,
} from '../../../../lib/dedup';
// Utilisation dynamique de l'adaptateur Prisma pour éviter les erreurs de type au build

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      caseTitle,
      docName,
      docContentBase64,
      mode = 'dry-run',
      threshold = 0.8,
    } = body || {};

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 });
    }

    // Dry-run analysis
    const normalized = normalizeName(String(firstName), String(lastName));
    const nameSimilarity = similarityRatio(normalized, normalized);
    const buf = docContentBase64 ? Buffer.from(String(docContentBase64), 'base64') : null;
    const docHash = buf ? sha256(buf) : null;

    if (mode === 'commit') {
      if (!caseTitle || !docName || !buf) {
        return NextResponse.json(
          { error: 'caseTitle, docName et docContentBase64 sont requis en mode commit' },
          { status: 400 }
        );
      }
      const repoModule: any = await import('../../../../lib/dedup.prisma');
      const repo = new repoModule.PrismaDedupRepository();
      const client = await identifyOrCreateClient(
        repo,
        email ?? null,
        String(firstName),
        String(lastName),
        Number(threshold)
      );
      const k = await associateCase(repo, client, String(caseTitle));
      const res = await ingestDocument(repo, k, String(docName), buf);
      return NextResponse.json({
        ok: true,
        mode,
        normalizedName: normalized,
        nameSimilarity,
        documentHash: docHash,
        clientId: client.id,
        caseId: k.id,
        documentId: res.doc.id,
        created: res.created,
      });
    }

    // Default: dry-run result
    return NextResponse.json({
      ok: true,
      mode: 'dry-run',
      normalizedName: normalized,
      nameSimilarity,
      documentHash: docHash,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}

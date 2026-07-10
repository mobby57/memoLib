import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  importClientsFromCsv,
  importDossiersFromCsv,
  exportClientsCsv,
  exportDossiersCsv,
  exportFacturesCsv,
} from '@/lib/services/csv-sftp.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/import-export/csv
 * 
 * Import CSV : body = { action: 'import', type: 'clients'|'dossiers', csv: '...' }
 * Export CSV : body = { action: 'export', type: 'clients'|'dossiers'|'factures', dateFrom?, dateTo? }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { action, type, csv, delimiter, dateFrom, dateTo } = body;

  // ============ IMPORT ============
  if (action === 'import') {
    if (!csv || !type) {
      return NextResponse.json({ error: 'csv et type requis' }, { status: 400 });
    }

    if (type === 'clients') {
      const result = await importClientsFromCsv(csv, tenantId, { delimiter });
      return NextResponse.json({ success: true, ...result });
    }

    if (type === 'dossiers') {
      const result = await importDossiersFromCsv(csv, tenantId, user.id, { delimiter });
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'Type non supporté (clients, dossiers)' }, { status: 400 });
  }

  // ============ EXPORT ============
  if (action === 'export') {
    if (!type) return NextResponse.json({ error: 'type requis' }, { status: 400 });

    const options = { type, tenantId, delimiter: delimiter || ';', dateFrom, dateTo };
    let csvContent: string;

    if (type === 'clients') {
      csvContent = await exportClientsCsv(options);
    } else if (type === 'dossiers') {
      csvContent = await exportDossiersCsv(options);
    } else if (type === 'factures') {
      csvContent = await exportFacturesCsv(options);
    } else {
      return NextResponse.json({ error: 'Type non supporté' }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Action non supportée (import, export)' }, { status: 400 });
}

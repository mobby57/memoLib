import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type ReportType = 'factures' | 'dossiers' | 'clients' | 'activite' | 'financier';

// POST - Generer un rapport PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      type,
      startDate,
      endDate,
      filters = {},
      format = 'pdf',
    } = body as {
      tenantId: string;
      type: ReportType;
      startDate?: string;
      endDate?: string;
      filters?: Record<string, unknown>;
      format?: 'pdf' | 'csv' | 'excel';
    };

    if (!tenantId || !type) {
      return NextResponse.json({ error: 'tenantId et type requis' }, { status: 400 });
    }

    // Recuperer les donnees selon le type de rapport
    const data = await getReportData(tenantId, type, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      ...filters,
    });

    // Generer le rapport
    const report = await generateReport(type, data, format);

    // Retourner le rapport selon le format
    if (format === 'pdf') {
      return new Response(report.buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${report.filename}"`,
        },
      });
    } else if (format === 'csv') {
      return new Response(report.buffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${report.filename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        type,
        generatedAt: new Date().toISOString(),
        recordCount: data.length,
      },
    });
  } catch (error) {
    console.error('Erreur generation rapport:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Recuperer les donnees pour le rapport
async function getReportData(
  tenantId: string,
  type: ReportType,
  filters: { startDate?: Date; endDate?: Date; [key: string]: unknown }
) {
  const dateFilter: Record<string, Date> = {};
  if (filters.startDate) dateFilter.gte = filters.startDate;
  if (filters.endDate) dateFilter.lte = filters.endDate;

  switch (type) {
    case 'factures':
      return prisma.facture.findMany({
        where: {
          tenantId,
          ...(Object.keys(dateFilter).length > 0 ? { dateEmission: dateFilter } : {}),
        },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          dossier: { select: { numero: true } },
          lignes: true,
          paiements: true,
        },
        orderBy: { dateEmission: 'desc' },
      });

    case 'dossiers':
      return prisma.dossier.findMany({
        where: {
          tenantId,
          ...(Object.keys(dateFilter).length > 0 ? { dateCreation: dateFilter } : {}),
        },
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dateCreation: 'desc' },
      });

    case 'clients':
      return prisma.client.findMany({
        where: { tenantId },
        include: {
          dossiers: { select: { id: true, statut: true } },
          _count: { select: { dossiers: true, emails: true, factures: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

    case 'activite':
      const [emails, workflows] = await Promise.all([
        prisma.email.findMany({
          where: {
            tenantId,
            ...(Object.keys(dateFilter).length > 0 ? { receivedAt: dateFilter } : {}),
          },
          select: {
            id: true,
            from: true,
            subject: true,
            category: true,
            urgency: true,
            receivedAt: true,
            isProcessed: true,
          },
          orderBy: { receivedAt: 'desc' },
          take: 500,
        }),
        prisma.workflowExecution.findMany({
          where: {
            tenantId,
            ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
          },
          select: {
            id: true,
            workflowName: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }),
      ]);
      return { emails, workflows };

    case 'financier':
      const factures = await prisma.facture.findMany({
        where: {
          tenantId,
          ...(Object.keys(dateFilter).length > 0 ? { dateEmission: dateFilter } : {}),
        },
        include: {
          paiements: true,
        },
      });

      // Calculer les statistiques
      const stats = {
        totalFacture: factures.reduce((sum, f) => sum + f.montantTTC, 0),
        totalPaye: factures.reduce(
          (sum, f) => sum + f.paiements.reduce((s, p) => s + p.montant, 0),
          0
        ),
        factures: {
          total: factures.length,
          payees: factures.filter((f) => f.statut === 'payee').length,
          enAttente: factures.filter((f) => f.statut === 'envoyee').length,
          enRetard: factures.filter((f) => f.statut === 'en_retard').length,
        },
      };

      return { factures, stats };

    default:
      return [];
  }
}

// Generer le rapport dans le format demande
async function generateReport(
  type: ReportType,
  data: unknown,
  format: 'pdf' | 'csv' | 'excel'
): Promise<{ buffer: Buffer; filename: string }> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `rapport-${type}-${timestamp}.${format}`;

  if (format === 'csv') {
    const csv = convertToCSV(type, data);
    return {
      buffer: Buffer.from(csv, 'utf-8'),
      filename,
    };
  }

  // Pour PDF, generer un HTML et le convertir
  const html = generateHTMLReport(type, data);
  
  // En production, utiliser puppeteer ou playwright pour convertir en PDF
  // Pour l'instant, retourner le HTML comme placeholder
  const pdfPlaceholder = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
196
%%EOF
  `;

  return {
    buffer: Buffer.from(pdfPlaceholder),
    filename,
  };
}

// Convertir les donnees en CSV
function convertToCSV(type: ReportType, data: unknown): string {
  let rows: string[] = [];
  const dataArray = Array.isArray(data) ? data : [];

  switch (type) {
    case 'factures':
      rows.push('Numero,Client,Montant HT,TVA,Montant TTC,Statut,Date emission,Date echeance');
      for (const f of dataArray as Array<{
        numero: string;
        client: { firstName: string; lastName: string };
        montantHT: number;
        montantTVA: number;
        montantTTC: number;
        statut: string;
        dateEmission: Date;
        dateEcheance: Date;
      }>) {
        rows.push(
          `${f.numero},"${f.client.firstName} ${f.client.lastName}",${f.montantHT},${f.montantTVA},${f.montantTTC},${f.statut},${new Date(f.dateEmission).toLocaleDateString('fr-FR')},${new Date(f.dateEcheance).toLocaleDateString('fr-FR')}`
        );
      }
      break;

    case 'dossiers':
      rows.push('Numero,Client,Type,Statut,Phase,Date Creation');
      for (const d of dataArray as Array<{
        numero: string;
        client: { firstName: string; lastName: string };
        typeDossier: string;
        statut: string;
        phase: string;
        dateCreation: Date;
      }>) {
        rows.push(
          `${d.numero},"${d.client.firstName} ${d.client.lastName}",${d.typeDossier},${d.statut},${d.phase},${new Date(d.dateCreation).toLocaleDateString('fr-FR')}`
        );
      }
      break;

    case 'clients':
      rows.push('Nom,Prenom,Email,Telephone,Nb Dossiers,Statut');
      for (const c of dataArray as Array<{
        lastName: string;
        firstName: string;
        email: string;
        phone?: string;
        _count: { dossiers: number };
        status: string;
      }>) {
        rows.push(
          `${c.lastName},${c.firstName},${c.email},${c.phone || ''},${c._count.dossiers},${c.status}`
        );
      }
      break;

    default:
      rows.push('Donnees non formatees');
      rows.push(JSON.stringify(data));
  }

  return rows.join('\n');
}

// Generer un rapport HTML
function generateHTMLReport(type: ReportType, data: unknown): string {
  const title = {
    factures: 'Rapport des Factures',
    dossiers: 'Rapport des Dossiers',
    clients: 'Rapport des Clients',
    activite: "Rapport d'Activite",
    financier: 'Rapport Financier',
  }[type];

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1a365d; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary { background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}</p>
  
  <div class="summary">
    <strong>Resume:</strong> ${Array.isArray(data) ? data.length : 0} enregistrements
  </div>

  <pre>${JSON.stringify(data, null, 2).substring(0, 5000)}</pre>

  <div class="footer">
    <p>IAPosteManager - Rapport automatique</p>
  </div>
</body>
</html>
  `;
}

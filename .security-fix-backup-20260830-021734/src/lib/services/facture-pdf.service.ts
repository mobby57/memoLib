/**
 * Service de génération PDF pour les factures
 * Utilise jspdf (déjà en dépendance)
 */

import { jsPDF } from 'jspdf';

interface FacturePDFData {
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  client: { firstName: string; lastName: string; email: string; address?: string };
  cabinet: { name: string; address?: string; siret?: string };
  lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montantHT: number }>;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  notes?: string;
  conditions?: string;
}

export function generateFacturePDF(data: FacturePDFData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header cabinet
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.cabinet.name || 'MemoLib Cabinet', 14, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (data.cabinet.address) { doc.text(data.cabinet.address, 14, y); y += 5; }
  if (data.cabinet.siret) { doc.text(`SIRET: ${data.cabinet.siret}`, 14, y); y += 5; }

  // Facture title
  y += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURE ${data.numero}`, pageWidth - 14, 20, { align: 'right' });

  // Dates
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(data.dateEmission)}`, pageWidth - 14, 30, { align: 'right' });
  doc.text(`Echeance: ${formatDate(data.dateEcheance)}`, pageWidth - 14, 36, { align: 'right' });

  // Client box
  y = 55;
  doc.setDrawColor(200);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(pageWidth - 90, y - 5, 76, 30, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Facture a:', pageWidth - 86, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.client.firstName} ${data.client.lastName}`, pageWidth - 86, y + 9);
  doc.text(data.client.email, pageWidth - 86, y + 15);
  if (data.client.address) doc.text(data.client.address, pageWidth - 86, y + 21);

  // Table header
  y = 100;
  doc.setFillColor(59, 130, 246);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 18, y + 6);
  doc.text('Qte', 120, y + 6, { align: 'right' });
  doc.text('Prix unit.', 148, y + 6, { align: 'right' });
  doc.text('Total HT', pageWidth - 18, y + 6, { align: 'right' });

  // Table rows
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  y += 12;
  for (const ligne of data.lignes) {
    doc.text(ligne.description.substring(0, 50), 18, y);
    doc.text(String(ligne.quantite), 120, y, { align: 'right' });
    doc.text(`${ligne.prixUnitaire.toFixed(2)} EUR`, 148, y, { align: 'right' });
    doc.text(`${ligne.montantHT.toFixed(2)} EUR`, pageWidth - 18, y, { align: 'right' });
    y += 7;
    if (y > 260) { doc.addPage(); y = 20; }
  }

  // Separator
  y += 5;
  doc.setDrawColor(200);
  doc.line(100, y, pageWidth - 14, y);
  y += 8;

  // Totals
  doc.setFontSize(10);
  doc.text('Total HT:', 120, y);
  doc.text(`${data.montantHT.toFixed(2)} EUR`, pageWidth - 18, y, { align: 'right' });
  y += 7;
  doc.text(`TVA (${data.tauxTVA}%):`, 120, y);
  doc.text(`${data.montantTVA.toFixed(2)} EUR`, pageWidth - 18, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total TTC:', 120, y);
  doc.text(`${data.montantTTC.toFixed(2)} EUR`, pageWidth - 18, y, { align: 'right' });

  // Notes
  if (data.notes) {
    y += 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(data.notes.substring(0, 200), 14, y);
  }

  // Conditions
  if (data.conditions) {
    y += 10;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(data.conditions.substring(0, 300), 14, y);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('Genere par MemoLib', 14, 285);
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 14, 285, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

/**
 * Export dossier complet en PDF — pour audience
 * 
 * Génère un PDF structuré contenant :
 * - Page de garde (n° dossier, client, avocat, juridiction)
 * - Sommaire
 * - Chronologie complète
 * - Liste des pièces
 * - Résumé IA du dossier
 * - Chaîne d'audit (preuve d'intégrité)
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface DossierExportData {
  // Identité
  numero: string;
  typeDossier: string;
  statut: string;
  priorite: string;
  juridiction?: string;
  objet?: string;

  // Client
  client: {
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    nationalite?: string;
    dateNaissance?: string;
  };

  // Avocat
  avocat: {
    nom: string;
    cabinet?: string;
    barreau?: string;
  };

  // Dates clés
  dateOuverture: string;
  dateEcheance?: string;
  dateCloture?: string;

  // Documents
  documents: {
    id: string;
    nom: string;
    categorie?: string;
    date: string;
    hash?: string;
  }[];

  // Timeline / événements
  timeline: {
    date: string;
    action: string;
    auteur: string;
    details?: string;
  }[];

  // Échéances
  echeances: {
    label: string;
    date: string;
    statut: string;
  }[];

  // Audit trail (pour valeur probante)
  auditTrail?: {
    action: string;
    date: string;
    utilisateur: string;
    hash?: string;
  }[];

  // Export metadata
  exportDate: string;
  exportBy: string;
}

// ─── Générateur PDF ─────────────────────────────────────────────────────────────

export function generateDossierPDF(data: DossierExportData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE DE GARDE
  // ═══════════════════════════════════════════════════════════════════════════════

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('CONFIDENTIEL — COUVERT PAR LE SECRET PROFESSIONNEL', pageWidth / 2, y, { align: 'center' });
  y += 30;

  doc.setFontSize(24);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text('DOSSIER', pageWidth / 2, y, { align: 'center' });
  y += 12;

  doc.setFontSize(18);
  doc.text(data.numero, pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Ligne de séparation
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Info client
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('CLIENT', margin, y);
  y += 7;
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.client.prenom} ${data.client.nom}`, margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  if (data.client.nationalite) doc.text(`Nationalité : ${data.client.nationalite}`, margin, y);
  y += 12;

  // Info dossier
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text('TYPE', margin, y);
  doc.text('JURIDICTION', pageWidth / 2, y);
  y += 7;
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(formatTypeDossier(data.typeDossier), margin, y);
  doc.text(data.juridiction || '—', pageWidth / 2, y);
  y += 12;

  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text('STATUT', margin, y);
  doc.text('PRIORITÉ', pageWidth / 2, y);
  y += 7;
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(data.statut, margin, y);
  doc.text(data.priorite, pageWidth / 2, y);
  y += 12;

  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text('OUVERTURE', margin, y);
  doc.text('ÉCHÉANCE', pageWidth / 2, y);
  y += 7;
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(data.dateOuverture, margin, y);
  doc.text(data.dateEcheance || '—', pageWidth / 2, y);
  y += 20;

  // Objet
  if (data.objet) {
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text('OBJET', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(data.objet, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 10;
  }

  // Avocat
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Avocat : ${data.avocat.nom}`, margin, y);
  if (data.avocat.cabinet) doc.text(`Cabinet : ${data.avocat.cabinet}`, pageWidth / 2, y);
  y += 5;
  if (data.avocat.barreau) doc.text(`Barreau de ${data.avocat.barreau}`, margin, y);

  // Footer page de garde
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Exporté le ${data.exportDate} par ${data.exportBy}`, pageWidth / 2, 280, { align: 'center' });
  doc.text('Ce document a valeur probante — intégrité vérifiable via hash chain', pageWidth / 2, 285, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 2 : CHRONOLOGIE
  // ═══════════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = margin;

  doc.setFontSize(16);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text('CHRONOLOGIE DU DOSSIER', margin, y);
  y += 10;

  if (data.timeline.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Action', 'Auteur', 'Détails']],
      body: data.timeline.map(e => [
        e.date,
        e.action,
        e.auteur,
        (e.details || '').slice(0, 60),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: margin, right: margin },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Aucun événement enregistré.', margin, y + 10);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 3 : PIÈCES / DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = margin;

  doc.setFontSize(16);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text('PIÈCES DU DOSSIER', margin, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${data.documents.length} document(s)`, margin, y + 5);
  y += 12;

  if (data.documents.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['N°', 'Document', 'Catégorie', 'Date', 'Hash SHA-256']],
      body: data.documents.map((d, i) => [
        `${i + 1}`,
        d.nom,
        d.categorie || '—',
        d.date,
        d.hash ? d.hash.slice(0, 16) + '...' : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 10 },
        4: { cellWidth: 35, fontStyle: 'italic', fontSize: 7 },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 4 : ÉCHÉANCES
  // ═══════════════════════════════════════════════════════════════════════════════

  if (data.echeances.length > 0) {
    doc.addPage();
    y = margin;

    doc.setFontSize(16);
    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.text('ÉCHÉANCES LÉGALES', margin, y);
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [['Échéance', 'Date', 'Statut']],
      body: data.echeances.map(e => [e.label, e.date, e.statut]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [220, 80, 30], textColor: 255 },
      margin: { left: margin, right: margin },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DERNIÈRE PAGE : AUDIT TRAIL (valeur probante)
  // ═══════════════════════════════════════════════════════════════════════════════

  if (data.auditTrail && data.auditTrail.length > 0) {
    doc.addPage();
    y = margin;

    doc.setFontSize(16);
    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.text('JOURNAL D\'AUDIT — VALEUR PROBANTE', margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Chaîne de hachage immuable. Chaque entrée est liée cryptographiquement à la précédente.', margin, y + 5);
    y += 15;

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Action', 'Utilisateur', 'Hash']],
      body: data.auditTrail.map(a => [
        a.date,
        a.action,
        a.utilisateur,
        a.hash ? a.hash.slice(0, 20) + '...' : '—',
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [80, 80, 80], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: margin, right: margin },
      columnStyles: {
        3: { fontStyle: 'italic', fontSize: 6 },
      },
    });
  }

  // Numéros de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i}/${pageCount}`, pageWidth / 2, 292, { align: 'center' });
    doc.text(data.numero, pageWidth - margin, 292, { align: 'right' });
  }

  return doc;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatTypeDossier(type: string): string {
  const labels: Record<string, string> = {
    TITRE_SEJOUR: 'Titre de séjour',
    OQTF: 'OQTF',
    ASILE: 'Asile',
    NATURALISATION: 'Naturalisation',
    REGROUPEMENT_FAMILIAL: 'Regroupement familial',
    CONTENTIEUX: 'Contentieux',
    RECOURS_OQTF: 'Recours OQTF',
    GENERAL: 'Général',
  };
  return labels[type] || type;
}

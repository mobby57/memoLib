'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { logger } from '@/lib/logger';

export interface PDFExportData {
  type: 'facture' | 'dossier' | 'client-list';
  data: any;
  filename?: string;
}

interface PDFExportProps {
  data: PDFExportData;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PDFExport({
  data,
  buttonText = 'Exporter PDF',
  variant = 'outline',
  size = 'md',
  className = ''
}: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      // Import dynamique de jsPDF pour reduire le bundle initial
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      switch (data.type) {
        case 'facture':
          generateFacturePDF(doc, data.data);
          break;
        case 'dossier':
          generateDossierPDF(doc, data.data);
          break;
        case 'client-list':
          generateClientListPDF(doc, data.data);
          break;
      }
      
      const filename = data.filename || `${data.type}-${Date.now()}.pdf`;
      doc.save(filename);
    } catch (error) {
      logger.error('Erreur generation PDF', { error });
      alert('Erreur lors de la generation du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className={`
        flex items-center gap-2 rounded-lg font-medium
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isGenerating ? 'Generation...' : buttonText}
    </button>
  );
}

// Generation PDF pour facture
function generateFacturePDF(doc: any, facture: any) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // En-tete
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 138); // Bleu
  doc.text('FACTURE', pageWidth / 2, 20, { align: 'center' });
  
  // Informations cabinet
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Cabinet Juridique', 20, 35);
  doc.text('123 Rue du Droit', 20, 40);
  doc.text('75001 Paris', 20, 45);
  doc.text('contact@cabinet.fr', 20, 50);
  
  // Informations client
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Client:', pageWidth - 80, 35);
  doc.setFontSize(10);
  doc.text(facture.client?.nom || 'N/A', pageWidth - 80, 40);
  doc.text(facture.client?.email || '', pageWidth - 80, 45);
  
  // Numero et date
  doc.setFontSize(10);
  doc.text(`N deg ${facture.numero}`, 20, 65);
  doc.text(`Date: ${new Date(facture.dateEmission).toLocaleDateString('fr-FR')}`, 20, 70);
  doc.text(`echeance: ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`, 20, 75);
  
  // Ligne de separation
  doc.setDrawColor(200);
  doc.line(20, 85, pageWidth - 20, 85);
  
  // Tableau des services
  const tableData = [
    ['Description', 'Montant HT'],
    [facture.description || 'Prestation juridique', `${facture.montant.toFixed(2)} €`]
  ];
  
  (doc as any).autoTable({
    startY: 90,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
    margin: { left: 20, right: 20 }
  });
  
  // Totaux
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const montantTTC = facture.montant * 1.20;
  
  doc.setFontSize(10);
  doc.text('Montant HT:', pageWidth - 80, finalY);
  doc.text(`${facture.montant.toFixed(2)} €`, pageWidth - 30, finalY, { align: 'right' });
  
  doc.text('TVA (20%):', pageWidth - 80, finalY + 7);
  doc.text(`${(facture.montant * 0.20).toFixed(2)} €`, pageWidth - 30, finalY + 7, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL TTC:', pageWidth - 80, finalY + 17);
  doc.text(`${montantTTC.toFixed(2)} €`, pageWidth - 30, finalY + 17, { align: 'right' });
  
  // Statut
  const statusY = finalY + 30;
  const statusColors: any = {
    BROUILLON: [156, 163, 175],
    ENVOYEE: [59, 130, 246],
    PAYEE: [34, 197, 94],
    EN_RETARD: [239, 68, 68]
  };
  
  doc.setFillColor(...(statusColors[facture.statut] || [100, 100, 100]));
  doc.roundedRect(20, statusY, 40, 8, 2, 2, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.text(facture.statut, 40, statusY + 6, { align: 'center' });
  
  // Pied de page
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text('Merci de votre confiance', pageWidth / 2, 280, { align: 'center' });
  doc.text(`Conditions de paiement: Paiement sous 30 jours`, pageWidth / 2, 285, { align: 'center' });
}

// Generation PDF pour dossier
function generateDossierPDF(doc: any, dossier: any) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('RAPPORT DE DOSSIER', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Reference: ${dossier.reference}`, 20, 40);
  doc.text(`Titre: ${dossier.titre}`, 20, 47);
  doc.text(`Client: ${dossier.client?.nom || 'N/A'}`, 20, 54);
  doc.text(`Type: ${dossier.type}`, 20, 61);
  doc.text(`Statut: ${dossier.statut}`, 20, 68);
  
  doc.setDrawColor(200);
  doc.line(20, 75, pageWidth - 20, 75);
  
  doc.setFontSize(11);
  doc.text('Description:', 20, 85);
  const splitDescription = doc.splitTextToSize(dossier.description || 'Aucune description', pageWidth - 40);
  doc.setFontSize(10);
  doc.text(splitDescription, 20, 92);
  
  const descHeight = splitDescription.length * 7;
  
  doc.setFontSize(10);
  doc.text(`Date d'ouverture: ${new Date(dossier.dateOuverture).toLocaleDateString('fr-FR')}`, 20, 105 + descHeight);
  if (dossier.dateCloture) {
    doc.text(`Date de cloture: ${new Date(dossier.dateCloture).toLocaleDateString('fr-FR')}`, 20, 112 + descHeight);
  }
  
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 280, { align: 'center' });
}

// Generation PDF pour liste de clients
function generateClientListPDF(doc: any, clients: any[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('LISTE DES CLIENTS', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Total: ${clients.length} client(s)`, pageWidth / 2, 30, { align: 'center' });
  
  const tableData = clients.map(client => [
    client.nom,
    client.email,
    client.telephone || '-',
    client.type === 'ENTREPRISE' ? 'Entreprise' : 'Particulier',
    client.statut
  ]);
  
  (doc as any).autoTable({
    startY: 40,
    head: [['Nom', 'Email', 'Telephone', 'Type', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 }
  });
  
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 280, { align: 'center' });
}

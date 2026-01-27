/**
 * Service de génération de PDF
 * Utilise @react-pdf/renderer pour la génération côté serveur
 */

import ReactPDF, { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import React from 'react';

// Enregistrer une police personnalisée (optionnel)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// Styles communs
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  value: {
    flex: 1,
    color: '#1f2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  amount: {
    textAlign: 'right',
  },
  total: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'right',
    color: '#1e40af',
  },
});

// ==================== TYPES ====================

interface DossierPDFData {
  reference: string;
  titre: string;
  description?: string;
  status: string;
  priority: string;
  client?: {
    nom: string;
    email: string;
    telephone?: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  documents?: Array<{
    titre: string;
    type: string;
    createdAt: Date;
  }>;
  events?: Array<{
    type: string;
    description: string;
    createdAt: Date;
  }>;
}

interface FacturePDFData {
  numero: string;
  dateEmission: Date;
  dateEcheance: Date;
  client: {
    nom: string;
    adresse?: string;
    email: string;
    siret?: string;
  };
  cabinet: {
    nom: string;
    adresse: string;
    siret: string;
    email: string;
    telephone: string;
  };
  lignes: Array<{
    description: string;
    quantite: number;
    prixUnitaireHT: number;
    tva: number;
  }>;
  notes?: string;
  conditions?: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

// ==================== COMPOSANTS PDF ====================

/**
 * Document PDF pour un dossier
 */
const DossierDocument: React.FC<{ data: DossierPDFData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>IA Poste Manager</Text>
        <Text style={styles.title}>Dossier {data.reference}</Text>
        <Text style={styles.subtitle}>{data.titre}</Text>
      </View>

      {/* Informations générales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations Générales</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Statut:</Text>
          <Text style={styles.value}>{data.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Priorité:</Text>
          <Text style={styles.value}>{data.priority}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Créé le:</Text>
          <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
        </View>
        {data.deadline && (
          <View style={styles.row}>
            <Text style={styles.label}>Échéance:</Text>
            <Text style={styles.value}>{formatDate(data.deadline)}</Text>
          </View>
        )}
      </View>

      {/* Client */}
      {data.client && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom:</Text>
            <Text style={styles.value}>{data.client.nom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.client.email}</Text>
          </View>
          {data.client.telephone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone:</Text>
              <Text style={styles.value}>{data.client.telephone}</Text>
            </View>
          )}
        </View>
      )}

      {/* Description */}
      {data.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text>{data.description}</Text>
        </View>
      )}

      {/* Documents */}
      {data.documents && data.documents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents ({data.documents.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '50%' }}>Titre</Text>
              <Text style={{ width: '25%' }}>Type</Text>
              <Text style={{ width: '25%' }}>Date</Text>
            </View>
            {data.documents.map((doc, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                <Text style={{ width: '50%' }}>{doc.titre}</Text>
                <Text style={{ width: '25%' }}>{doc.type}</Text>
                <Text style={{ width: '25%' }}>{formatDate(doc.createdAt)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Document généré le {formatDate(new Date())} - IA Poste Manager</Text>
        <Text>Ce document est confidentiel et destiné uniquement à son destinataire.</Text>
      </View>
    </Page>
  </Document>
);

/**
 * Document PDF pour une facture
 */
const FactureDocument: React.FC<{ data: FacturePDFData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header avec infos cabinet et facture */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.logo}>{data.cabinet.nom}</Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5 }}>{data.cabinet.adresse}</Text>
            <Text style={{ fontSize: 8, color: '#6b7280' }}>SIRET: {data.cabinet.siret}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.subtitle}>N° {data.numero}</Text>
          </View>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Date d'émission:</Text>
          <Text style={styles.value}>{formatDate(data.dateEmission)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date d'échéance:</Text>
          <Text style={styles.value}>{formatDate(data.dateEcheance)}</Text>
        </View>
      </View>

      {/* Client */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facturé à</Text>
        <Text style={{ fontWeight: 'bold' }}>{data.client.nom}</Text>
        {data.client.adresse && <Text>{data.client.adresse}</Text>}
        <Text>{data.client.email}</Text>
        {data.client.siret && <Text style={{ fontSize: 8 }}>SIRET: {data.client.siret}</Text>}
      </View>

      {/* Lignes de facture */}
      <View style={styles.section}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ width: '45%' }}>Description</Text>
            <Text style={{ width: '15%', textAlign: 'center' }}>Qté</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>Prix HT</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>Total HT</Text>
          </View>
          {data.lignes.map((ligne, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={{ width: '45%' }}>{ligne.description}</Text>
              <Text style={{ width: '15%', textAlign: 'center' }}>{ligne.quantite}</Text>
              <Text style={{ width: '20%', textAlign: 'right' }}>{formatMoney(ligne.prixUnitaireHT)}</Text>
              <Text style={{ width: '20%', textAlign: 'right' }}>{formatMoney(ligne.quantite * ligne.prixUnitaireHT)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Totaux */}
      <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
        <View style={styles.row}>
          <Text style={[styles.label, { width: 100 }]}>Total HT:</Text>
          <Text style={[styles.value, { width: 100, textAlign: 'right' }]}>{formatMoney(data.totalHT)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { width: 100 }]}>TVA:</Text>
          <Text style={[styles.value, { width: 100, textAlign: 'right' }]}>{formatMoney(data.totalTVA)}</Text>
        </View>
        <View style={[styles.row, { borderTopWidth: 2, borderTopColor: '#3b82f6', paddingTop: 5 }]}>
          <Text style={[styles.label, { width: 100, fontWeight: 'bold', fontSize: 14 }]}>Total TTC:</Text>
          <Text style={[styles.value, { width: 100, textAlign: 'right', fontWeight: 'bold', fontSize: 14 }]}>{formatMoney(data.totalTTC)}</Text>
        </View>
      </View>

      {/* Notes et conditions */}
      {(data.notes || data.conditions) && (
        <View style={[styles.section, { marginTop: 30 }]}>
          {data.notes && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>Notes:</Text>
              <Text style={{ fontSize: 9 }}>{data.notes}</Text>
            </View>
          )}
          {data.conditions && (
            <View>
              <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>Conditions de paiement:</Text>
              <Text style={{ fontSize: 9 }}>{data.conditions}</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{data.cabinet.nom} - {data.cabinet.email} - {data.cabinet.telephone}</Text>
        <Text>SIRET: {data.cabinet.siret}</Text>
      </View>
    </Page>
  </Document>
);

// ==================== HELPERS ====================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// ==================== API PUBLIQUE ====================

/**
 * Générer un PDF pour un dossier
 */
export async function generateDossierPDF(data: DossierPDFData): Promise<Buffer> {
  return await ReactPDF.renderToBuffer(
    React.createElement(DossierDocument, { data })
  );
}

/**
 * Générer un PDF pour une facture
 */
export async function generateFacturePDF(data: FacturePDFData): Promise<Buffer> {
  return await ReactPDF.renderToBuffer(
    React.createElement(FactureDocument, { data })
  );
}

/**
 * Générer un stream PDF pour un dossier
 */
export async function streamDossierPDF(data: DossierPDFData): Promise<NodeJS.ReadableStream> {
  return await ReactPDF.renderToStream(
    React.createElement(DossierDocument, { data })
  );
}

/**
 * Générer un stream PDF pour une facture
 */
export async function streamFacturePDF(data: FacturePDFData): Promise<NodeJS.ReadableStream> {
  return await ReactPDF.renderToStream(
    React.createElement(FactureDocument, { data })
  );
}

export type { DossierPDFData, FacturePDFData };

/**
 * DocumentOCRService - Phase 7
 * Extraction texte depuis PDFs et images
 *
 * Note: Version simplifiée pour demo
 * En production: intégrer Tesseract.js, AWS Textract, ou Azure Document Intelligence
 */

import { PrismaClient } from '@prisma/client';
import { EventLogService } from '../../../lib/services/event-log.service';

interface OCRResult {
  text: string;
  confidence: number;
  entities: {
    dates?: string[];
    names?: string[];
    numbers?: string[];
    emails?: string[];
  };
  wordCount: number;
  language?: string;
}

interface ProcessDocumentParams {
  documentId: string;
  tenantId: string;
  fileBuffer?: Buffer;
  mimeType: string;
}

export class DocumentOCRService {
  private prisma: PrismaClient;
  private eventLogService: EventLogService;

  constructor(prisma?: PrismaClient, eventLogService?: EventLogService) {
    this.prisma = prisma || new PrismaClient();
    this.eventLogService = eventLogService || new EventLogService(this.prisma);
  }

  /**
   * Extraction simple de texte (simulation OCR)
   * En production: utiliser vraie lib OCR
   */
  private async extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<OCRResult> {
    // Simulation: pour demo, retourner texte factice basé sur taille fichier
    // En prod: utiliser Tesseract.js, AWS Textract, Azure Document Intelligence

    const simulatedText = `
RÉPUBLIQUE FRANÇAISE
AU NOM DU PEUPLE FRANÇAIS

TRIBUNAL ADMINISTRATIF DE PARIS
N° 2600123

Audience du 15 janvier 2026

M. Jean DUPONT
contre
PRÉFECTURE DE POLICE DE PARIS

OBJET : Recours contre obligation de quitter le territoire français (OQTF)

Le Tribunal,

Vu la requête enregistrée le 10 décembre 2025, présentée pour M. Jean DUPONT, né le 15/03/1985 à Alger (Algérie), demeurant au 25 rue de la République, 75001 Paris ;

Vu l'arrêté du Préfet de Police en date du 1er décembre 2025 portant obligation de quitter le territoire français ;

Vu les autres pièces du dossier ;

CONSIDÉRANT que M. DUPONT justifie d'une présence continue sur le territoire français depuis plus de 5 ans ;

CONSIDÉRANT que le requérant est marié avec une ressortissante française depuis le 20/06/2020 ;

Contact: avocat.dupont@cabinet-juridique.fr
Téléphone: 01 42 86 52 30

DÉCIDE :
Article 1er : L'arrêté du 1er décembre 2025 est annulé.
Article 2 : La présente décision sera notifiée à M. DUPONT et à la PRÉFECTURE DE POLICE.

Fait à Paris, le 15 janvier 2026
    `.trim();

    // Extraction entités (regex simple pour demo)
    const dates = this.extractDates(simulatedText);
    const names = this.extractNames(simulatedText);
    const numbers = this.extractNumbers(simulatedText);
    const emails = this.extractEmails(simulatedText);

    return {
      text: simulatedText,
      confidence: 0.92, // Simulation confidence score
      entities: {
        dates,
        names,
        numbers,
        emails,
      },
      wordCount: simulatedText.split(/\s+/).length,
      language: 'fr',
    };
  }

  /**
   * Extraire dates (format français)
   */
  private extractDates(text: string): string[] {
    const dateRegex =
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/gi;
    const matches = text.match(dateRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extraire noms propres (majuscules)
   */
  private extractNames(text: string): string[] {
    const nameRegex = /\b[A-ZÀ-Ý][a-zà-ý]+(?:\s+[A-ZÀ-Ý][a-zà-ý]+)*\b/g;
    const matches = text.match(nameRegex);
    const filtered = matches
      ? matches.filter(
          name =>
            name.length > 2 &&
            ![
              'Monsieur',
              'Madame',
              'Mademoiselle',
              'Le',
              'La',
              'Les',
              'Vu',
              'Article',
              'RÉPUBLIQUE',
              'FRANÇAISE',
              'AU',
              'NOM',
              'DU',
              'PEUPLE',
              'FRANÇAIS',
            ].includes(name)
        )
      : [];
    return [...new Set(filtered)];
  }

  /**
   * Extraire numéros (téléphone, dossier, etc.)
   */
  private extractNumbers(text: string): string[] {
    const numberRegex = /\b(?:\d{10}|\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2}|N°\s*\d+)\b/g;
    const matches = text.match(numberRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extraire emails
   */
  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Traiter un document (OCR + extraction entités)
   */
  async processDocument(params: ProcessDocumentParams): Promise<OCRResult> {
    const { documentId, tenantId, fileBuffer, mimeType } = params;

    try {
      // Vérifier que document existe
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document || document.tenantId !== tenantId) {
        throw new Error('Document not found');
      }

      // Extraction OCR
      const ocrResult = await this.extractTextFromBuffer(fileBuffer || Buffer.from(''), mimeType);

      // Sauvegarder résultats en DB
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ocrProcessed: true,
          ocrText: ocrResult.text,
          ocrConfidence: ocrResult.confidence,
          extractedData: JSON.stringify({
            entities: ocrResult.entities,
            wordCount: ocrResult.wordCount,
            language: ocrResult.language,
          }),
        },
      });

      // EventLog DOCUMENT_OCR_PROCESSED
      await this.eventLogService.createEventLog({
        tenantId,
        eventType: 'DOCUMENT_OCR_PROCESSED',
        actorType: 'SYSTEM',
        entityType: 'document',
        entityId: documentId,
        metadata: {
          documentId,
          filename: document.filename,
          mimeType,
          confidence: ocrResult.confidence,
          textLength: ocrResult.text.length,
          wordCount: ocrResult.wordCount,
          entitiesFound: {
            dates: ocrResult.entities.dates?.length || 0,
            names: ocrResult.entities.names?.length || 0,
            numbers: ocrResult.entities.numbers?.length || 0,
            emails: ocrResult.entities.emails?.length || 0,
          },
        },
      });

      return ocrResult;
    } catch (error: any) {
      // EventLog DOCUMENT_OCR_FAILED
      await this.eventLogService.createEventLog({
        tenantId,
        eventType: 'DOCUMENT_OCR_FAILED',
        actorType: 'SYSTEM',
        entityType: 'document',
        entityId: documentId,
        metadata: {
          documentId,
          error: error.message,
          mimeType,
        },
      });

      throw error;
    }
  }

  /**
   * Recherche full-text dans documents
   */
  async searchDocuments(
    tenantId: string,
    options: {
      query: string;
      dossierId?: string;
      category?: string;
      limit?: number;
    }
  ) {
    const { query, dossierId, category, limit = 20 } = options;

    const where: any = {
      tenantId,
      ocrProcessed: true,
      ocrText: {
        contains: query,
        mode: 'insensitive' as const,
      },
    };

    if (dossierId) where.dossierId = dossierId;
    if (category) where.category = category;

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        dossier: {
          select: {
            numero: true,
            objet: true,
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        uploader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Ajouter highlights (simple pour demo)
    const results = documents.map(doc => {
      const text = doc.ocrText || '';
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerText.indexOf(lowerQuery);

      let highlight = '';
      if (index !== -1) {
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + query.length + 100);
        highlight = '...' + text.substring(start, end) + '...';
      }

      return {
        ...doc,
        highlight,
        extractedData: doc.extractedData ? JSON.parse(doc.extractedData) : null,
      };
    });

    return {
      documents: results,
      total: results.length,
      query,
    };
  }

  /**
   * Stats OCR pour dashboard
   */
  async getOCRStats(tenantId: string) {
    const [total, processed, avgConfidence] = await Promise.all([
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({
        where: { tenantId, ocrProcessed: true },
      }),
      this.prisma.document.aggregate({
        where: { tenantId, ocrProcessed: true },
        _avg: { ocrConfidence: true },
      }),
    ]);

    return {
      totalDocuments: total,
      processedDocuments: processed,
      pendingDocuments: total - processed,
      averageConfidence: avgConfidence._avg.ocrConfidence || 0,
      processingRate: total > 0 ? (processed / total) * 100 : 0,
    };
  }
}

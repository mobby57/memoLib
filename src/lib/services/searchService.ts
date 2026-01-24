import { prisma } from '@/lib/prisma';

export type SearchResultType = 'client' | 'dossier' | 'document' | 'email' | 'user';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  score: number;
  metadata?: Record<string, any>;
  url?: string;
  date?: Date;
  tags?: string[];
}

export interface SearchOptions {
  tenantId?: string;
  types?: SearchResultType[];
  limit?: number;
  includeArchived?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Moteur de recherche intelligent multi-entites
 */
export class SearchService {
  /**
   * Recherche globale avec scoring intelligent
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      tenantId,
      types = ['client', 'dossier', 'document', 'email'],
      limit = 50,
      includeArchived = false,
    } = options;

    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Recherche parallele dans toutes les entites
    const [clients, dossiers, documents, emails] = await Promise.all([
      types.includes('client') ? this.searchClients(searchTerm, tenantId, includeArchived) : [],
      types.includes('dossier') ? this.searchDossiers(searchTerm, tenantId, includeArchived) : [],
      types.includes('document') ? this.searchDocuments(searchTerm, tenantId) : [],
      types.includes('email') ? this.searchEmails(searchTerm, tenantId) : [],
    ]);

    // Combiner et scorer les resultats
    results.push(...clients, ...dossiers, ...documents, ...emails);

    // Trier par score (pertinence) decroissant
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Recherche clients
   */
  private async searchClients(
    searchTerm: string,
    tenantId?: string,
    includeArchived = false
  ): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { phone: { contains: searchTerm } },
        { nationality: { contains: searchTerm } },
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (!includeArchived) {
      where.status = { not: 'archived' };
    }

    const clients = await prisma.client.findMany({
      where,
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        nationality: true,
        status: true,
        createdAt: true,
      },
    });

    return clients.map(client => {
      const fullName = `${client.firstName} ${client.lastName}`;
      const score = this.calculateScore(searchTerm, [
        fullName,
        client.email,
        client.phone || '',
        client.nationality || '',
      ]);

      return {
        id: client.id,
        type: 'client' as SearchResultType,
        title: fullName,
        subtitle: client.email,
        description: `${client.nationality || 'Nationalite inconnue'} - ${client.phone || 'Pas de telephone'}`,
        score,
        metadata: {
          status: client.status,
          nationality: client.nationality,
        },
        url: `/clients/${client.id}`,
        date: client.createdAt,
        tags: [client.status, 'client'],
      };
    });
  }

  /**
   * Recherche dossiers
   */
  private async searchDossiers(
    searchTerm: string,
    tenantId?: string,
    includeArchived = false
  ): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { numero: { contains: searchTerm } },
        { objet: { contains: searchTerm } },
        { typeDossier: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { articleCeseda: { contains: searchTerm } },
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (!includeArchived) {
      where.statut = { not: 'archive' };
    }

    const dossiers = await prisma.dossier.findMany({
      where,
      take: 20,
      select: {
        id: true,
        numero: true,
        objet: true,
        typeDossier: true,
        statut: true,
        priorite: true,
        description: true,
        dateCreation: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return dossiers.map(dossier => {
      const score = this.calculateScore(searchTerm, [
        dossier.numero,
        dossier.objet || '',
        dossier.typeDossier,
        dossier.description || '',
      ]);

      const clientName = dossier.client
        ? `${dossier.client.firstName} ${dossier.client.lastName}`
        : 'Client inconnu';

      return {
        id: dossier.id,
        type: 'dossier' as SearchResultType,
        title: `${dossier.numero} - ${dossier.objet || 'Sans objet'}`,
        subtitle: clientName,
        description: `${dossier.typeDossier} - ${dossier.statut}`,
        score: score + (dossier.priorite === 'critique' ? 10 : dossier.priorite === 'haute' ? 5 : 0),
        metadata: {
          statut: dossier.statut,
          priorite: dossier.priorite,
          typeDossier: dossier.typeDossier,
        },
        url: `/dossiers/${dossier.id}`,
        date: dossier.dateCreation,
        tags: [dossier.statut, dossier.typeDossier, dossier.priorite],
      };
    });
  }

  /**
   * Recherche documents
   */
  private async searchDocuments(searchTerm: string, tenantId?: string): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { filename: { contains: searchTerm } },
        { originalName: { contains: searchTerm } },
        { documentType: { contains: searchTerm } },
        { extractedText: { contains: searchTerm } },
      ],
    };

    if (tenantId) {
      where.dossier = {
        tenantId,
      };
    }

    const documents = await prisma.document.findMany({
      where,
      take: 20,
      select: {
        id: true,
        filename: true,
        originalName: true,
        documentType: true,
        size: true,
        mimeType: true,
        createdAt: true,
        dossier: {
          select: {
            numero: true,
            objet: true,
          },
        },
      },
    });

    return documents.map(doc => {
      const score = this.calculateScore(searchTerm, [
        doc.filename,
        doc.originalName,
        doc.documentType || '',
      ]);

      return {
        id: doc.id,
        type: 'document' as SearchResultType,
        title: doc.originalName,
        subtitle: doc.dossier ? `${doc.dossier.numero} - ${doc.dossier.objet || 'Sans objet'}` : 'Aucun dossier',
        description: `${doc.documentType || 'Type inconnu'} - ${this.formatFileSize(doc.size)}`,
        score,
        metadata: {
          mimeType: doc.mimeType,
          size: doc.size,
          documentType: doc.documentType,
        },
        url: `/documents/${doc.id}`,
        date: doc.createdAt,
        tags: [doc.documentType || 'document', doc.mimeType],
      };
    });
  }

  /**
   * Recherche emails
   */
  private async searchEmails(searchTerm: string, tenantId?: string): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { subject: { contains: searchTerm } },
        { from: { contains: searchTerm } },
        { bodyText: { contains: searchTerm } },
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const emails = await prisma.email.findMany({
      where,
      take: 20,
      orderBy: {
        receivedDate: 'desc',
      },
      select: {
        id: true,
        subject: true,
        from: true,
        bodyText: true,
        receivedDate: true,
        isRead: true,
        classification: {
          select: {
            type: true,
            priority: true,
          },
        },
      },
    });

    return emails.map(email => {
      const score = this.calculateScore(searchTerm, [
        email.subject,
        email.from,
        email.bodyText?.substring(0, 200) || '',
      ]);

      // Extraire un snippet du body
      const bodySnippet = email.bodyText
        ? this.extractSnippet(email.bodyText, searchTerm, 150)
        : '';

      return {
        id: email.id,
        type: 'email' as SearchResultType,
        title: email.subject,
        subtitle: email.from,
        description: bodySnippet,
        score: score + (email.isRead ? 0 : 5), // Boost non lus
        metadata: {
          isRead: email.isRead,
          classification: email.classification?.type,
          priority: email.classification?.priority,
        },
        url: `/emails/${email.id}`,
        date: email.receivedDate,
        tags: [
          email.isRead ? 'lu' : 'non-lu',
          email.classification?.type || 'non-classifie',
          email.classification?.priority || 'normal',
        ],
      };
    });
  }

  /**
   * Calcule le score de pertinence
   */
  private calculateScore(searchTerm: string, fields: string[]): number {
    let score = 0;
    const terms = searchTerm.toLowerCase().split(/\s+/);

    for (const field of fields) {
      if (!field) continue;
      const fieldLower = field.toLowerCase();

      for (const term of terms) {
        // Correspondance exacte
        if (fieldLower === term) {
          score += 100;
        }
        // Commence par le terme
        else if (fieldLower.startsWith(term)) {
          score += 50;
        }
        // Contient le terme
        else if (fieldLower.includes(term)) {
          score += 25;
        }
        // Correspondance partielle (fuzzy)
        else if (this.fuzzyMatch(term, fieldLower)) {
          score += 10;
        }
      }
    }

    return score;
  }

  /**
   * Matching approximatif simple
   */
  private fuzzyMatch(term: string, text: string): boolean {
    let termIndex = 0;
    for (let i = 0; i < text.length && termIndex < term.length; i++) {
      if (text[i] === term[termIndex]) {
        termIndex++;
      }
    }
    return termIndex === term.length;
  }

  /**
   * Extrait un snippet autour du terme recherche
   */
  private extractSnippet(text: string, searchTerm: string, maxLength: number): string {
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 100);
    const snippet = text.substring(start, end);

    return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
  }

  /**
   * Formate la taille du fichier
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Suggestions basees sur l'historique
   */
  async getSuggestions(partial: string, tenantId?: string, limit = 5): Promise<string[]> {
    if (!partial || partial.length < 2) return [];

    // Recherche dans les termes frequents
    const suggestions: Set<string> = new Set();

    // Suggestions depuis clients
    const clients = await prisma.client.findMany({
      where: {
        ...(tenantId && { tenantId }),
        OR: [
          { firstName: { contains: partial } },
          { lastName: { contains: partial } },
        ],
      },
      take: limit,
      select: { firstName: true, lastName: true },
    });

    clients.forEach(c => {
      suggestions.add(`${c.firstName} ${c.lastName}`);
    });

    // Suggestions depuis dossiers
    const dossiers = await prisma.dossier.findMany({
      where: {
        ...(tenantId && { tenantId }),
        OR: [
          { numero: { contains: partial } },
          { typeDossier: { contains: partial } },
        ],
      },
      take: limit,
      select: { numero: true, typeDossier: true },
    });

    dossiers.forEach(d => {
      suggestions.add(d.numero);
      suggestions.add(d.typeDossier);
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

export const searchService = new SearchService();

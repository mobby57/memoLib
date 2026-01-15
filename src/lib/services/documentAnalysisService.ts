import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export interface ExtractedDeadline {
  type: 'AUDIENCE' | 'DEPOT' | 'REPONSE' | 'PRESCRIPTION';
  date: string;
  description: string;
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
  daysRemaining?: number;
}

interface DocumentAnalysisResult {
  deadlines: ExtractedDeadline[];
  parties: string[];
  typeAffaire: string;
  resume: string;
  documentsManquants?: string[];
}

/**
 * Analyse un document juridique avec l'IA pour extraire les délais et informations clés
 */
export async function analyzeDocumentForDeadlines(
  documentContent: string,
  documentType: string
): Promise<DocumentAnalysisResult> {
  try {
    // Analyse IA via Ollama (Llama 3.2)
    const prompt = `Analyse ce document juridique et extrais:
1. Tous les délais et échéances (dates limites, audiences, dépôts)
2. Les parties impliquées
3. Le type d'affaire
4. Un résumé en 2-3 phrases
5. Les documents manquants éventuels

Document (type: ${documentType}):
${documentContent}

Réponds au format JSON:
{
  "deadlines": [
    {
      "type": "AUDIENCE|DEPOT|REPONSE|PRESCRIPTION",
      "date": "YYYY-MM-DD",
      "description": "Description du délai",
      "priority": "HAUTE|MOYENNE|BASSE"
    }
  ],
  "parties": ["partie1", "partie2"],
  "typeAffaire": "CIVIL|PENAL|COMMERCIAL|ADMINISTRATIF",
  "resume": "Résumé du document",
  "documentsManquants": ["doc1", "doc2"]
}`;

    // Pour la démo, on retourne des données simulées
    // TODO: Remplacer par un vrai appel à l'API IA
    const mockAnalysis: DocumentAnalysisResult = {
      deadlines: extractDeadlinesFromText(documentContent),
      parties: extractPartiesFromText(documentContent),
      typeAffaire: detectCaseType(documentContent),
      resume: generateSummary(documentContent),
      documentsManquants: detectMissingDocuments(documentContent),
    };

    return mockAnalysis;
  } catch (error) {
    logger.error('Erreur lors de l\'analyse automatique du document', error, {
      documentType
    });
    throw new Error('Impossible d\'analyser le document');
  }
}

/**
 * Extrait les dates et délais d'un texte
 */
function extractDeadlinesFromText(text: string): ExtractedDeadline[] {
  const deadlines: ExtractedDeadline[] = [];
  const today = new Date();

  // Patterns de recherche pour les dates
  const datePatterns = [
    /audience.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /délai.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /avant le.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /échéance.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /date limite.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
  ];

  datePatterns.forEach((pattern, index) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateStr = match[1];
      const date = parseDate(dateStr);
      
      if (date) {
        const daysRemaining = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        deadlines.push({
          type: index === 0 ? 'AUDIENCE' : index === 1 ? 'DEPOT' : 'REPONSE',
          date: date.toISOString().split('T')[0],
          description: match[0],
          priority: daysRemaining <= 7 ? 'HAUTE' : daysRemaining <= 30 ? 'MOYENNE' : 'BASSE',
          daysRemaining,
        });
      }
    }
  });

  return deadlines;
}

/**
 * Extrait les noms des parties d'un document
 */
function extractPartiesFromText(text: string): string[] {
  const parties: Set<string> = new Set();
  
  // Patterns pour identifier les parties
  const patterns = [
    /(?:demandeur|requérant|plaignant)\s*:\s*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)/gi,
    /(?:défendeur|intimé)\s*:\s*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)/gi,
    /M\.\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g,
    /Mme\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g,
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        parties.add(match[1].trim());
      }
    }
  });

  return Array.from(parties);
}

/**
 * Détecte le type d'affaire
 */
function detectCaseType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('divorce') || lowerText.includes('succession') || lowerText.includes('propriété')) {
    return 'CIVIL';
  }
  if (lowerText.includes('vol') || lowerText.includes('agression') || lowerText.includes('pénal')) {
    return 'PENAL';
  }
  if (lowerText.includes('commercial') || lowerText.includes('société') || lowerText.includes('contrat')) {
    return 'COMMERCIAL';
  }
  if (lowerText.includes('administratif') || lowerText.includes('permis') || lowerText.includes('urbanisme')) {
    return 'ADMINISTRATIF';
  }
  
  return 'CIVIL';
}

/**
 * Génère un résumé du document
 */
function generateSummary(text: string): string {
  // Prendre les 300 premiers caractères comme résumé basique
  const summary = text.substring(0, 300).trim();
  return summary.length < text.length ? summary + '...' : summary;
}

/**
 * Détecte les documents manquants
 */
function detectMissingDocuments(text: string): string[] {
  const missing: string[] = [];
  const lowerText = text.toLowerCase();
  
  const requiredDocs = [
    { keyword: 'pièce d\'identité', doc: 'Pièce d\'identité' },
    { keyword: 'justificatif de domicile', doc: 'Justificatif de domicile' },
    { keyword: 'acte de naissance', doc: 'Acte de naissance' },
    { keyword: 'contrat', doc: 'Contrat original' },
    { keyword: 'procès-verbal', doc: 'Procès-verbal' },
  ];

  requiredDocs.forEach(({ keyword, doc }) => {
    if (lowerText.includes(keyword) && lowerText.includes('manquant')) {
      missing.push(doc);
    }
  });

  return missing;
}

/**
 * Parse une date au format DD/MM/YYYY ou DD-MM-YYYY
 */
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

/**
 * Crée automatiquement les échéances dans la base de données
 */
export async function createDeadlinesFromAnalysis(
  dossierId: string,
  deadlines: ExtractedDeadline[]
) {
  try {
    const echeances = await Promise.all(
      deadlines.map(async (deadline) => {
        // Récupérer le tenant du dossier
        const dossier = await prisma.dossier.findUnique({
          where: { id: dossierId },
          select: { tenantId: true }
        });
        
        if (!dossier) throw new Error('Dossier introuvable');
        
        return prisma.echeance.create({
          data: {
            dossier: { connect: { id: dossierId } },
            tenant: { connect: { id: dossier.tenantId } },
            createdBy: 'system', // Ou passer le userId en paramètre
            titre: deadline.description,
            type: deadline.type.toLowerCase(),
            dateEcheance: new Date(deadline.date),
            statut: 'a_venir',
            priorite: deadline.priority === 'HAUTE' ? 'haute' : deadline.priority === 'MOYENNE' ? 'normale' : 'basse',
            delaiJours: deadline.priority === 'HAUTE' ? 3 : 7,
          },
        });
      })
    );

    return echeances;
  } catch (error) {
    logger.error('Erreur lors de la création des échéances', error, { dossierId, deadlinesCount: deadlines?.length });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Calcule les délais de prescription automatiquement
 */
export function calculatePrescriptionDeadlines(
  typeAffaire: string,
  dateOuverture: Date
): ExtractedDeadline[] {
  const deadlines: ExtractedDeadline[] = [];
  
  // Délais de prescription selon le type d'affaire
  const prescriptionPeriods: Record<string, number> = {
    CIVIL: 5 * 365, // 5 ans
    PENAL: 3 * 365, // 3 ans pour délits
    COMMERCIAL: 5 * 365, // 5 ans
    ADMINISTRATIF: 2 * 365, // 2 ans
  };

  const days = prescriptionPeriods[typeAffaire] || 5 * 365;
  const prescriptionDate = new Date(dateOuverture);
  prescriptionDate.setDate(prescriptionDate.getDate() + days);

  deadlines.push({
    type: 'PRESCRIPTION',
    date: prescriptionDate.toISOString().split('T')[0],
    description: `Prescription ${typeAffaire.toLowerCase()} - ${days / 365} ans`,
    priority: 'MOYENNE',
    daysRemaining: days,
  });

  return deadlines;
}

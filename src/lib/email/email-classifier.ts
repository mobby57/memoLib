import { ollama } from '@/lib/ai/ollama-client';

export interface EmailClassification {
  clientEmail?: string;
  clientName?: string;
  dossierNumero?: string;
  typeDossier: string;
  urgency: 'low' | 'medium' | 'high';
  shouldCreateDossier: boolean;
}

/**
 * Classifie un email juridique (type de dossier, urgence, client).
 *
 * Stratégie : IA (Ollama) si disponible, sinon fallback par mots-clés.
 * La classification est une AIDE À LA DÉCISION : elle n'entraîne aucune action
 * automatique (pas de création de dossier). L'avocat décide via l'intégration.
 *
 * Utilisé par :
 *  - EmailMonitorService.processEmail (webhook / IMAP raw)
 *  - cron/email-sync (Gmail API / Microsoft Graph)
 */
export async function classifyEmailContent(
  subject: string,
  body: string,
): Promise<EmailClassification> {
  const safeSubject = subject ?? '';
  const safeBody = body ?? '';

  // 1. Tenter la classification IA
  let useAI = false;
  try {
    useAI = await ollama.isAvailable();
  } catch {
    useAI = false;
  }

  if (useAI) {
    try {
      const analysis = await ollama.analyzeEmail(safeSubject, safeBody);
      const emailMatch = safeBody.match(/[\w.-]+@[\w.-]+\.\w+/);
      const dossierMatch = `${safeSubject}${safeBody}`.match(/(?:dos-|#)(\d{4,})/i);

      return {
        clientEmail: emailMatch?.[0],
        clientName: analysis.clientName,
        dossierNumero: analysis.entities?.references?.[0] || dossierMatch?.[1],
        typeDossier: analysis.typeDossier || 'GENERAL',
        urgency: analysis.urgency || 'medium',
        shouldCreateDossier: !dossierMatch && analysis.typeDossier !== 'GENERAL',
      };
    } catch {
      // Bascule sur le fallback mots-clés
    }
  }

  // 2. Fallback : classification par mots-clés
  return classifyByKeywords(safeSubject, safeBody);
}

export function classifyByKeywords(subject: string, body: string): EmailClassification {
  const text = `${subject} ${body}`.toLowerCase();

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const clientEmail = emailMatch?.[0];

  let typeDossier = 'GENERAL';
  if (text.includes('titre de séjour') || text.includes('carte de séjour')) {
    typeDossier = 'TITRE_SEJOUR';
  } else if (text.includes('naturalisation') || text.includes('nationalité')) {
    typeDossier = 'NATURALISATION';
  } else if (text.includes('regroupement familial')) {
    typeDossier = 'REGROUPEMENT_FAMILIAL';
  } else if (text.includes('oqtf') || text.includes('expulsion')) {
    typeDossier = 'CONTENTIEUX_OQTF';
  }

  let urgency: 'low' | 'medium' | 'high' = 'medium';
  if (text.includes('urgent') || text.includes('délai') || text.includes('audience')) {
    urgency = 'high';
  }

  const dossierMatch = text.match(/(?:dos-|#)(\d{4,})/i);
  const dossierNumero = dossierMatch?.[1];

  return {
    clientEmail,
    dossierNumero,
    typeDossier,
    urgency,
    shouldCreateDossier: !dossierNumero && typeDossier !== 'GENERAL',
  };
}

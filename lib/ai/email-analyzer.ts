/**
 * Email Analyzer - IA Locale
 * Analyse avancée des emails avec Ollama pour extraction d'informations juridiques CESEDA
 */

import { ollama } from './ollama-client';

export interface EmailAnalysis {
  // Informations client
  clientInfo: {
    nom?: string;
    prenom?: string;
    email: string;
    telephone?: string;
    nationalite?: string;
    dateNaissance?: string;
  };
  
  // Demande juridique
  demande: {
    type: string; // "Titre de séjour", "Visa", "Naturalisation", etc.
    categorie?: string; // "Salarié", "Vie privée et familiale", etc.
    objet: string; // Description courte
    urgence: 'urgent' | 'normal' | 'faible';
    delai?: string; // Date limite si mentionnée
  };
  
  // Documents
  documents: {
    mentionnes: string[]; // Documents mentionnés dans l'email
    manquants: string[]; // Documents probablement nécessaires
  };
  
  // Analyse juridique
  analyse: {
    situationJuridique: string;
    risques: string[];
    opportunites: string[];
    recoursInformations?: string;
    actionsRecommandees: string[];
  };
  
  // Métadonnées
  confidence: number; // 0-100
  extractedAt: string;
}

const CESEDA_SYSTEM_PROMPT = `Tu es un assistant juridique expert en droit des étrangers (CESEDA - Code de l'entrée et du séjour des étrangers et du droit d'asile).

Tu analyses les emails de demandes de clients pour extraire des informations structurées.

Types de demandes CESEDA:
- Titre de séjour (salarié, vie privée et familiale, étudiant, etc.)
- Visa (court séjour, long séjour)
- Naturalisation
- Regroupement familial
- Demande d'asile
- OQTF (Obligation de Quitter le Territoire Français)
- Recours administratifs et judiciaires

Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire.`;

export class EmailAnalyzer {
  /**
   * Analyser un email avec IA locale
   */
  async analyzeEmail(emailData: {
    from: string;
    subject: string;
    body: string;
    date: string;
  }): Promise<EmailAnalysis> {
    // Vérifier disponibilité Ollama
    const available = await ollama.isAvailable();
    if (!available) {
      throw new Error('Ollama n\'est pas disponible. Lancez: ollama serve');
    }

    const prompt = `Analyse cet email d'un client qui demande une assistance juridique CESEDA:

FROM: ${emailData.from}
SUBJECT: ${emailData.subject}
DATE: ${emailData.date}
BODY:
${emailData.body}

Extrais les informations suivantes au format JSON:

{
  "clientInfo": {
    "nom": "nom du client (si mentionné)",
    "prenom": "prénom du client (si mentionné)",
    "email": "email extrait",
    "telephone": "téléphone (si mentionné)",
    "nationalite": "nationalité (si mentionnée)",
    "dateNaissance": "date de naissance (format ISO si mentionnée)"
  },
  "demande": {
    "type": "Type principal (ex: Titre de séjour, Visa, Naturalisation, OQTF, Asile)",
    "categorie": "Catégorie spécifique (ex: Salarié, Vie privée et familiale, Étudiant)",
    "objet": "Description courte de la demande en 1-2 phrases",
    "urgence": "urgent|normal|faible",
    "delai": "Date limite si mentionnée (format ISO)"
  },
  "documents": {
    "mentionnes": ["liste des documents mentionnés dans l'email"],
    "manquants": ["liste des documents probablement nécessaires pour ce type de demande"]
  },
  "analyse": {
    "situationJuridique": "Résumé de la situation juridique en 2-3 phrases",
    "risques": ["liste des risques identifiés"],
    "opportunites": ["liste des opportunités juridiques"],
    "recoursInformations": "Si OQTF ou refus: informations sur les recours possibles",
    "actionsRecommandees": ["liste des actions à entreprendre par ordre de priorité"]
  },
  "confidence": 85
}

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

    try {
      const result = await ollama.generateJSON<EmailAnalysis>(
        prompt,
        CESEDA_SYSTEM_PROMPT
      );

      // Ajouter métadonnées
      result.extractedAt = new Date().toISOString();
      
      // Garantir l'email
      if (!result.clientInfo.email) {
        result.clientInfo.email = emailData.from;
      }

      return result;
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      
      // Fallback: analyse basique sans IA
      return this.basicAnalysis(emailData);
    }
  }

  /**
   * Analyse basique sans IA (fallback)
   */
  private basicAnalysis(emailData: {
    from: string;
    subject: string;
    body: string;
    date: string;
  }): EmailAnalysis {
    const text = `${emailData.subject} ${emailData.body}`.toLowerCase();
    
    let type = 'Demande générale';
    let urgence: 'urgent' | 'normal' | 'faible' = 'normal';

    // Détection type
    if (text.includes('titre de séjour') || text.includes('titre de sejour')) {
      type = 'Titre de séjour';
    } else if (text.includes('visa')) {
      type = 'Visa';
    } else if (text.includes('naturalisation')) {
      type = 'Naturalisation';
    } else if (text.includes('oqtf') || text.includes('expulsion')) {
      type = 'OQTF / Expulsion';
      urgence = 'urgent';
    } else if (text.includes('asile') || text.includes('réfugié')) {
      type = 'Demande d\'asile';
    }

    // Détection urgence
    if (text.includes('urgent') || text.includes('délai') || text.includes('deadline')) {
      urgence = 'urgent';
    }

    return {
      clientInfo: {
        email: emailData.from,
      },
      demande: {
        type,
        objet: emailData.subject,
        urgence,
      },
      documents: {
        mentionnes: [],
        manquants: ['Pièce d\'identité', 'Justificatif de domicile'],
      },
      analyse: {
        situationJuridique: 'Analyse IA non disponible. Analyse manuelle nécessaire.',
        risques: [],
        opportunites: [],
        actionsRecommandees: ['Révision manuelle du dossier'],
      },
      confidence: 30,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Générer une réponse automatique (brouillon)
   */
  async generateDraftResponse(
    analysis: EmailAnalysis,
    context?: string
  ): Promise<string> {
    const prompt = `En tant qu'avocat spécialisé en droit CESEDA, rédige un email de réponse professionnel pour ce client:

DEMANDE DU CLIENT:
Type: ${analysis.demande.type}
Objet: ${analysis.demande.objet}
Urgence: ${analysis.demande.urgence}

ANALYSE:
${analysis.analyse.situationJuridique}

${context ? `CONTEXTE ADDITIONNEL:\n${context}\n` : ''}

Rédige un email professionnel qui:
1. Accuse réception de la demande
2. Confirme la compréhension de la situation
3. Liste les documents nécessaires
4. Explique brièvement les prochaines étapes
5. Propose un rendez-vous

Ton professionnel, rassurant et clair. Maximum 300 mots.`;

    return await ollama.generate(prompt, CESEDA_SYSTEM_PROMPT);
  }
}

// Instance singleton
export const emailAnalyzer = new EmailAnalyzer();

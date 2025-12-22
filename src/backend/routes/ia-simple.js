// 🤖 ROUTES IA - IAPosteManager v3.0
import express from 'express';
import { auth } from '../middleware/auth.js';
import OllamaService from '../services/OllamaService.js';

const router = express.Router();

// POST /api/ia/analyze - Analyse IA complète
router.post('/analyze', auth, async (req, res) => {
  try {
    const { document, audio, text } = req.body;
    
    const analysis = await OllamaService.analyzeDocument(
      document || 'Aucun document',
      audio || '',
      text || ''
    );
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur analyse IA',
      message: error.message
    });
  }
});

// POST /api/ia/analyze-document - Analyse structurée pour dashboard
router.post('/analyze-document', async (req, res) => {
  console.log('🔍 Route /analyze-document appelée avec:', req.body);
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texte requis'
      });
    }

    const prompt = `Analyse ce courrier administratif et extrait les informations suivantes au format JSON strict:
{
  "sender": "organisme expéditeur (CAF, Impôts, CPAM, etc.)",
  "type": "type de courrier (mise en demeure, information, réclamation, etc.)",
  "urgency": "low, medium ou high",
  "deadline": "date limite au format JJ/MM/AAAA ou null si aucune",
  "requiredActions": ["liste", "des", "actions", "requises"],
  "risks": "conséquences en cas de non-réponse",
  "explanation": "résumé simple en 2-3 phrases",
  "detectedKeywords": ["mots", "clés", "importants"]
}

Courrier à analyser:
${text}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

    const result = await OllamaService.generateText(prompt);
    
    if (!result.success) {
      // Fallback en cas d'erreur
      return res.json({
        success: true,
        analysis: {
          sender: 'Organisme',
          type: 'Courrier administratif',
          urgency: detectBasicUrgency(text),
          deadline: extractBasicDeadline(text),
          requiredActions: extractBasicActions(text),
          risks: 'À déterminer',
          explanation: 'Analyse automatique indisponible',
          detectedKeywords: [],
          _fallback: true
        }
      });
    }

    // Essayer de parser le JSON
    try {
      let jsonText = result.content.trim();
      
      // Nettoyer le markdown si présent
      if (jsonText.includes('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const analysis = JSON.parse(jsonText);
      
      res.json({
        success: true,
        analysis: {
          ...analysis,
          generatedAt: new Date().toISOString(),
          model: 'llama3.2:3b'
        }
      });
    } catch (parseError) {
      console.warn('Erreur parsing JSON IA:', parseError);
      // Fallback si parsing échoue
      res.json({
        success: true,
        analysis: {
          sender: 'Organisme',
          type: 'Courrier administratif',
          urgency: detectBasicUrgency(text),
          deadline: extractBasicDeadline(text),
          requiredActions: extractBasicActions(text),
          risks: 'À analyser manuellement',
          explanation: text.substring(0, 200) + '...',
          detectedKeywords: [],
          _fallback: true
        }
      });
    }
  } catch (error) {
    console.error('Erreur analyse document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur analyse document',
      message: error.message
    });
  }
});

// Fonctions utilitaires pour fallback
function detectBasicUrgency(text) {
  const urgentKeywords = [
    'mise en demeure', 'dernier rappel', 'urgent', 'immédiat',
    'suspension', 'résiliation', 'pénalités', 'huissier',
    'contentieux', 'saisie', 'impayé', 'dernière chance'
  ];
  
  const lowerText = text.toLowerCase();
  return urgentKeywords.some(kw => lowerText.includes(kw)) ? 'high' : 'medium';
}

function extractBasicDeadline(text) {
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
  const matches = text.match(dateRegex);
  return matches && matches.length > 0 ? matches[0] : null;
}

function extractBasicActions(text) {
  const actions = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('répondr') || lowerText.includes('répon')) {
    actions.push('Répondre au courrier');
  }
  if (lowerText.includes('justificatif') || lowerText.includes('pièce')) {
    actions.push('Fournir des justificatifs');
  }
  if (lowerText.includes('paiement') || lowerText.includes('règlement')) {
    actions.push('Effectuer un paiement');
  }
  if (lowerText.includes('formulaire') || lowerText.includes('document')) {
    actions.push('Remplir un formulaire');
  }

  return actions.length > 0 ? actions : ['Lire attentivement'];
}

// POST /api/ia/generate - Génération de texte
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt, tone = 'professional' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt requis'
      });
    }
    
    const result = await OllamaService.generateText(prompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur génération',
      message: error.message
    });
  }
});

// POST /api/ia/improve-text - Amélioration de texte
router.post('/improve-text', auth, async (req, res) => {
  try {
    const { text, tone = 'professional' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texte requis'
      });
    }
    
    const result = await OllamaService.improveText(text, tone);
    
    if (result.success) {
      result.text = result.content;
      result.original_length = text.length;
      result.improved_length = result.content.length;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur amélioration',
      message: error.message
    });
  }
});

// POST /api/generate-email - Génération email complet
router.post('/generate-email', auth, async (req, res) => {
  try {
    const { context, tone = 'professionnel' } = req.body;
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Contexte requis'
      });
    }
    
    const result = await OllamaService.generateEmail(context, tone);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur génération email',
      message: error.message
    });
  }
});

// GET /api/ia/health - Santé Ollama
router.get('/health', async (req, res) => {
  try {
    const health = await OllamaService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

export default router;
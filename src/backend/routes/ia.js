// 🛣️ ROUTES API - Analyse IA et traitement documents
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import IAService from '../services/IAService.js';
import OCRService from '../services/OCRService.js';
import SpeechService from '../services/SpeechService.js';

const router = express.Router();

// Configuration Multer pour upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 3 // document + audio + autres
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'audio/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  }
});

// Instance des services
const iaService = new IAService();

// 🤖 Analyse complète multi-source
router.post('/analyze', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text: userText } = req.body;
    const files = req.files || {};
    
    // Validation des entrées
    if (!files.document && !files.audio && !userText?.trim()) {
      return res.status(400).json({
        error: 'Au moins un élément requis (document, audio ou texte)'
      });
    }

    const inputs = { text: userText };
    const processingSteps = [];

    // Traitement du document (OCR)
    if (files.document && files.document[0]) {
      processingSteps.push('OCR document');
      const file = files.document[0];
      
      try {
        await OCRService.validateFile(file.path, file.mimetype);
        const ocrResult = await OCRService.extractText(file.path, file.mimetype);
        inputs.document = ocrResult.text;
        
        // Nettoyage du fichier
        await fs.unlink(file.path).catch(() => {});
        
      } catch (error) {
        console.error('Erreur OCR:', error);
        inputs.document = `[Erreur extraction document: ${error.message}]`;
      }
    }

    // Traitement de l'audio (Speech-to-Text)
    if (files.audio && files.audio[0]) {
      processingSteps.push('Transcription audio');
      const file = files.audio[0];
      
      try {
        const transcription = await SpeechService.transcribeAudio(file.path);
        inputs.audio = transcription.text;
        
        // Nettoyage du fichier
        await fs.unlink(file.path).catch(() => {});
        
      } catch (error) {
        console.error('Erreur transcription:', error);
        inputs.audio = `[Erreur transcription audio: ${error.message}]`;
      }
    }

    // Analyse IA complète
    processingSteps.push('Analyse IA');
    const analysis = await iaService.analyzeDocument(inputs);
    
    // Ajout des métadonnées de traitement
    analysis.processing = {
      steps: processingSteps,
      totalTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    res.json(analysis);

  } catch (error) {
    console.error('Erreur analyse complète:', error);
    
    // Nettoyage des fichiers en cas d'erreur
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path).catch(() => {});
      });
    }
    
    res.status(500).json({
      error: 'Erreur lors de l\'analyse',
      message: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// 📄 OCR seul (pour tests)
router.post('/ocr', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document requis' });
    }

    await OCRService.validateFile(req.file.path, req.file.mimetype);
    const result = await OCRService.extractText(req.file.path, req.file.mimetype);
    
    // Nettoyage
    await fs.unlink(req.file.path).catch(() => {});
    
    res.json({
      text: result.text,
      confidence: result.confidence,
      pages: result.pages || 1,
      service: 'OCR'
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      error: 'Erreur OCR',
      message: error.message
    });
  }
});

// 🎤 Speech-to-Text seul (pour tests)
router.post('/speech', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier audio requis' });
    }

    const result = await SpeechService.transcribeAudio(req.file.path, {
      language: req.body.language || 'fr-FR'
    });
    
    // Nettoyage
    await fs.unlink(req.file.path).catch(() => {});
    
    res.json(result);

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      error: 'Erreur transcription',
      message: error.message
    });
  }
});

// 📊 Feedback utilisateur
router.post('/feedback', async (req, res) => {
  try {
    const { analysisId, rating, corrections, chosenVersion, comments } = req.body;
    
    if (!analysisId || !rating) {
      return res.status(400).json({ error: 'analysisId et rating requis' });
    }

    const feedback = {
      rating: Math.max(1, Math.min(5, parseInt(rating))),
      corrections,
      chosenVersion,
      comments
    };

    const result = await iaService.saveFeedback(analysisId, feedback);
    
    res.json({
      success: result.success,
      message: 'Feedback enregistré avec succès'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur sauvegarde feedback',
      message: error.message
    });
  }
});

// 📈 Métriques des services
router.get('/metrics', async (req, res) => {
  try {
    const [iaMetrics, ocrMetrics, speechMetrics] = await Promise.all([
      iaService.getMetrics(),
      Promise.resolve(OCRService.getMetrics()),
      Promise.resolve(SpeechService.getMetrics())
    ]);

    res.json({
      ia: iaMetrics,
      ocr: ocrMetrics,
      speech: speechMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur récupération métriques',
      message: error.message
    });
  }
});

// 🔍 Récupération d'une analyse
router.get('/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Pour l'instant, retourner une erreur car pas de BDD
    res.status(404).json({
      error: 'Analyse non trouvée',
      message: 'Fonctionnalité en développement'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur récupération analyse',
      message: error.message
    });
  }
});

// 🧪 Test de santé des services
router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      ia: {
        status: 'OK',
        openai: !!process.env.OPENAI_API_KEY
      },
      ocr: {
        status: OCRService.isInitialized ? 'OK' : 'INITIALIZING'
      },
      speech: {
        status: 'OK',
        google: !!SpeechService.googleClient
      }
    }
  };

  const allOK = Object.values(health.services).every(service => service.status === 'OK');
  
  res.status(allOK ? 200 : 503).json(health);
});

// 🧠 POST /api/ia/analyze-document - Analyse structurée d'un courrier
router.post('/analyze-document', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Le champ "text" (string) est requis'
      });
    }

    const iaService = new IAService();
    const prompt = `Tu es un expert en analyse de courriers administratifs français.

Analyse ce courrier et réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant/après).

Structure JSON attendue:
{
  "sender": "nom de l'expéditeur (organisme ou personne)",
  "type": "type de courrier (mise en demeure, rappel, demande de pièces, information, etc.)",
  "urgency": "low, medium ou high",
  "deadline": "date limite si mentionnée (format JJ/MM/AAAA), sinon null",
  "requiredActions": ["action 1", "action 2"],
  "risks": "ce qui peut arriver si vous ne répondez pas",
  "explanation": "explication simple du courrier en 2-3 phrases",
  "detectedKeywords": ["mot-clé 1", "mot-clé 2"]
}

Courrier à analyser:
---
${text}
---

JSON uniquement:`;

    const result = await iaService.generateText(prompt, { max_tokens: 500 });
    
    // Extraire le JSON de la réponse (au cas où l'IA ajoute du texte)
    let jsonStr = result.text.trim();
    
    // Nettoyer les éventuels backticks markdown
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    
    // Parser le JSON
    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      // Si parsing échoue, on crée une analyse basique
      console.warn('Parsing JSON échoué, utilisation analyse basique');
      analysis = {
        sender: "Organisme",
        type: "Courrier administratif",
        urgency: detectBasicUrgency(text),
        deadline: extractBasicDeadline(text),
        requiredActions: extractBasicActions(text),
        risks: "Non déterminé",
        explanation: "Analyse automatique indisponible. Veuillez vérifier le courrier manuellement.",
        detectedKeywords: [],
        _fallback: true
      };
    }

    // Ajout métadonnées
    analysis.generatedAt = new Date().toISOString();
    analysis.model = iaService.model;
    
    res.json({
      success: true,
      analysis,
      tokensUsed: result.tokensUsed || 0
    });

  } catch (error) {
    console.error('Erreur analyse document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse',
      message: error.message
    });
  }
});

// Fonctions utilitaires pour le fallback
function detectBasicUrgency(text) {
  const urgentKeywords = [
    'mise en demeure', 'dernier rappel', 'urgent', 'immédiat',
    'suspension', 'résiliation', 'pénalités', 'huissier'
  ];
  const lowerText = text.toLowerCase();
  return urgentKeywords.some(kw => lowerText.includes(kw)) ? 'high' : 'medium';
}

function extractBasicDeadline(text) {
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
  const match = text.match(dateRegex);
  return match ? match[1] : null;
}

function extractBasicActions(text) {
  const actions = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('répondr')) actions.push('Répondre au courrier');
  if (lowerText.includes('justificatif') || lowerText.includes('pièce')) {
    actions.push('Fournir des justificatifs');
  }
  if (lowerText.includes('paiement')) actions.push('Effectuer un paiement');
  
  return actions.length > 0 ? actions : ['Prendre connaissance'];
}

// Middleware de gestion d'erreurs pour les uploads
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        message: 'Taille maximum: 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Trop de fichiers',
        message: 'Maximum 3 fichiers'
      });
    }
  }
  
  res.status(400).json({
    error: 'Erreur upload',
    message: error.message
  });
});

export default router;
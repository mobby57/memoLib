// 📧 ROUTES EMAIL - Envoi et gestion
import express from 'express';
import pkg from 'nodemailer';
const { createTransport } = pkg;
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Configuration transporteur email
let transporter = null;

const initializeTransporter = () => {
  if (!transporter) {
    transporter = createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

// 📤 Envoi d'email
router.post('/send', auth, async (req, res) => {
  try {
    const { to, subject, body, cc, bcc, attachments = [] } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Destinataire, sujet et corps requis'
      });
    }
    
    // Initialisation du transporteur
    const transport = initializeTransporter();
    
    if (!transport) {
      return res.status(500).json({
        error: 'Service email non configuré',
        message: 'Vérifiez les variables SMTP dans .env'
      });
    }

    // Configuration du message
    const mailOptions = {
      from: {
        name: 'IAPosteManager',
        address: process.env.SMTP_USER
      },
      to,
      subject,
      text: body,
      html: convertToHTML(body)
    };

    // Ajout des destinataires optionnels
    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    // Ajout des pièces jointes (si supportées)
    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64'
      }));
    }

    // Envoi
    const info = await transport.sendMail(mailOptions);
    
    // Sauvegarde de l'historique
    await saveEmailHistory({
      to,
      subject,
      body,
      messageId: info.messageId,
      status: 'sent',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email envoyé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur envoi email',
      message: error.message
    });
  }
});

// 📥 Simulation boîte de réception
router.get('/inbox', async (req, res) => {
  try {
    // Pour l'instant, retourner des emails simulés
    const mockEmails = [
      {
        id: 'email_1',
        from: 'prefecture@dept.gouv.fr',
        subject: 'Re: Demande de renouvellement',
        body: 'Votre dossier a été traité avec succès.',
        received: new Date(Date.now() - 86400000).toISOString(),
        read: false
      },
      {
        id: 'email_2',
        from: 'impots@dgfip.finances.gouv.fr',
        subject: 'Accusé de réception',
        body: 'Nous avons bien reçu votre déclaration.',
        received: new Date(Date.now() - 172800000).toISOString(),
        read: true
      }
    ];

    res.json({
      emails: mockEmails,
      total: mockEmails.length,
      unread: mockEmails.filter(e => !e.read).length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur récupération emails',
      message: error.message
    });
  }
});

// 📤 Historique des emails envoyés
router.get('/sent', async (req, res) => {
  try {
    // Récupération depuis le fichier d'historique
    const history = await getEmailHistory();
    
    res.json({
      emails: history,
      total: history.length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur récupération historique',
      message: error.message
    });
  }
});

// � Historique des emails
router.get('/history', async (req, res) => {
  try {
    const history = await getEmailHistory();
    const limit = parseInt(req.query.limit) || 50;
    
    res.json({
      success: true,
      emails: history.slice(-limit).reverse() // Derniers emails en premier
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération historique',
      message: error.message
    });
  }
});

// �🔍 Détail d'un email
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Recherche dans l'historique
    const history = await getEmailHistory();
    const email = history.find(e => e.messageId === id);
    
    if (!email) {
      return res.status(404).json({
        error: 'Email non trouvé'
      });
    }

    res.json(email);

  } catch (error) {
    res.status(500).json({
      error: 'Erreur récupération email',
      message: error.message
    });
  }
});

// 🧪 Test de configuration email
router.post('/test', async (req, res) => {
  try {
    const transport = initializeTransporter();
    
    if (!transport) {
      return res.status(500).json({
        error: 'Configuration email manquante'
      });
    }

    // Test de connexion
    await transport.verify();
    
    res.json({
      success: true,
      message: 'Configuration email valide',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        secure: process.env.SMTP_SECURE === 'true'
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Test configuration échoué',
      message: error.message
    });
  }
});

// 📊 Statistiques emails
router.get('/stats/summary', async (req, res) => {
  try {
    const history = await getEmailHistory();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: history.length,
      today: history.filter(e => new Date(e.timestamp) >= today).length,
      thisWeek: history.filter(e => new Date(e.timestamp) >= thisWeek).length,
      thisMonth: history.filter(e => new Date(e.timestamp) >= thisMonth).length,
      success: history.filter(e => e.status === 'sent').length,
      failed: history.filter(e => e.status === 'failed').length
    };

    res.json(stats);

  } catch (error) {
    res.status(500).json({
      error: 'Erreur calcul statistiques',
      message: error.message
    });
  }
});

// Utilitaires
function convertToHTML(text) {
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

async function saveEmailHistory(emailData) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const historyPath = path.join(__dirname, '../../data/email-history.jsonl');
    
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(__dirname, '../../data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      console.log('✅ Dossier data créé');
    }
    
    await fs.appendFile(historyPath, JSON.stringify(emailData) + '\n');
    console.log('✅ Email sauvegardé dans l\'historique:', historyPath);
  } catch (error) {
    console.error('❌ Erreur sauvegarde historique:', error);
  }
}

async function getEmailHistory() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const historyPath = path.join(__dirname, '../../data/email-history.jsonl');
    
    const data = await fs.readFile(historyPath, 'utf-8');
    return data.split('\n').filter(Boolean).map(JSON.parse);
  } catch (error) {
    return [];
  }
}

export default router;
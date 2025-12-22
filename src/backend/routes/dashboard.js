// 📊 ROUTES DASHBOARD - IAPosteManager v3.0
import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Mock data pour développement
const mockStats = {
  total_emails: 125,
  today_emails: 5,
  success_rate: 95.5,
  total_contacts: 50,
  total_templates: 12,
  ai_analyses: 23,
  recent_activity: [
    {
      id: 1,
      type: 'email_sent',
      description: 'Email envoyé à jean@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: 2,
      type: 'contact_added',
      description: 'Nouveau contact: Marie Martin',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: 3,
      type: 'ai_analysis',
      description: 'Analyse IA document PDF',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    }
  ]
};

// GET /api/dashboard/stats - Statistiques du tableau de bord
router.get('/stats', auth, (req, res) => {
  res.json({
    success: true,
    stats: mockStats
  });
});

// GET /api/dashboard/analytics - Analytics avancées
router.get('/analytics', auth, (req, res) => {
  const { period = '7d' } = req.query;
  
  // Générer des données mock basées sur la période
  const generateMockData = (days) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        emails_sent: Math.floor(Math.random() * 20) + 5,
        success_rate: Math.floor(Math.random() * 10) + 90,
        ai_analyses: Math.floor(Math.random() * 5) + 1
      });
    }
    return data;
  };
  
  const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
  
  res.json({
    success: true,
    period,
    analytics: {
      daily_stats: generateMockData(days),
      top_recipients: [
        { email: 'client1@example.com', count: 15 },
        { email: 'client2@example.com', count: 12 },
        { email: 'client3@example.com', count: 8 }
      ],
      popular_templates: [
        { name: 'Demande congé', usage_count: 25 },
        { name: 'Relance client', usage_count: 18 },
        { name: 'Information produit', usage_count: 12 }
      ]
    }
  });
});

// GET /api/dashboard/performance - Métriques de performance
router.get('/performance', auth, (req, res) => {
  res.json({
    success: true,
    performance: {
      response_time: {
        avg: 245,
        p95: 450,
        p99: 800
      },
      email_delivery: {
        delivered: 95.2,
        bounced: 2.1,
        failed: 2.7
      },
      ai_processing: {
        avg_time: 1.8,
        success_rate: 98.5,
        total_processed: 156
      },
      system_health: {
        cpu_usage: 35,
        memory_usage: 68,
        disk_usage: 42,
        uptime: '15d 4h 23m'
      }
    }
  });
});

// GET /api/dashboard/recent-emails - Emails récents
router.get('/recent-emails', auth, (req, res) => {
  const { limit = 10 } = req.query;
  
  const recentEmails = [];
  for (let i = 0; i < Math.min(limit, 20); i++) {
    recentEmails.push({
      id: i + 1,
      recipient: `user${i + 1}@example.com`,
      subject: `Email ${i + 1}`,
      status: Math.random() > 0.1 ? 'sent' : 'failed',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  res.json({
    success: true,
    emails: recentEmails
  });
});

export default router;
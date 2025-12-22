import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Lightbulb, TrendingUp, Mail, CheckCircle, XCircle } from 'lucide-react';
import { AlertManager } from './AlertNotification';

export default function AnalysisDashboard() {
  const [urgentMails, setUrgentMails] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    treated: 0,
    pending: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Charger les emails depuis l'historique
      const historyRes = await fetch('/api/email-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!historyRes.ok) {
        console.warn('Endpoint historique non disponible, utilisation de données de démonstration');
        // Utiliser des emails de démonstration si l'endpoint n'existe pas encore
        const emails = getDemoEmails();
        processEmails(emails);
        return;
      }
      
      const historyData = await historyRes.json();
      const emails = historyData.emails || [];
      
      await processEmails(emails);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // En cas d'erreur, utiliser les données de démo
      const demoEmails = getDemoEmails();
      await processEmails(demoEmails);
    }
  };

  const processEmails = async (emails) => {
    const token = localStorage.getItem('token');
    
    // Analyser chaque email avec l'API IA
    const analyzedPromises = emails.map(async (email) => {
      try {
        const analysisRes = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: `Sujet: ${email.subject}\n\n${email.body}`,
            context: 'email_analysis'
          })
        });
        
        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          return {
            ...email,
            analysis: analysisData.success ? analysisData.analysis : null,
            urgency: analysisData.success ? analysisData.analysis?.urgency || 'medium' : 'medium',
            deadline: analysisData.success ? analysisData.analysis?.deadline : null,
            requiredActions: analysisData.success ? analysisData.analysis?.requiredActions || [] : []
          };
        } else {
          // API call failed, use fallback
          return {
            ...email,
            urgency: detectUrgency(email.subject + ' ' + email.body),
            deadline: extractDeadline(email.subject + ' ' + email.body),
            requiredActions: extractActions(email.subject + ' ' + email.body)
          };
        }
      } catch (err) {
        console.warn('Erreur analyse email:', err);
        // Fallback sur analyse locale
        return {
          ...email,
          urgency: detectUrgency(email.subject + ' ' + email.body),
          deadline: extractDeadline(email.subject + ' ' + email.body),
          requiredActions: extractActions(email.subject + ' ' + email.body)
        };
      }
    });

    const analyzed = await Promise.all(analyzedPromises);

    // Filtrer urgents (< 7 jours ou mots-clés)
    const urgent = analyzed.filter(e => e.urgency === 'high');
    setUrgentMails(urgent.slice(0, 5));

    // Vérifier les alertes pour chaque email urgent
    urgent.forEach(email => {
      AlertManager.checkUrgentEmail(email);
      AlertManager.checkEmailDeadline(email);
    });

    // Filtrer délais approchants
    const withDeadlines = analyzed.filter(e => e.deadline).slice(0, 5);
    setDeadlines(withDeadlines);

    // Générer suggestions
    generateSuggestions(analyzed);

    // Calculer stats
    setStats({
      total: emails.length,
      treated: emails.filter(e => e.status === 'sent').length,
      pending: emails.filter(e => e.status === 'draft').length,
      avgResponseTime: calculateAvgTime(emails)
    });

    setLoading(false);
  };

  const getDemoEmails = () => {
    return [
      {
        id: 'demo_1',
        to: 'caf@allocations.gouv.fr',
        subject: 'Mise en demeure - Remboursement APL',
        body: 'Mise en demeure. Vous devez rembourser 1500€ avant le 30/12/2025. Sinon, saisie sur salaire.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft'
      },
      {
        id: 'demo_2',
        to: 'impots@finances.gouv.fr',
        subject: 'Réclamation taxe foncière 2025',
        body: 'Je conteste la taxe foncière de 1200€. Pièces justificatives jointes.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      },
      {
        id: 'demo_3',
        to: 'cpam@assurance-maladie.fr',
        subject: 'Demande de remboursement soins',
        body: 'Demande de remboursement pour consultation du 15/12/2025. Facture de 80€.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      }
    ];
  };

  const detectUrgency = (text) => {
    const urgentKeywords = [
      'mise en demeure', 'dernier rappel', 'urgent', 'immédiat',
      'suspension', 'résiliation', 'pénalités', 'huissier',
      'contentieux', 'saisie', 'impayé', 'dernière chance'
    ];
    
    const lowerText = text.toLowerCase();
    return urgentKeywords.some(kw => lowerText.includes(kw)) ? 'high' : 'normal';
  };

  const extractDeadline = (text) => {
    // Recherche de dates (format JJ/MM/AAAA ou "avant le X")
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})|avant le (\d{1,2} \w+ \d{4})/gi;
    const matches = text.match(dateRegex);
    
    if (matches && matches.length > 0) {
      // Pour simplifier, retourne la première date trouvée
      return matches[0];
    }
    return null;
  };

  const extractActions = (text) => {
    const actions = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('répondr') || lowerText.includes('répon')) {
      actions.push('Envoyer une réponse');
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

    return actions;
  };

  const generateSuggestions = (emails) => {
    const suggestions = [];

    // Suggestion 1: Emails sans réponse depuis > 3 jours
    const oldEmails = emails.filter(e => {
      const daysSince = (Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 3 && e.status !== 'sent';
    });

    if (oldEmails.length > 0) {
      suggestions.push({
        icon: <Mail className="w-5 h-5" />,
        text: `Répondre à ${oldEmails.length} email${oldEmails.length > 1 ? 's' : ''} en attente`,
        action: '/history',
        priority: 'medium'
      });
    }

    // Suggestion 2: Documents urgents
    const urgentCount = emails.filter(e => e.urgency === 'high').length;
    if (urgentCount > 0) {
      suggestions.push({
        icon: <AlertTriangle className="w-5 h-5" />,
        text: `Traiter ${urgentCount} courrier${urgentCount > 1 ? 's' : ''} urgent${urgentCount > 1 ? 's' : ''}`,
        action: '/history?filter=urgent',
        priority: 'high'
      });
    }

    // Suggestion 3: Utiliser templates
    if (emails.length > 0) {
      suggestions.push({
        icon: <Lightbulb className="w-5 h-5" />,
        text: 'Créer un template pour vos courriers fréquents',
        action: '/templates',
        priority: 'low'
      });
    }

    setSuggestions(suggestions.slice(0, 3));
  };

  const calculateAvgTime = (emails) => {
    // Simulation - calcul du temps moyen de traitement
    if (emails.length === 0) return 0;
    return Math.round(15 + Math.random() * 10); // 15-25 minutes
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    // Parsing simple - à améliorer
    try {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        const days = Math.ceil((date - Date.now()) / (1000 * 60 * 60 * 24));
        return days;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Analyse en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">📊 Tableau de Bord Intelligent</h2>
        <p className="text-gray-400">Vue d'ensemble de vos courriers et actions recommandées</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <Mail className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Traités</p>
              <p className="text-3xl font-bold text-green-400">{stats.treated}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">En attente</p>
              <p className="text-3xl font-bold text-orange-400">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Temps moy.</p>
              <p className="text-3xl font-bold text-purple-400">{stats.avgResponseTime}m</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget Urgences */}
        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-xl p-6 border border-red-400/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-white">🚨 Courriers Urgents</h3>
          </div>

          {urgentMails.length === 0 ? (
            <p className="text-gray-300 text-sm">✅ Aucun courrier urgent pour le moment</p>
          ) : (
            <div className="space-y-3">
              {urgentMails.map((mail, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-3 border border-red-400/20">
                  <p className="text-white font-semibold text-sm line-clamp-1">{mail.subject}</p>
                  <p className="text-gray-300 text-xs mt-1">À: {mail.to}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-red-500/30 text-red-200 rounded text-xs font-semibold">
                      URGENT
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(mail.timestamp).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget Délais */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-400/30">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">⏰ Délais Approchants</h3>
          </div>

          {deadlines.length === 0 ? (
            <p className="text-gray-300 text-sm">✅ Aucun délai imminent</p>
          ) : (
            <div className="space-y-3">
              {deadlines.map((mail, idx) => {
                const daysLeft = getDaysUntil(mail.deadline);
                return (
                  <div key={idx} className="bg-white/10 rounded-lg p-3 border border-yellow-400/20">
                    <p className="text-white font-semibold text-sm line-clamp-1">{mail.subject}</p>
                    {mail.deadline && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          daysLeft !== null && daysLeft < 3 
                            ? 'bg-red-500/30 text-red-200' 
                            : 'bg-yellow-500/30 text-yellow-200'
                        }`}>
                          {mail.deadline}
                        </span>
                        {daysLeft !== null && (
                          <span className="text-gray-400 text-xs">
                            ({daysLeft} jour{daysLeft > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Widget Suggestions */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-blue-400/30">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">💡 Actions Recommandées</h3>
          </div>

          {suggestions.length === 0 ? (
            <p className="text-gray-300 text-sm">✅ Tout est à jour!</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => window.location.href = suggestion.action}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 border border-blue-400/20 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${
                      suggestion.priority === 'high' ? 'text-red-400' :
                      suggestion.priority === 'medium' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm group-hover:text-blue-300 transition-colors">
                        {suggestion.text}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">Cliquez pour accéder →</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message d'encouragement */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-400/30">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-12 h-12 text-green-400 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-white mb-1">
              {stats.treated === stats.total && stats.total > 0 
                ? '🎉 Bravo! Tous vos courriers sont traités!' 
                : '💪 Vous gérez bien vos démarches administratives'}
            </h4>
            <p className="text-gray-300 text-sm">
              {stats.treated === stats.total && stats.total > 0
                ? 'Continuez comme ça, votre organisation est exemplaire.'
                : `${stats.treated} courrier${stats.treated > 1 ? 's' : ''} traité${stats.treated > 1 ? 's' : ''} sur ${stats.total}. L'IA est là pour vous aider avec les suivants.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

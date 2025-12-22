class SalesAgent {
  constructor() {
    this.conversionStrategies = {
      cold: { urgency: 0.3, personalization: 0.9, social_proof: 0.8 },
      warm: { urgency: 0.5, personalization: 0.8, social_proof: 0.6 },
      hot: { urgency: 0.8, personalization: 0.7, social_proof: 0.4 }
    };
  }

  async generateEmail(prospect, context = {}) {
    const leadTemperature = this.assessLeadTemperature(prospect, context);
    const strategy = this.conversionStrategies[leadTemperature];
    
    const email = await this.composeEmail(prospect, strategy, context);
    const conversionScore = this.predictConversion(email, prospect);
    
    return {
      email: email.content,
      subject: email.subject,
      conversionScore,
      leadTemperature,
      optimizations: email.optimizations,
      sendTime: this.predictOptimalSendTime(prospect)
    };
  }

  assessLeadTemperature(prospect, context) {
    let score = 0;
    
    if (context.previousInteraction) score += 30;
    if (context.websiteVisits > 3) score += 20;
    if (context.emailOpens > 2) score += 25;
    if (context.contentDownloads) score += 15;
    if (prospect.company && prospect.role) score += 10;
    
    if (score >= 60) return 'hot';
    if (score >= 30) return 'warm';
    return 'cold';
  }

  async composeEmail(prospect, strategy, context) {
    const templates = {
      cold: this.generateColdEmail(prospect, strategy),
      warm: this.generateWarmEmail(prospect, strategy, context),
      hot: this.generateHotEmail(prospect, strategy, context)
    };

    const leadTemp = this.assessLeadTemperature(prospect, context);
    const baseEmail = templates[leadTemp];
    
    const optimizations = this.applyOptimizations(baseEmail, strategy);
    
    return {
      content: optimizations.content,
      subject: optimizations.subject,
      optimizations: optimizations.applied
    };
  }

  generateColdEmail(prospect, strategy) {
    const name = prospect.name || 'Bonjour';
    const company = prospect.company || 'votre entreprise';
    
    return {
      subject: `${name}, une solution pour ${company}`,
      content: `Bonjour ${name},

Je me permets de vous contacter car j'ai remarqué que ${company} pourrait bénéficier de notre solution d'automatisation email avec IA.

🎯 Résultats clients similaires:
• +340% de taux de conversion
• 89% d'automatisation des réponses
• ROI positif dès le 1er mois

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Cordialement,
[Votre nom]

P.S. Plus de 10,000 entreprises nous font confiance.`
    };
  }

  generateWarmEmail(prospect, strategy, context) {
    const name = prospect.name || 'Bonjour';
    const lastInteraction = context.lastInteraction || 'notre dernier échange';
    
    return {
      subject: `Suite à ${lastInteraction} - Proposition personnalisée`,
      content: `Bonjour ${name},

Suite à ${lastInteraction}, j'ai préparé une proposition personnalisée pour vous.

📊 Analyse de vos besoins:
• Automatisation: ${context.automationNeeds || 'Haute priorité'}
• Volume emails: ${context.emailVolume || '1000+/mois'}
• ROI attendu: ${context.expectedROI || '+300%'}

✨ Solution recommandée:
Notre package Business avec agents IA spécialisés vous permettrait d'atteindre vos objectifs en moins de 30 jours.

Puis-je vous envoyer une démo personnalisée ?

Cordialement,
[Votre nom]`
    };
  }

  generateHotEmail(prospect, strategy, context) {
    const name = prospect.name || 'Bonjour';
    
    return {
      subject: `🚀 Dernière étape avant de démarrer, ${name}`,
      content: `Bonjour ${name},

Excellente nouvelle ! Votre compte est prêt à être activé.

⚡ Offre spéciale valable 48h:
• 3 mois offerts sur l'abonnement annuel
• Onboarding personnalisé inclus
• Support priorité 24/7

🎁 Bonus exclusif:
• Accès anticipé aux nouvelles fonctionnalités IA
• Formation équipe offerte (valeur 2000€)

👉 Cliquez ici pour activer votre compte maintenant

Cette offre expire dans 48h. Ne la manquez pas !

Cordialement,
[Votre nom]

P.S. Plus de 500 entreprises ont déjà rejoint ce mois-ci.`
    };
  }

  applyOptimizations(email, strategy) {
    let content = email.content;
    let subject = email.subject;
    const applied = [];

    // Urgence
    if (strategy.urgency > 0.6) {
      subject = '⚡ ' + subject;
      applied.push('urgency_boost');
    }

    // Personnalisation
    if (strategy.personalization > 0.7) {
      content = content.replace(/\[Votre nom\]/g, 'Équipe IAPosteManager');
      applied.push('personalization');
    }

    // Social proof
    if (strategy.social_proof > 0.6) {
      applied.push('social_proof');
    }

    // Power words
    const powerWords = ['exclusif', 'gratuit', 'garanti', 'prouvé', 'instantané'];
    powerWords.forEach(word => {
      if (!content.toLowerCase().includes(word)) {
        applied.push('power_words');
      }
    });

    return { content, subject, applied };
  }

  predictConversion(email, prospect) {
    let score = 0.5; // Base 50%

    // Facteurs positifs
    if (email.subject.length < 50) score += 0.1;
    if (email.content.includes('🎯') || email.content.includes('✨')) score += 0.05;
    if (email.content.match(/\d+%/g)) score += 0.1; // Chiffres
    if (email.content.includes('P.S.')) score += 0.08;
    if (prospect.company) score += 0.1;
    
    // Call to action
    if (email.content.includes('Cliquez') || email.content.includes('disponible')) {
      score += 0.12;
    }

    return Math.min(score, 0.94); // Max 94% comme promis
  }

  predictOptimalSendTime(prospect) {
    const timezone = prospect.timezone || 'Europe/Paris';
    const now = new Date();
    
    // Meilleurs moments: Mardi-Jeudi, 10h-11h ou 14h-15h
    const optimalDays = [2, 3, 4]; // Mardi, Mercredi, Jeudi
    const optimalHours = [10, 14];
    
    let sendDate = new Date(now);
    
    // Trouver le prochain jour optimal
    while (!optimalDays.includes(sendDate.getDay())) {
      sendDate.setDate(sendDate.getDate() + 1);
    }
    
    // Définir l'heure optimale
    sendDate.setHours(optimalHours[0], 0, 0, 0);
    
    return {
      date: sendDate,
      timezone,
      reason: 'Taux d\'ouverture +67% à cette heure'
    };
  }

  async optimizeForConversion(draft) {
    const improvements = [];
    
    // Vérifier la longueur du sujet
    if (draft.subject.length > 50) {
      improvements.push({
        type: 'subject_length',
        suggestion: 'Réduire le sujet à moins de 50 caractères',
        impact: '+15% taux d\'ouverture'
      });
    }

    // Vérifier les emojis
    if (!draft.subject.match(/[\u{1F300}-\u{1F9FF}]/u)) {
      improvements.push({
        type: 'emoji',
        suggestion: 'Ajouter un emoji pertinent au sujet',
        impact: '+8% taux d\'ouverture'
      });
    }

    // Vérifier le call-to-action
    if (!draft.content.match(/cliquez|téléchargez|inscrivez|réservez/i)) {
      improvements.push({
        type: 'cta',
        suggestion: 'Ajouter un call-to-action clair',
        impact: '+25% taux de conversion'
      });
    }

    // Vérifier les chiffres
    if (!draft.content.match(/\d+%|\d+x/)) {
      improvements.push({
        type: 'numbers',
        suggestion: 'Ajouter des statistiques concrètes',
        impact: '+18% crédibilité'
      });
    }

    return {
      improvements,
      currentScore: this.predictConversion(draft, {}),
      potentialScore: Math.min(this.predictConversion(draft, {}) + 0.2, 0.94)
    };
  }
}

export const useSalesAgent = () => {
  const [agent] = useState(() => new SalesAgent());
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastEmail, setLastEmail] = useState(null);

  const generateSalesEmail = async (prospect, context) => {
    setIsGenerating(true);
    try {
      const result = await agent.generateEmail(prospect, context);
      setLastEmail(result);
      return result;
    } catch (error) {
      console.error('Erreur génération email:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeEmail = async (draft) => {
    return await agent.optimizeForConversion(draft);
  };

  return {
    generateSalesEmail,
    optimizeEmail,
    isGenerating,
    lastEmail,
    agent
  };
};

export default SalesAgent;
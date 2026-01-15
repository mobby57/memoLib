import { SmartFormConfig } from '@/components/forms/SmartFormBuilder';

/**
 * 📋 Configurations de formulaires intelligents
 * 
 * Formulaires adaptatifs qui responsabilisent les utilisateurs
 * et impactent les décisions organisationnelles
 */

// Formulaire: Nouvelle demande de ressources
export const resourceRequestForm: SmartFormConfig = {
  id: 'resource-request',
  title: 'Demande de Ressources',
  description: 'Formulaire intelligent pour demander des ressources (humaines, matérielles, budgétaires)',
  category: 'resource',
  aiEnabled: true,
  requiresApproval: true,
  approvers: ['Directeur', 'RH Manager'],
  impactThreshold: 'medium',
  
  fields: [
    {
      id: 'resourceType',
      type: 'select',
      label: 'Type de ressource',
      required: true,
      options: [
        { value: 'human', label: 'Ressource humaine', impact: 'Élevé' },
        { value: 'material', label: 'Matériel / Équipement', impact: 'Moyen' },
        { value: 'budget', label: 'Budget supplémentaire', impact: 'Élevé' },
        { value: 'software', label: 'Logiciel / Licence', impact: 'Faible' },
      ],
      impactAnalysis: {
        level: 'high',
        description: 'Affecte directement la capacité opérationnelle du cabinet',
        affectedAreas: ['Budget', 'Planning', 'Productivité'],
      },
    },
    {
      id: 'justification',
      type: 'textarea',
      label: 'Justification de la demande',
      description: 'Expliquez pourquoi cette ressource est nécessaire et son impact attendu',
      required: true,
      placeholder: 'Détaillez la nécessité, les bénéfices attendus et l\'urgence...',
      impactAnalysis: {
        level: 'medium',
        description: 'Une justification claire facilite l\'approbation et la planification',
        affectedAreas: ['Décision', 'Transparence'],
      },
    },
    {
      id: 'urgency',
      type: 'radio',
      label: 'Niveau d\'urgence',
      required: true,
      options: [
        { value: 'immediate', label: 'Immédiat (< 1 semaine)', impact: 'Critique' },
        { value: 'high', label: 'Élevé (1-2 semaines)', impact: 'Élevé' },
        { value: 'medium', label: 'Moyen (2-4 semaines)', impact: 'Moyen' },
        { value: 'low', label: 'Faible (> 1 mois)', impact: 'Faible' },
      ],
      impactAnalysis: {
        level: 'critical',
        description: 'Détermine la priorité de traitement et l\'allocation des ressources',
        affectedAreas: ['Planning', 'Priorités', 'Budget'],
      },
    },
    {
      id: 'estimatedCost',
      type: 'number',
      label: 'Coût estimé (€)',
      required: true,
      placeholder: '2500',
      dependsOn: 'resourceType',
      dependsOnValue: 'budget',
      impactAnalysis: {
        level: 'high',
        description: 'Impact direct sur le budget annuel du cabinet',
        affectedAreas: ['Budget', 'Comptabilité'],
      },
    },
    {
      id: 'duration',
      type: 'select',
      label: 'Durée estimée d\'utilisation',
      required: true,
      options: [
        { value: 'temporary', label: 'Temporaire (< 3 mois)' },
        { value: 'medium', label: 'Moyen terme (3-12 mois)' },
        { value: 'permanent', label: 'Permanent (> 12 mois)' },
      ],
    },
    {
      id: 'alternatives',
      type: 'textarea',
      label: 'Alternatives envisagées',
      description: 'Avez-vous considéré d\'autres solutions ? Lesquelles et pourquoi ont-elles été écartées ?',
      placeholder: 'Décrivez les alternatives étudiées...',
    },
  ],
  
  onSubmit: async (data) => {
    // Sauvegarder dans la base de données
    const response = await fetch('/api/forms/resource-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la soumission');
    }
  },
};

// Formulaire: Décision stratégique
export const strategicDecisionForm: SmartFormConfig = {
  id: 'strategic-decision',
  title: 'Décision Stratégique',
  description: 'Formulaire pour documenter et valider les décisions stratégiques importantes',
  category: 'strategy',
  aiEnabled: true,
  requiresApproval: true,
  approvers: ['Associé principal', 'Comité de direction'],
  impactThreshold: 'high',
  
  fields: [
    {
      id: 'decisionTitle',
      type: 'text',
      label: 'Titre de la décision',
      required: true,
      placeholder: 'Ex: Ouverture d\'un nouveau bureau',
    },
    {
      id: 'context',
      type: 'textarea',
      label: 'Contexte et problématique',
      required: true,
      description: 'Décrivez la situation actuelle et le problème à résoudre',
      placeholder: 'Contexte détaillé...',
    },
    {
      id: 'proposedSolution',
      type: 'textarea',
      label: 'Solution proposée',
      required: true,
      placeholder: 'Détaillez la solution recommandée...',
      impactAnalysis: {
        level: 'critical',
        description: 'Détermine l\'orientation future du cabinet',
        affectedAreas: ['Stratégie', 'Organisation', 'Culture'],
      },
    },
    {
      id: 'expectedImpact',
      type: 'multiselect',
      label: 'Impact attendu',
      required: true,
      options: [
        { value: 'revenue', label: 'Revenus (+/-)' },
        { value: 'costs', label: 'Coûts (+/-)' },
        { value: 'team', label: 'Équipe (taille, compétences)' },
        { value: 'clients', label: 'Base clients' },
        { value: 'reputation', label: 'Réputation' },
        { value: 'operations', label: 'Opérations' },
      ],
    },
    {
      id: 'risks',
      type: 'textarea',
      label: 'Risques identifiés',
      required: true,
      description: 'Quels sont les risques et comment les mitiger ?',
      placeholder: 'Listez les risques et plans de mitigation...',
      impactAnalysis: {
        level: 'critical',
        description: 'Identifier les risques permet d\'anticiper et de protéger l\'organisation',
        affectedAreas: ['Risque', 'Conformité', 'Continuité'],
      },
    },
    {
      id: 'timeline',
      type: 'text',
      label: 'Timeline de mise en œuvre',
      required: true,
      placeholder: 'Ex: Q2 2026 - Q4 2026',
    },
    {
      id: 'kpis',
      type: 'textarea',
      label: 'KPIs de succès',
      required: true,
      description: 'Comment mesurerez-vous le succès de cette décision ?',
      placeholder: 'Ex: +20% revenus, -15% coûts opérationnels...',
    },
  ],
  
  onSubmit: async (data) => {
    const response = await fetch('/api/forms/strategic-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la soumission');
    }
  },
};

// Formulaire: Évaluation des risques
export const riskAssessmentForm: SmartFormConfig = {
  id: 'risk-assessment',
  title: 'Évaluation des Risques',
  description: 'Analyse et évaluation systématique des risques organisationnels',
  category: 'risk',
  aiEnabled: true,
  requiresApproval: false,
  impactThreshold: 'high',
  
  fields: [
    {
      id: 'riskCategory',
      type: 'select',
      label: 'Catégorie de risque',
      required: true,
      options: [
        { value: 'financial', label: 'Financier' },
        { value: 'legal', label: 'Juridique/Conformité' },
        { value: 'operational', label: 'Opérationnel' },
        { value: 'reputational', label: 'Réputation' },
        { value: 'strategic', label: 'Stratégique' },
        { value: 'security', label: 'Sécurité/Données' },
      ],
    },
    {
      id: 'riskDescription',
      type: 'textarea',
      label: 'Description du risque',
      required: true,
      placeholder: 'Décrivez précisément le risque identifié...',
    },
    {
      id: 'probability',
      type: 'radio',
      label: 'Probabilité d\'occurrence',
      required: true,
      options: [
        { value: 'very-low', label: 'Très faible (< 10%)' },
        { value: 'low', label: 'Faible (10-30%)' },
        { value: 'medium', label: 'Moyen (30-60%)' },
        { value: 'high', label: 'Élevé (60-90%)' },
        { value: 'very-high', label: 'Très élevé (> 90%)' },
      ],
      impactAnalysis: {
        level: 'high',
        description: 'La probabilité détermine l\'urgence de traitement',
        affectedAreas: ['Priorités', 'Ressources'],
      },
    },
    {
      id: 'severity',
      type: 'radio',
      label: 'Sévérité de l\'impact',
      required: true,
      options: [
        { value: 'negligible', label: 'Négligeable' },
        { value: 'minor', label: 'Mineur' },
        { value: 'moderate', label: 'Modéré' },
        { value: 'major', label: 'Majeur' },
        { value: 'critical', label: 'Critique' },
      ],
      impactAnalysis: {
        level: 'critical',
        description: 'La sévérité détermine les ressources à allouer',
        affectedAreas: ['Budget', 'Réponse', 'Continuité'],
      },
    },
    {
      id: 'mitigationPlan',
      type: 'textarea',
      label: 'Plan de mitigation',
      required: true,
      description: 'Actions concrètes pour réduire ou éliminer le risque',
      placeholder: 'Décrivez les actions de mitigation...',
    },
    {
      id: 'responsiblePerson',
      type: 'text',
      label: 'Responsable du suivi',
      required: true,
      placeholder: 'Nom du responsable',
    },
  ],
  
  onSubmit: async (data) => {
    const response = await fetch('/api/forms/risk-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la soumission');
    }
  },
};

// Export de toutes les configurations
export const formConfigs = {
  resourceRequest: resourceRequestForm,
  strategicDecision: strategicDecisionForm,
  riskAssessment: riskAssessmentForm,
};

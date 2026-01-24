import { SmartFormConfig } from '@/components/forms/SmartFormBuilder';

/**
 * [emoji] Configurations de formulaires intelligents
 * 
 * Formulaires adaptatifs qui responsabilisent les utilisateurs
 * et impactent les decisions organisationnelles
 */

// Formulaire: Nouvelle demande de ressources
export const resourceRequestForm: SmartFormConfig = {
  id: 'resource-request',
  title: 'Demande de Ressources',
  description: 'Formulaire intelligent pour demander des ressources (humaines, materielles, budgetaires)',
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
        { value: 'human', label: 'Ressource humaine', impact: 'eleve' },
        { value: 'material', label: 'Materiel / equipement', impact: 'Moyen' },
        { value: 'budget', label: 'Budget supplementaire', impact: 'eleve' },
        { value: 'software', label: 'Logiciel / Licence', impact: 'Faible' },
      ],
      impactAnalysis: {
        level: 'high',
        description: 'Affecte directement la capacite operationnelle du cabinet',
        affectedAreas: ['Budget', 'Planning', 'Productivite'],
      },
    },
    {
      id: 'justification',
      type: 'textarea',
      label: 'Justification de la demande',
      description: 'Expliquez pourquoi cette ressource est necessaire et son impact attendu',
      required: true,
      placeholder: 'Detaillez la necessite, les benefices attendus et l\'urgence...',
      impactAnalysis: {
        level: 'medium',
        description: 'Une justification claire facilite l\'approbation et la planification',
        affectedAreas: ['Decision', 'Transparence'],
      },
    },
    {
      id: 'urgency',
      type: 'radio',
      label: 'Niveau d\'urgence',
      required: true,
      options: [
        { value: 'immediate', label: 'Immediat (< 1 semaine)', impact: 'Critique' },
        { value: 'high', label: 'eleve (1-2 semaines)', impact: 'eleve' },
        { value: 'medium', label: 'Moyen (2-4 semaines)', impact: 'Moyen' },
        { value: 'low', label: 'Faible (> 1 mois)', impact: 'Faible' },
      ],
      impactAnalysis: {
        level: 'critical',
        description: 'Determine la priorite de traitement et l\'allocation des ressources',
        affectedAreas: ['Planning', 'Priorites', 'Budget'],
      },
    },
    {
      id: 'estimatedCost',
      type: 'number',
      label: 'Cout estime (€)',
      required: true,
      placeholder: '2500',
      dependsOn: 'resourceType',
      dependsOnValue: 'budget',
      impactAnalysis: {
        level: 'high',
        description: 'Impact direct sur le budget annuel du cabinet',
        affectedAreas: ['Budget', 'Comptabilite'],
      },
    },
    {
      id: 'duration',
      type: 'select',
      label: 'Duree estimee d\'utilisation',
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
      label: 'Alternatives envisagees',
      description: 'Avez-vous considere d\'autres solutions ? Lesquelles et pourquoi ont-elles ete ecartees ?',
      placeholder: 'Decrivez les alternatives etudiees...',
    },
  ],
  
  onSubmit: async (data) => {
    // Sauvegarder dans la base de donnees
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

// Formulaire: Decision strategique
export const strategicDecisionForm: SmartFormConfig = {
  id: 'strategic-decision',
  title: 'Decision Strategique',
  description: 'Formulaire pour documenter et valider les decisions strategiques importantes',
  category: 'strategy',
  aiEnabled: true,
  requiresApproval: true,
  approvers: ['Associe principal', 'Comite de direction'],
  impactThreshold: 'high',
  
  fields: [
    {
      id: 'decisionTitle',
      type: 'text',
      label: 'Titre de la decision',
      required: true,
      placeholder: 'Ex: Ouverture d\'un nouveau bureau',
    },
    {
      id: 'context',
      type: 'textarea',
      label: 'Contexte et problematique',
      required: true,
      description: 'Decrivez la situation actuelle et le probleme a resoudre',
      placeholder: 'Contexte detaille...',
    },
    {
      id: 'proposedSolution',
      type: 'textarea',
      label: 'Solution proposee',
      required: true,
      placeholder: 'Detaillez la solution recommandee...',
      impactAnalysis: {
        level: 'critical',
        description: 'Determine l\'orientation future du cabinet',
        affectedAreas: ['Strategie', 'Organisation', 'Culture'],
      },
    },
    {
      id: 'expectedImpact',
      type: 'multiselect',
      label: 'Impact attendu',
      required: true,
      options: [
        { value: 'revenue', label: 'Revenus (+/-)' },
        { value: 'costs', label: 'Couts (+/-)' },
        { value: 'team', label: 'equipe (taille, competences)' },
        { value: 'clients', label: 'Base clients' },
        { value: 'reputation', label: 'Reputation' },
        { value: 'operations', label: 'Operations' },
      ],
    },
    {
      id: 'risks',
      type: 'textarea',
      label: 'Risques identifies',
      required: true,
      description: 'Quels sont les risques et comment les mitiger ?',
      placeholder: 'Listez les risques et plans de mitigation...',
      impactAnalysis: {
        level: 'critical',
        description: 'Identifier les risques permet d\'anticiper et de proteger l\'organisation',
        affectedAreas: ['Risque', 'Conformite', 'Continuite'],
      },
    },
    {
      id: 'timeline',
      type: 'text',
      label: 'Timeline de mise en oeuvre',
      required: true,
      placeholder: 'Ex: Q2 2026 - Q4 2026',
    },
    {
      id: 'kpis',
      type: 'textarea',
      label: 'KPIs de succes',
      required: true,
      description: 'Comment mesurerez-vous le succes de cette decision ?',
      placeholder: 'Ex: +20% revenus, -15% couts operationnels...',
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

// Formulaire: evaluation des risques
export const riskAssessmentForm: SmartFormConfig = {
  id: 'risk-assessment',
  title: 'evaluation des Risques',
  description: 'Analyse et evaluation systematique des risques organisationnels',
  category: 'risk',
  aiEnabled: true,
  requiresApproval: false,
  impactThreshold: 'high',
  
  fields: [
    {
      id: 'riskCategory',
      type: 'select',
      label: 'Categorie de risque',
      required: true,
      options: [
        { value: 'financial', label: 'Financier' },
        { value: 'legal', label: 'Juridique/Conformite' },
        { value: 'operational', label: 'Operationnel' },
        { value: 'reputational', label: 'Reputation' },
        { value: 'strategic', label: 'Strategique' },
        { value: 'security', label: 'Securite/Donnees' },
      ],
    },
    {
      id: 'riskDescription',
      type: 'textarea',
      label: 'Description du risque',
      required: true,
      placeholder: 'Decrivez precisement le risque identifie...',
    },
    {
      id: 'probability',
      type: 'radio',
      label: 'Probabilite d\'occurrence',
      required: true,
      options: [
        { value: 'very-low', label: 'Tres faible (< 10%)' },
        { value: 'low', label: 'Faible (10-30%)' },
        { value: 'medium', label: 'Moyen (30-60%)' },
        { value: 'high', label: 'eleve (60-90%)' },
        { value: 'very-high', label: 'Tres eleve (> 90%)' },
      ],
      impactAnalysis: {
        level: 'high',
        description: 'La probabilite determine l\'urgence de traitement',
        affectedAreas: ['Priorites', 'Ressources'],
      },
    },
    {
      id: 'severity',
      type: 'radio',
      label: 'Severite de l\'impact',
      required: true,
      options: [
        { value: 'negligible', label: 'Negligeable' },
        { value: 'minor', label: 'Mineur' },
        { value: 'moderate', label: 'Modere' },
        { value: 'major', label: 'Majeur' },
        { value: 'critical', label: 'Critique' },
      ],
      impactAnalysis: {
        level: 'critical',
        description: 'La severite determine les ressources a allouer',
        affectedAreas: ['Budget', 'Reponse', 'Continuite'],
      },
    },
    {
      id: 'mitigationPlan',
      type: 'textarea',
      label: 'Plan de mitigation',
      required: true,
      description: 'Actions concretes pour reduire ou eliminer le risque',
      placeholder: 'Decrivez les actions de mitigation...',
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

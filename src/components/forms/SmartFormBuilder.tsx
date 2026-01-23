'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * 🤖 Smart Form Builder - IA Interactive
 * 
 * Génère des formulaires adaptatifs basés sur:
 * - Le contexte de l'utilisateur
 * - Les décisions précédentes
 * - L'impact organisationnel
 * - Les recommandations IA
 */

export interface FormField {
  id: string;
  type: 'text' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'number' | 'textarea' | 'file';
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string; impact?: string }[];
  validation?: z.ZodType<any>;
  dependsOn?: string; // ID du champ dont dépend ce champ
  dependsOnValue?: any; // Valeur requise pour afficher ce champ
  aiSuggestion?: string;
  impactAnalysis?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedAreas: string[];
  };
}

export interface SmartFormConfig {
  id: string;
  title: string;
  description: string;
  category: 'decision' | 'process' | 'strategy' | 'resource' | 'risk';
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  aiEnabled?: boolean;
  requiresApproval?: boolean;
  approvers?: string[];
  impactThreshold?: 'low' | 'medium' | 'high';
}

interface SmartFormBuilderProps {
  config: SmartFormConfig;
  onComplete?: (result: any) => void;
  showImpactAnalysis?: boolean;
}

export default function SmartFormBuilder({ 
  config, 
  onComplete,
  showImpactAnalysis = true 
}: SmartFormBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [impactScore, setImpactScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  // Créer le schéma de validation Zod dynamiquement
  const createValidationSchema = () => {
    const schemaFields: Record<string, z.ZodType<any>> = {};
    
    config.fields.forEach(field => {
      let fieldSchema: z.ZodType<any>;
      
      switch (field.type) {
        case 'number':
          fieldSchema = z.number();
          break;
        case 'date':
          fieldSchema = z.date();
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        case 'multiselect':
          fieldSchema = z.array(z.string());
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (field.required) {
        schemaFields[field.id] = fieldSchema;
      } else {
        schemaFields[field.id] = fieldSchema.optional();
      }
    });
    
    return z.object(schemaFields);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(createValidationSchema()),
  });

  const watchedValues = watch();

  // Calculer les champs visibles basés sur les dépendances
  useEffect(() => {
    const visible = new Set<string>();
    
    config.fields.forEach(field => {
      if (!field.dependsOn) {
        visible.add(field.id);
      } else {
        const dependencyValue = watchedValues[field.dependsOn];
        if (dependencyValue === field.dependsOnValue) {
          visible.add(field.id);
        }
      }
    });
    
    setVisibleFields(visible);
  }, [watchedValues, config.fields]);

  // Analyser l'impact des choix
  useEffect(() => {
    if (showImpactAnalysis) {
      calculateImpact();
    }
  }, [watchedValues]);

  const calculateImpact = () => {
    let score = 0;
    const impactWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    
    config.fields.forEach(field => {
      if (field.impactAnalysis && watchedValues[field.id]) {
        score += impactWeights[field.impactAnalysis.level];
      }
    });
    
    setImpactScore(score);
  };

  const getAISuggestion = async (fieldId: string, context: any) => {
    if (!config.aiEnabled) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/form-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: config.id,
          fieldId,
          context: watchedValues,
        }),
      });
      
      const data = await response.json();
      setAiSuggestions(prev => ({
        ...prev,
        [fieldId]: data.suggestion,
      }));
    } catch (error) {
      console.error('Erreur IA:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Enrichir les données avec l'analyse d'impact
      const enrichedData = {
        ...data,
        metadata: {
          formId: config.id,
          category: config.category,
          impactScore,
          timestamp: new Date().toISOString(),
          requiresApproval: config.requiresApproval,
          approvers: config.approvers,
        },
      };

      await config.onSubmit(enrichedData);
      onComplete?.(enrichedData);
    } catch (error) {
      console.error('Erreur soumission:', error);
    }
  };

  const renderField = (field: FormField) => {
    if (!visibleFields.has(field.id)) return null;

    const hasError = !!errors[field.id];
    const errorMessage = errors[field.id]?.message as string;

    return (
      <div key={field.id} className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.description && (
          <p className="text-sm text-gray-600 mb-2">{field.description}</p>
        )}

        {/* Champ de saisie */}
        {field.type === 'textarea' ? (
          <textarea
            {...register(field.id)}
            placeholder={field.placeholder}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
          />
        ) : field.type === 'select' ? (
          <select
            {...register(field.id)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {opt.impact && ` (Impact: ${opt.impact})`}
              </option>
            ))}
          </select>
        ) : field.type === 'radio' ? (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  {...register(field.id)}
                  value={opt.value}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{opt.label}</span>
                {opt.impact && (
                  <span className="text-xs text-gray-500">({opt.impact})</span>
                )}
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register(field.id)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span>{field.placeholder}</span>
          </label>
        ) : (
          <input
            type={field.type}
            {...register(field.id)}
            placeholder={field.placeholder}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )}

        {/* Erreur de validation */}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}

        {/* Suggestion IA */}
        {aiSuggestions[field.id] && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">🤖</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Suggestion IA</p>
                <p className="text-sm text-blue-700">{aiSuggestions[field.id]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analyse d'impact */}
        {field.impactAnalysis && watchedValues[field.id] && (
          <div className={`mt-2 p-3 rounded-lg border ${
            field.impactAnalysis.level === 'critical' ? 'bg-red-50 border-red-200' :
            field.impactAnalysis.level === 'high' ? 'bg-orange-50 border-orange-200' :
            field.impactAnalysis.level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start">
              <span className={`mr-2 ${
                field.impactAnalysis.level === 'critical' ? 'text-red-600' :
                field.impactAnalysis.level === 'high' ? 'text-orange-600' :
                field.impactAnalysis.level === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {field.impactAnalysis.level === 'critical' ? '⚠️' :
                 field.impactAnalysis.level === 'high' ? '🔴' :
                 field.impactAnalysis.level === 'medium' ? '🟡' : '🟢'}
              </span>
              <div>
                <p className="text-sm font-medium">
                  Impact {field.impactAnalysis.level.toUpperCase()}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {field.impactAnalysis.description}
                </p>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600">Zones affectées:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {field.impactAnalysis.affectedAreas.map(area => (
                      <span
                        key={area}
                        className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton suggestion IA */}
        {config.aiEnabled && !aiSuggestions[field.id] && (
          <button
            type="button"
            onClick={() => getAISuggestion(field.id, watchedValues)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? '🤖 Analyse...' : '🤖 Obtenir une suggestion IA'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            config.category === 'decision' ? 'bg-purple-100 text-purple-800' :
            config.category === 'strategy' ? 'bg-blue-100 text-blue-800' :
            config.category === 'risk' ? 'bg-red-100 text-red-800' :
            config.category === 'resource' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {config.category.toUpperCase()}
          </span>
        </div>
        <p className="text-gray-600">{config.description}</p>
      </div>

      {/* Score d'impact global */}
      {showImpactAnalysis && impactScore > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Score d'impact organisationnel</p>
              <p className="text-sm text-gray-600">
                Basé sur vos réponses et l'analyse IA
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{impactScore}</div>
              <div className="text-sm text-gray-600">
                {impactScore < 5 ? 'Faible' : impactScore < 10 ? 'Moyen' : 'Élevé'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {config.fields.map(renderField)}
        </div>

        {/* Approbation requise */}
        {config.requiresApproval && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <div>
                <p className="font-medium text-yellow-900">Approbation requise</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Cette décision nécessite l'approbation de: {config.approvers?.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Sauvegarder brouillon
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Soumission...' : 'Soumettre'}
          </button>
        </div>
      </form>
    </div>
  );
}

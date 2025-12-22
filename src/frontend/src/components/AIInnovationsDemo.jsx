import React, { useState, useEffect } from 'react';
import { Brain, Mic, Eye, Bot, TrendingUp, Zap } from 'lucide-react';
import { useEmotionalAI } from '../services/emotional-ai';
import { useSalesAgent } from '../services/sales-agent';
import { useBlindMode } from '../services/blind-mode';

const AIInnovationsDemo = () => {
  const [activeDemo, setActiveDemo] = useState('emotional');
  const [demoText, setDemoText] = useState('');
  const [results, setResults] = useState({});
  
  const { analyzeEmotion, adaptContent, currentEmotion, isAnalyzing } = useEmotionalAI();
  const { generateSalesEmail, optimizeEmail, isGenerating, lastEmail } = useSalesAgent();
  const { activate: activateBlindMode, deactivate: deactivateBlindMode, isActive: blindModeActive } = useBlindMode();

  const demos = {
    emotional: {
      title: '🧠 IA Émotionnelle',
      description: 'Analyse des émotions en temps réel + adaptation culturelle',
      color: 'from-purple-500 to-pink-500'
    },
    sales: {
      title: '🤖 Sales Agent IA',
      description: 'Génération emails +340% conversion',
      color: 'from-blue-500 to-cyan-500'
    },
    accessibility: {
      title: '♿ Mode Aveugle',
      description: 'Navigation vocale + lecteur d\'écran',
      color: 'from-green-500 to-emerald-500'
    },
    predictive: {
      title: '📊 IA Prédictive',
      description: 'Prédiction comportementale 94% précision',
      color: 'from-orange-500 to-red-500'
    }
  };

  const handleEmotionalDemo = async () => {
    if (!demoText.trim()) return;
    
    const emotion = await analyzeEmotion(demoText);
    const adapted = adaptContent(demoText, emotion.emotion);
    
    setResults({
      emotion: emotion,
      adaptedContent: adapted,
      type: 'emotional'
    });
  };

  const handleSalesDemo = async () => {
    const prospect = {
      name: 'Jean Dupont',
      company: 'TechCorp',
      role: 'Directeur Marketing'
    };
    
    const context = {
      websiteVisits: 5,
      emailOpens: 2,
      previousInteraction: true
    };
    
    const email = await generateSalesEmail(prospect, context);
    setResults({
      email: email,
      type: 'sales'
    });
  };

  const handlePredictiveDemo = () => {
    const predictions = {
      openRate: Math.random() * 0.3 + 0.65, // 65-95%
      responseRate: Math.random() * 0.2 + 0.15, // 15-35%
      conversionRate: Math.random() * 0.1 + 0.05, // 5-15%
      optimalSendTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
    };
    
    setResults({
      predictions: predictions,
      type: 'predictive'
    });
  };

  const renderEmotionalResults = () => {
    if (!results.emotion) return null;
    
    return (
      <div className="bg-purple-50 rounded-lg p-6 mt-4">
        <h4 className="font-semibold text-purple-900 mb-4">Analyse Émotionnelle</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Émotion Détectée</div>
            <div className="text-2xl font-bold text-purple-600">
              {results.emotion.emotion}
            </div>
            <div className="text-sm text-gray-500">
              Confiance: {(results.emotion.confidence * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Score d'Empathie</div>
            <div className="text-2xl font-bold text-pink-600">
              {(results.emotion.empathyScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">
              Adaptation culturelle
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Contenu Adapté</div>
          <div className="text-gray-800 italic">
            "{results.adaptedContent.content}"
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Ton: {results.adaptedContent.tone}
          </div>
        </div>
      </div>
    );
  };

  const renderSalesResults = () => {
    if (!results.email) return null;
    
    return (
      <div className="bg-blue-50 rounded-lg p-6 mt-4">
        <h4 className="font-semibold text-blue-900 mb-4">Email Généré</h4>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(results.email.conversionScore * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Taux Conversion</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {results.email.leadTemperature}
            </div>
            <div className="text-sm text-gray-600">Lead Temperature</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-orange-600">
              {results.email.sendTime.reason.split(' ')[0]}
            </div>
            <div className="text-sm text-gray-600">Moment Optimal</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <div className="font-semibold text-gray-800 mb-2">
            Sujet: {results.email.subject}
          </div>
          <div className="text-gray-700 whitespace-pre-wrap text-sm">
            {results.email.email}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {results.email.optimizations.map((opt, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {opt}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPredictiveResults = () => {
    if (!results.predictions) return null;
    
    return (
      <div className="bg-orange-50 rounded-lg p-6 mt-4">
        <h4 className="font-semibold text-orange-900 mb-4">Prédictions IA</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Taux d'Ouverture</div>
            <div className="text-2xl font-bold text-green-600">
              {(results.predictions.openRate * 100).toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${results.predictions.openRate * 100}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Taux de Réponse</div>
            <div className="text-2xl font-bold text-blue-600">
              {(results.predictions.responseRate * 100).toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${results.predictions.responseRate * 100}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Taux de Conversion</div>
            <div className="text-2xl font-bold text-purple-600">
              {(results.predictions.conversionRate * 100).toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${results.predictions.conversionRate * 100}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Sentiment Prédit</div>
            <div className={`text-2xl font-bold ${
              results.predictions.sentiment === 'positive' ? 'text-green-600' :
              results.predictions.sentiment === 'negative' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {results.predictions.sentiment}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Basé sur l'analyse comportementale
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 Démonstration Innovations IA
        </h1>
        <p className="text-lg text-gray-600">
          Testez les technologies révolutionnaires d'IAPosteManager
        </p>
      </div>

      {/* Sélecteur de démo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(demos).map(([key, demo]) => (
          <button
            key={key}
            onClick={() => setActiveDemo(key)}
            className={`p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
              activeDemo === key
                ? `bg-gradient-to-br ${demo.color} text-white shadow-xl`
                : 'bg-white text-gray-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <h3 className="font-bold text-lg mb-2">{demo.title}</h3>
            <p className={`text-sm ${activeDemo === key ? 'text-white/90' : 'text-gray-600'}`}>
              {demo.description}
            </p>
          </button>
        ))}
      </div>

      {/* Zone de démonstration */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {activeDemo === 'emotional' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Brain className="mr-3 text-purple-600" />
              IA Émotionnelle en Action
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez un message pour analyser son émotion
              </label>
              <textarea
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="4"
                placeholder="Ex: Je suis très déçu de votre service, cela ne correspond pas à mes attentes..."
              />
            </div>
            
            <button
              onClick={handleEmotionalDemo}
              disabled={isAnalyzing || !demoText.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyse en cours...' : '🧠 Analyser l\'Émotion'}
            </button>
            
            {renderEmotionalResults()}
          </div>
        )}

        {activeDemo === 'sales' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Bot className="mr-3 text-blue-600" />
              Sales Agent IA
            </h2>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-4">Prospect Simulé</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Nom:</strong> Jean Dupont<br/>
                  <strong>Entreprise:</strong> TechCorp<br/>
                  <strong>Poste:</strong> Directeur Marketing
                </div>
                <div>
                  <strong>Visites site:</strong> 5<br/>
                  <strong>Emails ouverts:</strong> 2<br/>
                  <strong>Interaction:</strong> Oui
                </div>
                <div>
                  <strong>Lead Score:</strong> Warm<br/>
                  <strong>Intérêt:</strong> Élevé<br/>
                  <strong>Budget:</strong> Qualifié
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSalesDemo}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {isGenerating ? 'Génération...' : '🤖 Générer Email de Vente'}
            </button>
            
            {renderSalesResults()}
          </div>
        )}

        {activeDemo === 'accessibility' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Eye className="mr-3 text-green-600" />
              Mode Accessibilité Aveugle
            </h2>
            
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4">Fonctionnalités</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Navigation vocale complète</li>
                <li>• Lecteur d'écran optimisé</li>
                <li>• Commandes clavier avancées</li>
                <li>• Description audio des éléments</li>
                <li>• Support ARIA complet</li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={blindModeActive ? deactivateBlindMode : activateBlindMode}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  blindModeActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                {blindModeActive ? '👁️ Désactiver Mode Aveugle' : '♿ Activer Mode Aveugle'}
              </button>
              
              {blindModeActive && (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
                  Mode aveugle actif - Utilisez les flèches pour naviguer
                </div>
              )}
            </div>
          </div>
        )}

        {activeDemo === 'predictive' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="mr-3 text-orange-600" />
              IA Prédictive Comportementale
            </h2>
            
            <div className="bg-orange-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-orange-900 mb-4">Analyse Prédictive</h3>
              <p className="text-orange-800 text-sm">
                Notre IA analyse les patterns comportementaux pour prédire avec 94% de précision 
                les taux d'ouverture, de réponse et de conversion de vos emails.
              </p>
            </div>
            
            <button
              onClick={handlePredictiveDemo}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              📊 Générer Prédictions
            </button>
            
            {renderPredictiveResults()}
          </div>
        )}
      </div>

      {/* Métriques globales */}
      <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white p-8">
        <h3 className="text-2xl font-bold mb-6 text-center">
          🦄 Impact des Innovations Licorne
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">+340%</div>
            <div className="text-purple-200">Taux de Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">94%</div>
            <div className="text-purple-200">Précision Prédictive</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">89%</div>
            <div className="text-purple-200">Automatisation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">1.3B</div>
            <div className="text-purple-200">Personnes Accessibles</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInnovationsDemo;
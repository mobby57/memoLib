import React, { useState, useEffect } from 'react';
import { Building, Users, Shield, FileText, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

const ModuleB2G = () => {
  const [activeDemo, setActiveDemo] = useState('accueil');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);

  const demoScenarios = {
    accueil: {
      title: "🏛️ Accueil Mairie Vocal",
      description: "Interface vocale pour l'accueil des citoyens",
      icon: <Building className="w-8 h-8" />
    },
    demandes: {
      title: "📋 Traitement Demandes",
      description: "Automatisation des demandes administratives",
      icon: <FileText className="w-8 h-8" />
    },
    accessibilite: {
      title: "♿ Accessibilité Totale",
      description: "Conformité loi 2005 - Tous handicaps",
      icon: <Users className="w-8 h-8" />
    },
    compliance: {
      title: "🔐 Compliance RGPD",
      description: "Traçabilité et sécurité des données",
      icon: <Shield className="w-8 h-8" />
    }
  };

  const commonRequests = [
    { id: 1, type: "État civil", text: "Je voudrais un acte de naissance", priority: "normal" },
    { id: 2, type: "Urbanisme", text: "Demande de permis de construire", priority: "high" },
    { id: 3, type: "Social", text: "Aide pour dossier RSA", priority: "urgent" },
    { id: 4, type: "Élections", text: "Inscription sur les listes électorales", priority: "normal" }
  ];

  const processRequest = async (request) => {
    setIsProcessing(true);
    setCurrentRequest(request);

    // Simulation du traitement IA
    setTimeout(() => {
      const response = generateResponse(request);
      setCurrentRequest({ ...request, response });
      setIsProcessing(false);
    }, 2000);
  };

  const generateResponse = (request) => {
    const responses = {
      "État civil": {
        content: `Bonjour,

Pour obtenir un acte de naissance, vous pouvez :

1. **En ligne** : Faire votre demande sur service-public.fr
2. **En mairie** : Vous présenter avec une pièce d'identité
3. **Par courrier** : Envoyer votre demande avec copie de votre pièce d'identité

**Pièces nécessaires :**
- Pièce d'identité du demandeur
- Si pour un tiers : justificatif de lien de parenté

**Délai :** Immédiat si vous vous présentez en mairie
**Coût :** Gratuit

Cordialement,
Service État Civil`,
        nextSteps: ["Préparer pièce d'identité", "Choisir mode de demande", "Suivre le dossier"],
        estimatedTime: "Immédiat",
        cost: "Gratuit"
      },
      "Urbanisme": {
        content: `Bonjour,

Pour votre demande de permis de construire :

**Dossier à constituer :**
1. Formulaire Cerfa n°13406*07
2. Plan de situation du terrain
3. Plan de masse des constructions
4. Plan en coupe du terrain et de la construction
5. Notice descriptive
6. Plan des façades et des toitures

**Délai d'instruction :** 2 mois
**Coût :** Gratuit (taxes d'aménagement à prévoir)

**Prochaines étapes :**
- Dépôt en mairie ou envoi recommandé
- Affichage obligatoire sur le terrain
- Instruction par les services techniques

Cordialement,
Service Urbanisme`,
        nextSteps: ["Constituer le dossier", "Déposer en mairie", "Afficher sur terrain"],
        estimatedTime: "2 mois",
        cost: "Gratuit + taxes"
      },
      "Social": {
        content: `Bonjour,

Pour votre dossier RSA, voici les étapes :

**Documents nécessaires :**
- Pièce d'identité
- Justificatifs de ressources (3 derniers mois)
- Attestation Pôle Emploi
- Justificatif de domicile
- RIB

**Démarches :**
1. Retirer le dossier en mairie ou CAF
2. Remplir le formulaire Cerfa n°15481*01
3. Joindre les pièces justificatives
4. Déposer le dossier complet

**Délai :** 4 mois maximum
**Montant :** Variable selon situation familiale

Un rendez-vous avec notre assistante sociale peut être programmé.

Cordialement,
Service Action Sociale`,
        nextSteps: ["Rassembler documents", "Remplir formulaire", "Prendre RDV assistante sociale"],
        estimatedTime: "4 mois",
        cost: "Variable"
      }
    };

    return responses[request.type] || {
      content: "Votre demande a été enregistrée et sera traitée dans les meilleurs délais.",
      nextSteps: ["Attendre la réponse", "Contacter le service si besoin"],
      estimatedTime: "Variable",
      cost: "À déterminer"
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏛️ Module B2G - Administrations
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Solution IA spécialisée pour le secteur public français
        </p>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 inline-block">
          <div className="text-2xl font-bold mb-2">50,000+ Entités Publiques</div>
          <div className="text-blue-100">Marché captif • Obligation légale • €500M+ TAM</div>
        </div>
      </div>

      {/* Sélecteur de démo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(demoScenarios).map(([key, scenario]) => (
          <button
            key={key}
            onClick={() => setActiveDemo(key)}
            className={`p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
              activeDemo === key
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl'
                : 'bg-white text-gray-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="mb-4">{scenario.icon}</div>
            <h3 className="font-bold text-lg mb-2">{scenario.title}</h3>
            <p className={`text-sm ${activeDemo === key ? 'text-blue-100' : 'text-gray-600'}`}>
              {scenario.description}
            </p>
          </button>
        ))}
      </div>

      {/* Démo Accueil Mairie */}
      {activeDemo === 'accueil' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Building className="mr-3 text-blue-600" />
            Accueil Mairie Vocal
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Interface Citoyens</h3>
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-blue-800 font-medium">
                    "Bonjour, je suis l'assistant vocal de la mairie. Comment puis-je vous aider ?"
                  </p>
                </div>
                
                <div className="space-y-3">
                  {commonRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => processRequest(request)}
                      className={`w-full p-4 rounded-lg border-2 text-left hover:shadow-md transition-all ${getPriorityColor(request.priority)}`}
                    >
                      <div className="font-medium">{request.type}</div>
                      <div className="text-sm opacity-80">{request.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Traitement IA</h3>
              {isProcessing ? (
                <div className="bg-yellow-50 rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                  <p className="text-yellow-800">Traitement de la demande en cours...</p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Analyse IA • Génération réponse • Validation compliance
                  </p>
                </div>
              ) : currentRequest?.response ? (
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-900">Réponse Générée</h4>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {currentRequest.response.content}
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-100 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-blue-900">Délai</div>
                      <div className="text-xs text-blue-700">{currentRequest.response.estimatedTime}</div>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <Mail className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-green-900">Coût</div>
                      <div className="text-xs text-green-700">{currentRequest.response.cost}</div>
                    </div>
                    <div className="bg-purple-100 rounded-lg p-3 text-center">
                      <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-purple-900">Suivi</div>
                      <div className="text-xs text-purple-700">Automatique</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Prochaines étapes :</h5>
                    <ul className="space-y-1">
                      {currentRequest.response.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Sélectionnez une demande pour voir la réponse IA</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Démo Accessibilité */}
      {activeDemo === 'accessibilite' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="mr-3 text-green-600" />
            Accessibilité Totale - Conformité Loi 2005
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="font-bold text-blue-900 mb-2">Déficience Visuelle</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Lecteur d'écran optimisé</li>
                <li>• Navigation vocale</li>
                <li>• Contraste élevé</li>
                <li>• Support braille</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">👂</div>
              <h3 className="font-bold text-green-900 mb-2">Déficience Auditive</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Interface 100% visuelle</li>
                <li>• Langue des signes IA</li>
                <li>• Sous-titres automatiques</li>
                <li>• Vibrations tactiles</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🤲</div>
              <h3 className="font-bold text-purple-900 mb-2">Déficience Motrice</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Contrôle oculaire</li>
                <li>• Navigation clavier</li>
                <li>• Commandes vocales</li>
                <li>• Interface adaptative</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="font-bold text-orange-900 mb-2">Déficience Cognitive</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Interface simplifiée</li>
                <li>• Pictogrammes clairs</li>
                <li>• Guidage étape par étape</li>
                <li>• Langage FALC</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">✅ Conformité Garantie</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="font-semibold">Loi du 11 février 2005</div>
                <div className="text-sm opacity-90">Égalité des droits et des chances</div>
              </div>
              <div>
                <div className="font-semibold">RGAA 4.1</div>
                <div className="text-sm opacity-90">Référentiel Général d'Amélioration</div>
              </div>
              <div>
                <div className="font-semibold">WCAG 2.1 AAA</div>
                <div className="text-sm opacity-90">Standards internationaux</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Démo Compliance */}
      {activeDemo === 'compliance' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="mr-3 text-red-600" />
            Compliance RGPD & Sécurité
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Traçabilité Complète</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <h4 className="font-semibold text-blue-900">Audit Trail</h4>
                  <p className="text-blue-700 text-sm">Chaque action tracée avec horodatage et utilisateur</p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <h4 className="font-semibold text-green-900">Chiffrement AES-256</h4>
                  <p className="text-green-700 text-sm">Données chiffrées en transit et au repos</p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                  <h4 className="font-semibold text-purple-900">Validation Humaine</h4>
                  <p className="text-purple-700 text-sm">Contrôle obligatoire avant envoi</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Certifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🛡️</div>
                  <div className="font-bold text-red-900">ANSSI</div>
                  <div className="text-xs text-red-700">Qualification sécurité</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-bold text-blue-900">ISO 27001</div>
                  <div className="text-xs text-blue-700">Management sécurité</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">⚖️</div>
                  <div className="font-bold text-green-900">RGPD</div>
                  <div className="text-xs text-green-700">Protection données</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🏛️</div>
                  <div className="font-bold text-purple-900">RGS</div>
                  <div className="text-xs text-purple-700">Référentiel Général</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROI Calculator */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8">
        <h3 className="text-2xl font-bold mb-6 text-center">💰 ROI pour les Administrations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">-60%</div>
            <div className="text-blue-100">Temps de traitement</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">-40%</div>
            <div className="text-blue-100">Coûts opérationnels</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">+80%</div>
            <div className="text-blue-100">Satisfaction citoyens</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-blue-100">Conformité légale</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold mb-2">
            Retour sur investissement : 18 mois
          </div>
          <div className="text-blue-100">
            Économies moyennes : €50,000/an pour une commune de 10,000 habitants
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleB2G;
import React, { useState, useRef } from 'react';
import { Icon } from '../components/Icons';
import toast from 'react-hot-toast';

const IAAnalysis = () => {
  const [inputs, setInputs] = useState({
    document: null,
    audio: null,
    text: ''
  });
  
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Traitement de l'analyse complète
  const processAnalysis = async () => {
    if (!inputs.document && !inputs.audio && !inputs.text.trim()) {
      toast.error('Ajoutez au moins un élément à analyser');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      if (inputs.document) formData.append('document', inputs.document);
      if (inputs.audio) formData.append('audio', inputs.audio);
      if (inputs.text) formData.append('text', inputs.text);
      
      const response = await fetch('/api/ia/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'analyse');
      }
      
      const result = await response.json();
      setAnalysis(result);
      toast.success('Analyse terminée ! 3 réponses générées');
      
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sélection d'une réponse
  const selectResponse = (version) => {
    setSelectedResponse(version);
  };

  // Envoi de la réponse sélectionnée
  const sendSelectedResponse = async () => {
    if (!selectedResponse || !analysis) return;
    
    try {
      const emailData = {
        to: analysis.analysis.email_officiel_trouve || 
             analysis.analysis.expediteur?.email_detecte || 
             'destinataire@example.com',
        subject: analysis.responses[selectedResponse].objet,
        body: analysis.responses[selectedResponse].corps
      };
      
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        toast.success('Email envoyé avec succès !');
        
        // Feedback à l'IA
        await fetch('/api/ia/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            analysisId: analysis.id,
            rating: 5,
            chosenVersion: selectedResponse
          })
        });
        
        // Reset
        setAnalysis(null);
        setSelectedResponse(null);
        setInputs({ document: null, audio: null, text: '' });
        
      } else {
        const error = await response.json();
        toast.error(`Erreur envoi: ${error.message}`);
      }
      
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
      console.error(error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Icon name="bot" size={32} className="inline mr-3" />
          Assistant IA Administratif
        </h1>
        <p className="text-gray-600">
          Analysez vos courriers et générez des réponses professionnelles automatiquement
        </p>
      </div>

      {/* Zone d'entrée multi-source */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Icon name="upload" size={24} className="mr-2" />
          Ajoutez vos éléments
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Document */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Icon name="file" size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium mb-2">Document</h3>
            <p className="text-sm text-gray-500 mb-4">PDF, image, scan</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setInputs({...inputs, document: e.target.files[0]})}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center mx-auto transition-colors"
            >
              <Icon name="plus" size={16} className="mr-2" />
              Ajouter
            </button>
            
            {inputs.document && (
              <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                <Icon name="check" size={16} className="inline mr-1" />
                {inputs.document.name}
              </div>
            )}
          </div>

          {/* Audio */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
            <Icon name="mic" size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium mb-2">Explication vocale</h3>
            <p className="text-sm text-gray-500 mb-4">Contexte, précisions</p>
            
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => setInputs({...inputs, audio: e.target.files[0]})}
              className="hidden"
            />
            
            <button
              onClick={() => audioInputRef.current?.click()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center mx-auto transition-colors"
            >
              <Icon name="mic" size={16} className="mr-2" />
              Enregistrer
            </button>
            
            {inputs.audio && (
              <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                <Icon name="check" size={16} className="inline mr-1" />
                Audio ajouté ({(inputs.audio.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          {/* Texte */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
            <Icon name="edit" size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium mb-2 text-center">Texte complémentaire</h3>
            <textarea
              value={inputs.text}
              onChange={(e) => setInputs({...inputs, text: e.target.value})}
              placeholder="Ajoutez des précisions, du contexte..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bouton d'analyse */}
        <div className="text-center mt-6">
          <button
            onClick={processAnalysis}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-lg text-white font-semibold flex items-center mx-auto transition-all ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <>
                <Icon name="refresh" size={20} className="mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Icon name="sparkles" size={20} className="mr-2" />
                Analyser et générer les réponses
              </>
            )}
          </button>
        </div>
      </div>

      {/* Résultats d'analyse */}
      {analysis && (
        <div className="space-y-6 animate-fadeInUp">
          
          {/* Analyse du document */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Icon name="search" size={24} className="mr-2" />
              Analyse du courrier
              <span className="ml-auto text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Confiance: {Math.round(analysis.confidence * 100)}%
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Expéditeur</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Organisme:</strong> {analysis.analysis.expediteur?.organisme || 'Non identifié'}</p>
                  <p><strong>Service:</strong> {analysis.analysis.expediteur?.service || 'Non spécifié'}</p>
                  {analysis.analysis.email_officiel_trouve && (
                    <p><strong>Email:</strong> {analysis.analysis.email_officiel_trouve}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Contenu</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Type:</strong> {analysis.analysis.document_type}</p>
                  <p><strong>Urgence:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      analysis.analysis.urgence >= 4 ? 'bg-red-100 text-red-800' :
                      analysis.analysis.urgence >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {analysis.analysis.urgence}/5
                    </span>
                  </p>
                  <p><strong>Ton:</strong> {analysis.analysis.ton_detecte}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Objet principal</h3>
              <p className="bg-blue-50 p-3 rounded">{analysis.analysis.contenu?.objet_principal}</p>
            </div>

            {analysis.processing && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Traitement: {analysis.processing.steps.join(' → ')}</p>
                <p>Temps: {analysis.processing.totalTime}ms</p>
              </div>
            )}
          </div>

          {/* 3 Réponses générées */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Icon name="mail" size={24} className="mr-2" />
              3 Réponses générées
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Version courte */}
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedResponse === 'version_courte' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`} onClick={() => selectResponse('version_courte')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-600">Courte</h3>
                  <Icon name="check" size={20} className={selectedResponse === 'version_courte' ? 'text-green-600' : 'text-gray-300'} />
                </div>
                <p className="text-sm text-gray-600 mb-3">Directe et efficace</p>
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium text-sm mb-2">Objet: {analysis.responses.version_courte?.objet}</p>
                  <p className="text-sm text-gray-700 line-clamp-4">{analysis.responses.version_courte?.corps}</p>
                </div>
              </div>

              {/* Version standard */}
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedResponse === 'version_standard' 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`} onClick={() => selectResponse('version_standard')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-600">Standard</h3>
                  <Icon name="check" size={20} className={selectedResponse === 'version_standard' ? 'text-blue-600' : 'text-gray-300'} />
                </div>
                <p className="text-sm text-gray-600 mb-3">Équilibrée et professionnelle</p>
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium text-sm mb-2">Objet: {analysis.responses.version_standard?.objet}</p>
                  <p className="text-sm text-gray-700 line-clamp-4">{analysis.responses.version_standard?.corps}</p>
                </div>
              </div>

              {/* Version détaillée */}
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedResponse === 'version_detaillee' 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`} onClick={() => selectResponse('version_detaillee')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-600">Détaillée</h3>
                  <Icon name="check" size={20} className={selectedResponse === 'version_detaillee' ? 'text-purple-600' : 'text-gray-300'} />
                </div>
                <p className="text-sm text-gray-600 mb-3">Complète et argumentée</p>
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium text-sm mb-2">Objet: {analysis.responses.version_detaillee?.objet}</p>
                  <p className="text-sm text-gray-700 line-clamp-4">{analysis.responses.version_detaillee?.corps}</p>
                </div>
              </div>
            </div>

            {/* Recommandation IA */}
            {analysis.responses.recommandation && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center mb-2">
                  <Icon name="sparkles" size={20} className="text-yellow-600 mr-2" />
                  <h3 className="font-medium text-yellow-800">Recommandation IA</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  Version recommandée: <strong>{analysis.responses.recommandation.replace('version_', '')}</strong>
                </p>
                <p className="text-sm text-yellow-600 mt-1">{analysis.responses.justification}</p>
              </div>
            )}

            {/* Bouton d'envoi */}
            {selectedResponse && (
              <div className="text-center mt-6">
                <button
                  onClick={sendSelectedResponse}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center mx-auto transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <Icon name="send" size={20} className="mr-2" />
                  Envoyer cette réponse
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IAAnalysis;
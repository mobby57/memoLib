import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  PaperAirplaneIcon, 
  SparklesIcon, 
  MicrophoneIcon,
  DocumentTextIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

import { apiService } from '../services/apiService';

const EmailComposer = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    content: '',
    provider: 'smtp',
    ai_enhance: false
  });
  const [isListening, setIsListening] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const contentRef = useRef(null);

  // Mutations
  const sendEmailMutation = useMutation({
    mutationFn: apiService.sendEmail,
    onSuccess: (data) => {
      toast.success('Email envoyé avec succès!');
      setFormData({
        to: '',
        subject: '',
        content: '',
        provider: 'smtp',
        ai_enhance: false
      });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.response?.data?.detail || error.message}`);
    }
  });

  const generateContentMutation = useMutation({
    mutationFn: ({ prompt, context }) => apiService.generateContent(prompt, context),
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, content: data.content }));
      toast.success('Contenu généré par IA!');
      setShowAIPanel(false);
    },
    onError: (error) => {
      toast.error('Erreur de génération IA');
    }
  });

  const enhanceContentMutation = useMutation({
    mutationFn: (content) => apiService.enhanceEmail(content),
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, content: data.content }));
      toast.success('Contenu amélioré!');
    },
    onError: (error) => {
      toast.error("Erreur d'amélioration");
    }
  });

  const voiceMutation = useMutation({
    mutationFn: apiService.speechToText,
    onSuccess: (data) => {
      if (data.success && data.text) {
        setFormData(prev => ({ 
          ...prev, 
          content: prev.content + ' ' + data.text 
        }));
        toast.success('Texte ajouté par reconnaissance vocale!');
      }
    },
    onError: (error) => {
      toast.error('Erreur de reconnaissance vocale');
    }
  });

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.to || !formData.subject || !formData.content) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    sendEmailMutation.mutate(formData);
  };

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) {
      toast.error('Veuillez saisir une demande');
      return;
    }

    const context = {
      recipient: formData.to,
      subject: formData.subject
    };

    generateContentMutation.mutate({ prompt: aiPrompt, context });
  };

  const handleEnhanceContent = () => {
    if (!formData.content.trim()) {
      toast.error('Aucun contenu à améliorer');
      return;
    }

    enhanceContentMutation.mutate(formData.content);
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      // Stop listening
      try {
        await apiService.stopVoiceListening();
        setIsListening(false);
        toast.success('Écoute arrêtée');
      } catch (error) {
        toast.error("Erreur d'arrêt de l'écoute");
      }
    } else {
      // Start listening
      setIsListening(true);
      voiceMutation.mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Composer un Email
          </h1>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              IA
            </button>
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
                isListening 
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <MicrophoneIcon className="h-4 w-4 mr-2" />
              {isListening ? 'Arrêter' : 'Vocal'}
            </button>
          </div>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Assistant IA
            </h3>
            <div className="space-y-3">
              <div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Décrivez l'email que vous souhaitez générer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={generateContentMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  {generateContentMutation.isLoading ? 'Génération...' : 'Générer'}
                </button>
                <button
                  type="button"
                  onClick={handleEnhanceContent}
                  disabled={enhanceContentMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  {enhanceContentMutation.isLoading ? 'Amélioration...' : 'Améliorer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                Destinataire *
              </label>
              <input
                type="email"
                id="to"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="destinataire@example.com"
              />
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                Provider Email
              </label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="aws_ses">AWS SES</option>
                <option value="gmail">Gmail</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Sujet *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Sujet de l'email"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Contenu *
            </label>
            <textarea
              id="content"
              name="content"
              ref={contentRef}
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={10}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contenu de l'email..."
            />
          </div>

          <div className="flex items-center">
            <input
              id="ai_enhance"
              name="ai_enhance"
              type="checkbox"
              checked={formData.ai_enhance}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ai_enhance" className="ml-2 block text-sm text-gray-900">
              Améliorer automatiquement avec l'IA avant envoi
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendEmailMutation.isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              {sendEmailMutation.isLoading ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailComposer;
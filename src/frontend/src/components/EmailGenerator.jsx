import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailGenerator = () => {
  const [formData, setFormData] = useState({
    subject: '',
    context: '',
    tone: 'professional',
    language: 'fr'
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Generation failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Email generated successfully!');
      setFormData(prev => ({ ...prev, generatedContent: data.content }));
    },
    onError: () => {
      toast.error('Failed to generate email');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    generateMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Email Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Context</label>
              <textarea
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what you want to communicate..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Generate Email
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
          {formData.generatedContent ? (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                {formData.generatedContent}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500 italic">Generated email will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailGenerator;
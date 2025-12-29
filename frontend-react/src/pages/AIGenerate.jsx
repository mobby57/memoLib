import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AIGenerate = () => {
  const [formData, setFormData] = useState({
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
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Email generated!');
      setFormData(prev => ({ ...prev, result: data.content }));
    },
    onError: () => toast.error('Generation failed')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    generateMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">AI Email Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Context</label>
              <textarea
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                className="w-full p-3 border rounded-lg h-32"
                placeholder="Describe what you want to communicate..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
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
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Generate Email
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
          {formData.result ? (
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
              {formData.result}
            </pre>
          ) : (
            <p className="text-gray-500 italic">Generated email will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGenerate;
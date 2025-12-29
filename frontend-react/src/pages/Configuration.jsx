import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Configuration = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    emailProvider: 'smtp',
    language: 'fr',
    theme: 'light'
  });

  const handleSave = () => {
    toast.success('Configuration saved!');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Configuration</h1>
      
      <div className="max-w-2xl bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold">System Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full p-3 border rounded-lg"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Provider</label>
            <select
              value={config.emailProvider}
              onChange={(e) => setConfig(prev => ({ ...prev, emailProvider: e.target.value }))}
              className="w-full p-3 border rounded-lg"
            >
              <option value="smtp">SMTP</option>
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Language</label>
              <select
                value={config.language}
                onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-3 border rounded-lg"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={config.theme}
                onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full p-3 border rounded-lg"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
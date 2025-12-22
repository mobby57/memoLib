import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, TestTube, Plus, Mail, Settings } from 'lucide-react';

const SMTPManager = () => {
  const [configs, setConfigs] = useState([]);
  const [providers, setProviders] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    provider: '',
    username: '',
    password: '',
    display_name: '',
    smtp_server: '',
    smtp_port: 587,
    use_tls: true
  });

  useEffect(() => {
    loadConfigs();
    loadProviders();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/smtp/configs');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs);
      }
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des configurations');
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/smtp/providers');
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des providers');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProviderChange = (provider) => {
    const providerConfig = providers[provider];
    setFormData({
      ...formData,
      provider,
      smtp_server: providerConfig?.smtp_server || '',
      smtp_port: providerConfig?.smtp_port || 587,
      use_tls: providerConfig?.use_tls || true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/smtp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Configuration SMTP ajoutée avec succès');
        setShowAddForm(false);
        setFormData({
          provider: '',
          username: '',
          password: '',
          display_name: '',
          smtp_server: '',
          smtp_port: 587,
          use_tls: true
        });
        loadConfigs();
      } else {
        showMessage('error', data.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      showMessage('error', 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (username) => {
    setLoading(true);
    try {
      const response = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      showMessage(
        data.success ? 'success' : 'error',
        data.success ? 'Connexion SMTP réussie ✅' : `Erreur: ${data.error}`
      );
    } catch (error) {
      showMessage('error', 'Erreur lors du test');
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (username) => {
    if (!confirm('Supprimer cette configuration SMTP ?')) return;

    try {
      const response = await fetch(`/api/smtp/config/${username}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Configuration supprimée');
        loadConfigs();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de la suppression');
    }
  };

  const useWizard = async () => {
    const email = prompt('Votre adresse email:');
    const password = prompt('Votre mot de passe d\'application:');
    
    if (!email || !password) return;

    const provider = email.includes('@gmail.com') ? 'gmail' : 
                    email.includes('@outlook.com') || email.includes('@hotmail.com') ? 'outlook' :
                    email.includes('@yahoo.com') ? 'yahoo' : 'custom';

    setLoading(true);
    try {
      const response = await fetch('/api/smtp/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email,
          password,
          display_name: email.split('@')[0],
          test_connection: true
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Configuration automatique réussie ! 🎉');
        loadConfigs();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Erreur assistant de configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gestion SMTP
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message.text && (
            <Alert className={`mb-4 ${message.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter SMTP
            </Button>
            <Button onClick={useWizard} variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Assistant Auto
            </Button>
          </div>

          {showAddForm && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Provider</label>
                      <Select value={formData.provider} onValueChange={handleProviderChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(providers).map(([key, provider]) => (
                            <SelectItem key={key} value={key}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        type="email"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mot de passe</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Mot de passe d'application"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom d'affichage</label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  {formData.provider === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Serveur SMTP</label>
                        <Input
                          value={formData.smtp_server}
                          onChange={(e) => setFormData({...formData, smtp_server: e.target.value})}
                          placeholder="smtp.example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Port</label>
                        <Input
                          type="number"
                          value={formData.smtp_port}
                          onChange={(e) => setFormData({...formData, smtp_port: parseInt(e.target.value)})}
                          placeholder="587"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Ajout...' : 'Ajouter Configuration'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {configs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucune configuration SMTP. Utilisez l'assistant auto pour commencer ! 🚀
              </p>
            ) : (
              configs.map((config) => (
                <Card key={config.username} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{config.display_name || config.username}</h3>
                        <p className="text-sm text-gray-600">{config.username}</p>
                        <p className="text-xs text-gray-500">
                          {providers[config.provider]?.name} • {config.smtp_server}:{config.smtp_port}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(config.username)}
                          disabled={loading}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteConfig(config.username)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPManager;
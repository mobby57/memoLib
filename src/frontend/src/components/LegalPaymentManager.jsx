import React, { useState } from 'react';
import { Upload, Download, Eye, Send, FileText, AlertTriangle } from 'lucide-react';

const LegalPaymentManager = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [previews, setPreviews] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setPreviews(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/legal/template', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_delais_paiement.xlsx';
        a.click();
      }
    } catch (error) {
      console.error('Erreur téléchargement template:', error);
    }
  };

  const previewEmails = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/legal/preview-emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setPreviews(data);
      }
    } catch (error) {
      console.error('Erreur preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEmails = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/legal/import-excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Erreur traitement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'normal': 'text-green-600 bg-green-100',
      'rappel': 'text-yellow-600 bg-yellow-100',
      'urgent': 'text-orange-600 bg-orange-100',
      'mise_en_demeure': 'text-red-600 bg-red-100'
    };
    return colors[urgency] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FileText className="mr-2" />
          Gestion Délais de Paiement - Cabinet d'Avocat
        </h2>

        {/* Template Download */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">1. Télécharger le template Excel</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="mr-2 w-4 h-4" />
            Template Excel
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Colonnes: nom_client, email, montant, date_facture, delai_jours, type_affaire, statut
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">2. Importer votre fichier Excel</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center px-4 py-2 bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700">
              <Upload className="mr-2 w-4 h-4" />
              Choisir fichier
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {file && (
              <span className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {file && (
          <div className="mb-6 flex space-x-4">
            <button
              onClick={previewEmails}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              <Eye className="mr-2 w-4 h-4" />
              {loading ? 'Chargement...' : 'Prévisualiser'}
            </button>
            
            <button
              onClick={processEmails}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="mr-2 w-4 h-4" />
              {loading ? 'Traitement...' : 'Générer Emails'}
            </button>
          </div>
        )}

        {/* Preview Results */}
        {previews && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center">
              <Eye className="mr-2" />
              Prévisualisation ({previews.total_clients} clients)
            </h3>
            <div className="space-y-3">
              {previews.previews.map((preview, index) => (
                <div key={index} className="p-3 bg-white rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{preview.client}</h4>
                      <p className="text-sm text-gray-600">{preview.subject}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(preview.urgency)}`}>
                        {preview.urgency.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">
                        {preview.amount > 0 ? '+' : ''}{preview.amount}€
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {preview.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Results */}
        {results && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center">
              <Send className="mr-2" />
              Résultats du traitement
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                <div className="text-sm text-gray-600">Clients traités</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-green-600">{results.generated}</div>
                <div className="text-sm text-gray-600">Emails générés</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                <div className="text-sm text-gray-600">Erreurs</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2 flex items-center">
                  <AlertTriangle className="mr-2 w-4 h-4" />
                  Erreurs rencontrées:
                </h4>
                <div className="space-y-1">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>{error.client}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Emails Summary */}
            {results.emails && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Emails générés par urgence:</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['normal', 'rappel', 'urgent', 'mise_en_demeure'].map(urgency => {
                    const count = results.emails.filter(email => email.urgency === urgency).length;
                    return (
                      <div key={urgency} className={`p-2 rounded text-center ${getUrgencyColor(urgency)}`}>
                        <div className="font-bold">{count}</div>
                        <div className="text-xs">{urgency.replace('_', ' ')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalPaymentManager;
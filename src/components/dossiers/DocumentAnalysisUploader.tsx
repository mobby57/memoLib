'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';

interface Deadline {
  type: string;
  date: string;
  description: string;
  priority: string;
  daysRemaining?: number;
}

interface AnalysisResult {
  deadlines: Deadline[];
  parties: string[];
  typeAffaire: string;
  resume: string;
  documentsManquants?: string[];
}

interface DocumentAnalysisUploaderProps {
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
}

export default function DocumentAnalysisUploader({ onAnalysisComplete }: DocumentAnalysisUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // Verifier le type de fichier
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Type de fichier non supporte. Utilisez PDF, DOC, DOCX ou TXT.');
      return;
    }

    // Lancer l'analyse automatique
    await analyzeDocument(selectedFile);
  };

  const analyzeDocument = async (fileToAnalyze: File) => {
    setAnalyzing(true);
    setError(null);

    try {
      // Lire le contenu du fichier
      const text = await readFileContent(fileToAnalyze);

      // Appeler l'API d'analyse
      const response = await fetch('/api/dossiers/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentContent: text,
          documentType: fileToAnalyze.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse du document');
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        
        // Notifier le parent
        if (onAnalysisComplete) {
          onAnalysisComplete(data.analysis);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsText(file);
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HAUTE':
        return 'text-red-600 bg-red-50';
      case 'MOYENNE':
        return 'text-orange-600 bg-orange-50';
      case 'BASSE':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AUDIENCE':
        return <Calendar className="w-4 h-4" />;
      case 'DEPOT':
        return <Upload className="w-4 h-4" />;
      case 'PRESCRIPTION':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="document-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Deposez un document ou cliquez pour parcourir
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX ou TXT - L'IA extraira automatiquement les delais
          </p>
        </label>
      </div>

      {/* Fichier selectionne */}
      {file && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">{file.name}</p>
            <p className="text-xs text-blue-600">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Analyse en cours */}
      {analyzing && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-sm text-blue-900">
            Analyse du document en cours... L'IA extrait les delais et informations cles.
          </p>
        </div>
      )}

      {/* Resultats de l'analyse */}
      {analysis && !analyzing && (
        <div className="space-y-4">
          {/* En-tete */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Analyse terminee</p>
              <p className="text-sm text-green-700 mt-1">{analysis.resume}</p>
            </div>
          </div>

          {/* Informations generales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Type d'affaire</p>
              <p className="text-sm font-medium text-gray-900">{analysis.typeAffaire}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Parties identifiees</p>
              <p className="text-sm font-medium text-gray-900">
                {analysis.parties.length > 0 ? analysis.parties.join(', ') : 'Aucune'}
              </p>
            </div>
          </div>

          {/* Delais extraits */}
          {analysis.deadlines.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Delais automatiquement detectes ({analysis.deadlines.length})
              </h4>
              <div className="space-y-2">
                {analysis.deadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      deadline.priority === 'HAUTE'
                        ? 'border-red-200 bg-red-50'
                        : deadline.priority === 'MOYENNE'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTypeIcon(deadline.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {deadline.type}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(deadline.priority)}`}>
                              {deadline.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {deadline.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span> {new Date(deadline.date).toLocaleDateString('fr-FR')}</span>
                            {deadline.daysRemaining !== undefined && (
                              <span className={
                                deadline.daysRemaining < 7
                                  ? 'text-red-600 font-medium'
                                  : deadline.daysRemaining < 30
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                              }>
                                 {deadline.daysRemaining > 0 
                                  ? `${deadline.daysRemaining} jours restants`
                                  : `Depasse de ${Math.abs(deadline.daysRemaining)} jours`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents manquants */}
          {analysis.documentsManquants && analysis.documentsManquants.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                ️ Documents potentiellement manquants
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                {analysis.documentsManquants.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setFile(null);
                setAnalysis(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Analyser un autre document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

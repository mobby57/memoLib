'use client';

/**
 * Composant d'extraction automatique de délais par IA
 * Permet d'uploader un document ou coller du texte pour extraire les échéances
 */

import { useState } from 'react';
import { Upload, FileText, Calendar, AlertCircle, CheckCircle2, Loader2, Trash2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { Modal } from '@/components/forms';
import { useToast } from '@/components/ui';

interface ExtractedDeadline {
  type: string;
  titre: string;
  description?: string;
  dateEcheance: Date | string;
  dateReference?: Date | string;
  delaiJours?: number;
  priorite: 'critique' | 'haute' | 'normale' | 'basse';
  aiConfidence: number;
  extractedText: string;
  metadata?: any;
}

interface DeadlineExtractorProps {
  dossierId: string;
  onDeadlinesExtracted?: (deadlines: ExtractedDeadline[]) => void;
  onDeadlinesSaved?: (savedDeadlines: any[]) => void;
}

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  delai_recours_contentieux: 'Recours contentieux',
  delai_recours_gracieux: 'Recours gracieux',
  audience: 'Audience',
  depot_memoire: 'Dépôt mémoire',
  reponse_prefecture: 'Réponse préfecture',
  expiration_titre: 'Expiration titre',
  oqtf_execution: 'Exécution OQTF',
  prescription: 'Prescription',
  convocation: 'Convocation',
  autre: 'Autre'
};

const PRIORITY_COLORS: Record<string, string> = {
  critique: 'bg-red-100 text-red-800 border-red-300',
  haute: 'bg-orange-100 text-orange-800 border-orange-300',
  normale: 'bg-blue-100 text-blue-800 border-blue-300',
  basse: 'bg-gray-100 text-gray-800 border-gray-300'
};

export default function DeadlineExtractor({
  dossierId,
  onDeadlinesExtracted,
  onDeadlinesSaved
}: DeadlineExtractorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedDeadlines, setExtractedDeadlines] = useState<ExtractedDeadline[]>([]);
  const [selectedDeadlines, setSelectedDeadlines] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        addToast({
          title: 'Erreur',
          message: 'Type de fichier non supporté. Utilisez PDF, DOCX ou TXT.',
          variant: 'error',
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (mode === 'file' && !file) {
      addToast({ title: 'Erreur', message: 'Veuillez sélectionner un fichier', variant: 'error' });
      return;
    }

    if (mode === 'text' && !text.trim()) {
      addToast({ title: 'Erreur', message: 'Veuillez entrer du texte', variant: 'error' });
      return;
    }

    setExtracting(true);
    setExtractedDeadlines([]);
    setSelectedDeadlines(new Set());

    try {
      const formData = new FormData();
      
      if (mode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      formData.append('autoSave', 'false'); // Ne pas sauvegarder automatiquement

      const response = await fetch(`/api/dossiers/${dossierId}/extract-deadlines`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur extraction');
      }

      setExtractedDeadlines(result.deadlines || []);
      
      // Sélectionner tous les délais par défaut
      setSelectedDeadlines(new Set(result.deadlines.map((_: any, i: number) => i)));

      if (result.deadlines.length === 0) {
        addToast({
          title: 'Attention',
          message: 'Aucun délai trouvé dans ce document',
          variant: 'warning',
        });
      } else {
        addToast({
          title: 'Succès',
          message: `${result.deadlines.length} délai(s) extrait(s) avec succès`,
          variant: 'success',
        });
        onDeadlinesExtracted?.(result.deadlines);
      }

    } catch (error: any) {
      console.error('Erreur extraction:', error);
      addToast({
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'extraction',
        variant: 'error',
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveDeadlines = async () => {
    if (selectedDeadlines.size === 0) {
      addToast({ title: 'Erreur', message: 'Veuillez sélectionner au moins un délai', variant: 'error' });
      return;
    }

    setSaving(true);

    try {
      const deadlinesToSave = Array.from(selectedDeadlines).map(index => extractedDeadlines[index]);

      const response = await fetch(`/api/dossiers/${dossierId}/echeances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlines: deadlinesToSave })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur sauvegarde');
      }

      addToast({
        title: 'Succès',
        message: `${selectedDeadlines.size} délai(s) ajouté(s) au dossier`,
        variant: 'success',
      });

      onDeadlinesSaved?.(result.saved || []);
      
      // Fermer le modal
      setIsOpen(false);
      resetForm();

    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      addToast({
        title: 'Erreur',
        message: error.message || 'Erreur lors de la sauvegarde',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDeadlineSelection = (index: number) => {
    const newSelection = new Set(selectedDeadlines);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedDeadlines(newSelection);
  };

  const resetForm = () => {
    setFile(null);
    setText('');
    setExtractedDeadlines([]);
    setSelectedDeadlines(new Set());
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Calendar className="w-4 h-4" />
        Extraire délais (IA)
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Extraction automatique des délais"
        size="xl"
      >
        <div className="space-y-6">
          {/* Mode selection */}
          <div className="flex gap-4 border-b pb-4">
            <button
              onClick={() => setMode('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                mode === 'file'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent'
              }`}
            >
              <Upload className="w-4 h-4" />
              Uploader un fichier
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                mode === 'text'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              Coller du texte
            </button>
          </div>

          {/* File upload */}
          {mode === 'file' && (
            <div className="space-y-2">
              <label htmlFor="document-file" className="block text-sm font-medium text-gray-700">
                Document à analyser (PDF, DOCX, TXT)
              </label>
              <input
                id="document-file"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
              {file && (
                <p className="text-sm text-gray-600">
                  Fichier sélectionné: {file.name}
                </p>
              )}
            </div>
          )}

          {/* Text input */}
          {mode === 'text' && (
            <div className="space-y-2">
              <label htmlFor="document-text" className="block text-sm font-medium text-gray-700">
                Texte du document
              </label>
              <textarea
                id="document-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder="Collez ici le texte de la décision administrative, OQTF, convocation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={extracting || (mode === 'file' && !file) || (mode === 'text' && !text.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {extracting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                Analyser le document
              </>
            )}
          </button>

          {/* Results */}
          {extractedDeadlines.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Délais extraits ({extractedDeadlines.length})
                </h3>
                <button
                  onClick={() => {
                    if (selectedDeadlines.size === extractedDeadlines.length) {
                      setSelectedDeadlines(new Set());
                    } else {
                      setSelectedDeadlines(new Set(extractedDeadlines.map((_, i) => i)));
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedDeadlines.size === extractedDeadlines.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {extractedDeadlines.map((deadline, index) => (
                  <Card
                    key={index}
                    className={`p-4 cursor-pointer transition ${
                      selectedDeadlines.has(index)
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleDeadlineSelection(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {selectedDeadlines.has(index) ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">{deadline.titre}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${PRIORITY_COLORS[deadline.priorite]}`}>
                            {deadline.priorite}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <span className="ml-2 text-gray-900">
                              {DEADLINE_TYPE_LABELS[deadline.type] || deadline.type}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Échéance:</span>
                            <span className="ml-2 text-gray-900 font-medium">
                              {formatDate(deadline.dateEcheance)}
                            </span>
                          </div>
                          {deadline.delaiJours && (
                            <div>
                              <span className="text-gray-600">Délai:</span>
                              <span className="ml-2 text-gray-900">
                                {deadline.delaiJours} jour(s)
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Confiance IA:</span>
                            <span className={`ml-2 font-medium ${getConfidenceColor(deadline.aiConfidence)}`}>
                              {(deadline.aiConfidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {deadline.description && (
                          <p className="text-sm text-gray-700">{deadline.description}</p>
                        )}

                        <details className="text-xs">
                          <summary className="text-gray-600 cursor-pointer hover:text-gray-800">
                            Texte source
                          </summary>
                          <p className="mt-2 p-2 bg-gray-50 rounded text-gray-700 italic">
                            "{deadline.extractedText}"
                          </p>
                        </details>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveDeadlines}
                disabled={saving || selectedDeadlines.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Ajouter {selectedDeadlines.size} délai(s) au dossier
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Analyse automatique par IA</p>
                <p>
                  L'IA analyse le document pour extraire automatiquement tous les délais (recours, audiences, prescriptions...).
                  Vérifiez toujours les résultats avant de les enregistrer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

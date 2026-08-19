'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, Scale, FileCheck, Gavel, BookOpen, MessageSquare } from 'lucide-react';

interface DocxTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredVars: string[];
  optionalVars: string[];
}

interface Props {
  dossierId?: string;
  clientNom?: string;
  dossierTitre?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  recours: Scale,
  contentieux: Gavel,
  courrier: MessageSquare,
  attestation: FileCheck,
};

const CATEGORY_COLORS: Record<string, string> = {
  recours: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  contentieux: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
  courrier: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  attestation: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
};

const VAR_LABELS: Record<string, string> = {
  requerantNom: 'Nom du requérant',
  requerantAdresse: 'Adresse du requérant',
  requerantMatricule: 'Matricule',
  defendeurNom: 'Partie adverse',
  defendeurAdresse: 'Adresse adverse',
  juridiction: 'Juridiction',
  objet: 'Objet du recours',
  dateDecision: 'Date de la décision attaquée',
  dateNotification: 'Date de notification',
  delaiLegal: 'Délai légal (ex: quarante jours)',
  baseLegale: 'Base légale',
  dateDepot: 'Date de dépôt',
  lieu: 'Lieu',
  avocat: 'Avocat / Signataire',
  cabinet: 'Cabinet',
  numeroDossier: 'N° dossier',
  demandeurNom: 'Demandeur',
  demandeurQualite: 'Qualité du demandeur',
  defendeurQualite: 'Qualité du défendeur',
  chambre: 'Chambre',
  numeroRG: 'N° RG',
  barreau: 'Barreau',
};

export function DocxDocumentGenerator({ dossierId, clientNom, dossierTitre }: Props) {
  const [templates, setTemplates] = useState<DocxTemplate[]>([]);
  const [selected, setSelected] = useState<DocxTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Charger les templates au premier rendu
  const loadTemplates = async () => {
    if (templates.length > 0) return;
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/documents/generate-docx');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setError('Impossible de charger les templates');
    }
    setLoadingTemplates(false);
  };

  const selectTemplate = (template: DocxTemplate) => {
    setSelected(template);
    setError(null);
    setSuccess(false);
    // Pré-remplir avec les données du dossier
    const prefilled: Record<string, string> = {};
    if (clientNom) {
      prefilled.requerantNom = clientNom;
      prefilled.demandeurNom = clientNom;
    }
    if (dossierTitre) {
      prefilled.objet = dossierTitre;
    }
    prefilled.date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    setVariables(prefilled);
  };

  const generateDocx = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/documents/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selected.id,
          dossierId,
          variables,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur de génération');
      }

      // Télécharger le fichier
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || `${selected.id}.docx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // État initial : bouton pour charger
  if (templates.length === 0 && !loadingTemplates) {
    return (
      <button
        onClick={loadTemplates}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
      >
        <BookOpen className="w-4 h-4" />
        Générer un document DOCX avancé
      </button>
    );
  }

  if (loadingTemplates) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des templates...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sélection du template */}
      {!selected && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Documents juridiques avancés (DOCX)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((t) => {
              const Icon = CATEGORY_ICONS[t.category] || FileText;
              const colorClass = CATEGORY_COLORS[t.category] || 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
              return (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${colorClass}`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs opacity-75 mt-0.5">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulaire de variables */}
      {selected && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">{selected.title}</h4>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Changer de template
            </button>
          </div>

          {/* Variables obligatoires */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Champs requis</p>
            {selected.requiredVars.map((v) => (
              <div key={v}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {VAR_LABELS[v] || v} <span className="text-red-400">*</span>
                </label>
                {v === 'objet' ? (
                  <textarea
                    value={variables[v] || ''}
                    onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                    placeholder={VAR_LABELS[v]}
                  />
                ) : (
                  <input
                    type="text"
                    value={variables[v] || ''}
                    onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                    placeholder={VAR_LABELS[v]}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Variables optionnelles (collapsible) */}
          {selected.optionalVars.length > 0 && (
            <details className="group">
              <summary className="text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700">
                Champs optionnels ({selected.optionalVars.length})
              </summary>
              <div className="mt-3 space-y-3">
                {selected.optionalVars.map((v) => (
                  <div key={v}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {VAR_LABELS[v] || v}
                    </label>
                    <input
                      type="text"
                      value={variables[v] || ''}
                      onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                      placeholder={VAR_LABELS[v]}
                    />
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Erreur */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Succès */}
          {success && (
            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Document DOCX téléchargé avec succès
            </p>
          )}

          {/* Bouton générer */}
          <button
            onClick={generateDocx}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {loading ? 'Génération en cours...' : 'Générer et télécharger le DOCX'}
          </button>
        </div>
      )}
    </div>
  );
}

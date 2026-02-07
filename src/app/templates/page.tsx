'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/forms/Button';
import { Modal } from '@/components/forms/Modal';
import { Input } from '@/components/forms/Input';
import { Alert } from '@/components/ui/Alert';
import {
  DocumentTemplate,
  DEFAULT_TEMPLATES,
  renderTemplate,
  extractVariables,
  validateTemplate,
  getDefaultValues,
  GLOBAL_VARIABLES,
  CLIENT_VARIABLES,
  DOSSIER_VARIABLES,
  formatValue
} from '@/lib/templates/templateEngine';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(
    DEFAULT_TEMPLATES.map((t, i) => ({
      ...t,
      id: `template-${i}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handlePreview = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setPreviewValues(getDefaultValues());
    setIsPreviewModalOpen(true);
  };

  const handleDuplicate = (template: DocumentTemplate) => {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      nom: `${template.nom} (copie)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce template ?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryCounts = templates.reduce((acc, t) => {
    acc[t.categorie] = (acc[t.categorie] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryColor = (categorie: string) => {
    const colors: Record<string, string> = {
      contrat: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      courrier: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      mise_en_demeure: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      attestation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      autre: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[categorie] || colors.autre;
  };

  const getCategoryLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      contrat: 'Contrat',
      courrier: 'Courrier',
      mise_en_demeure: 'Mise en demeure',
      attestation: 'Attestation',
      autre: 'Autre'
    };
    return labels[categorie] || categorie;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tete */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Templates de Documents
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Creez et gerez vos modeles de documents personnalisables
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {templates.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Templates total
          </div>
        </Card>
        {Object.entries(categoryCounts).map(([cat, count]) => (
          <Card key={cat} className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {count}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getCategoryLabel(cat)}
            </div>
          </Card>
        ))}
      </div>

      <Alert variant="info" className="mb-6">
        Les templates utilisent des variables dynamiques comme <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm">{"{{client_nom}}"}</code> qui sont automatiquement remplacees lors de la generation.
      </Alert>

      {/* Barre d'actions */}
      <div className="flex items-center gap-4 mb-6">
        <Input
          type="text"
          placeholder="Rechercher un template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      {/* Liste des templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.categorie)}`}>
                  {getCategoryLabel(template.categorie)}
                </span>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {template.nom}
            </h3>

            {template.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {template.description}
              </p>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {template.variables.length} variable(s) disponible(s)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreview(template)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Apercu
              </button>
              <button
                onClick={() => handleDuplicate(template)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Dupliquer"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Aucun template trouve' : 'Aucun template disponible'}
          </p>
        </div>
      )}

      {/* Modal de previsualisation */}
      {selectedTemplate && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Apercu: ${selectedTemplate.nom}`}
        >
          <div className="space-y-4">
            {/* Formulaire de variables */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Variables personnalisables</h3>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {[...GLOBAL_VARIABLES, ...CLIENT_VARIABLES, ...DOSSIER_VARIABLES]
                  .filter(v => selectedTemplate.contenu.includes(`{{${v.key}}}`))
                  .map(variable => (
                    <div key={variable.key}>
                      <label className="block text-sm font-medium mb-1">
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input
                        type={variable.type === 'date' ? 'text' : variable.type}
                        value={previewValues[variable.key] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [variable.key]: e.target.value
                        })}
                        placeholder={variable.description}
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Apercu du document */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3">Apercu du document</h3>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {renderTemplate(selectedTemplate.contenu, previewValues)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsPreviewModalOpen(false)}>
                Fermer
              </Button>
              <Button onClick={() => {
                // Ici on pourrait copier dans le presse-papier ou telecharger
                navigator.clipboard.writeText(renderTemplate(selectedTemplate.contenu, previewValues));
                alert('Document copie dans le presse-papier !');
              }}>
                Copier le document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

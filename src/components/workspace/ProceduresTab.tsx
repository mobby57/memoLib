'use client';

import { FileText, CheckCircle2, Clock, AlertTriangle, Calendar, Plus } from 'lucide-react';

interface Procedure {
  id: string;
  procedureType: string;
  title: string;
  description?: string;
  reference?: string;
  status: string;
  urgencyLevel: string;
  notificationDate?: string;
  deadlineDate?: string;
  assignedToId?: string;
  metadata?: string;
  checklist: any[];
  documents: any[];
  echeances: any[];
  documentDrafts: any[];
  createdAt: string;
}

interface ProceduresTabProps {
  procedures: Procedure[];
  onRefresh: () => void;
}

export default function ProceduresTab({ procedures, onRefresh }: ProceduresTabProps) {
  const urgencyColors = {
    critique: 'bg-red-600 text-white border-red-600',
    eleve: 'bg-orange-500 text-white border-orange-500',
    moyen: 'bg-yellow-500 text-white border-yellow-500',
    faible: 'bg-green-500 text-white border-green-500',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  const procedureTypeLabels: Record<string, string> = {
    OQTF: 'OQTF',
    REFUS_TITRE: 'Refus Titre',
    RETRAIT_TITRE: 'Retrait Titre',
    ASILE: 'Asile Politique',
    REGROUPEMENT_FAMILIAL: 'Regroupement Familial',
    NATURALISATION: 'Naturalisation',
  };

  const calculateProgress = (checklist: any[]) => {
    if (!checklist || checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getDaysRemaining = (deadlineDate?: string) => {
    if (!deadlineDate) return null;
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton Nouvelle Procedure */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Procedures Juridiques</h3>
          <p className="text-sm text-gray-600 mt-1">{procedures.length} procedure(s) au total</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouvelle procedure</span>
        </button>
      </div>

      {/* Filtres rapides */}
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm font-medium">
          Toutes
        </button>
        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          En cours
        </button>
        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          Urgentes
        </button>
        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          Terminees
        </button>
      </div>

      {/* Liste des procedures */}
      <div className="grid grid-cols-1 gap-6">
        {procedures.map(proc => {
          const progress = calculateProgress(proc.checklist);
          const daysRemaining = getDaysRemaining(proc.deadlineDate);
          const metadata = proc.metadata ? JSON.parse(proc.metadata) : {};

          return (
            <div key={proc.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header Procedure */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${urgencyColors[proc.urgencyLevel as keyof typeof urgencyColors]}`}>
                        {procedureTypeLabels[proc.procedureType] || proc.procedureType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[proc.status as keyof typeof statusColors]}`}>
                        {proc.status === 'active' ? 'En cours' : proc.status === 'pending' ? 'En attente' : 'Termine'}
                      </span>
                      {proc.reference && (
                        <span className="text-sm text-gray-500">Ref: {proc.reference}</span>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{proc.title}</h4>
                    {proc.description && (
                      <p className="text-gray-600">{proc.description}</p>
                    )}
                  </div>

                  {/* Badge delai */}
                  {daysRemaining !== null && (
                    <div className={`px-4 py-2 rounded-lg text-center ${
                      daysRemaining < 0 ? 'bg-red-100 text-red-800' :
                      daysRemaining < 7 ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      <div className="text-2xl font-bold">
                        {Math.abs(daysRemaining)}
                      </div>
                      <div className="text-xs">
                        {daysRemaining < 0 ? 'jours depasses' : 'jours restants'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates importantes */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {proc.notificationDate && (
                    <div className="text-sm">
                      <p className="text-gray-500 mb-1">Notification</p>
                      <p className="font-medium text-gray-900">
                        {new Date(proc.notificationDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {proc.deadlineDate && (
                    <div className="text-sm">
                      <p className="text-gray-500 mb-1">echeance</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(proc.deadlineDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="text-gray-500 mb-1">Cree le</p>
                    <p className="font-medium text-gray-900">
                      {new Date(proc.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Metadonnees CESDA */}
                {Object.keys(metadata).length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Details procedure</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {metadata.oqtfType && (
                        <div>
                          <span className="text-gray-600">Type OQTF:</span>{' '}
                          <span className="font-medium text-gray-900">{metadata.oqtfType}</span>
                        </div>
                      )}
                      {metadata.juridiction && (
                        <div>
                          <span className="text-gray-600">Juridiction:</span>{' '}
                          <span className="font-medium text-gray-900">{metadata.juridiction}</span>
                        </div>
                      )}
                      {metadata.motifAsile && (
                        <div>
                          <span className="text-gray-600">Motif:</span>{' '}
                          <span className="font-medium text-gray-900">{metadata.motifAsile}</span>
                        </div>
                      )}
                      {metadata.articlesCeseda && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Articles CESEDA:</span>{' '}
                          <span className="font-medium text-gray-900">{metadata.articlesCeseda.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist & Progress */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Checklist ({proc.checklist.filter(i => i.completed).length}/{proc.checklist.length})
                  </h5>
                  <span className="text-sm font-medium text-gray-700">{progress}% complete</span>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress === 100 ? 'bg-green-600' :
                      progress >= 50 ? 'bg-blue-600' :
                      'bg-yellow-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Items checklist */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {proc.checklist.map((item: any) => (
                    <label key={item.id} className="flex items-start space-x-3 p-2 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        readOnly
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.required && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Requis
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer avec actions */}
              <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {proc.documents.length} documents
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {proc.echeances.length} echeances
                  </span>
                  {proc.documentDrafts.length > 0 && (
                    <span className="flex items-center text-purple-600">
                      <FileText className="w-4 h-4 mr-1" />
                      {proc.documentDrafts.length} brouillons IA
                    </span>
                  )}
                </div>

                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                  Voir details
                </button>
              </div>
            </div>
          );
        })}

        {procedures.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune procedure</p>
            <p className="text-sm mt-2">Creez une nouvelle procedure pour commencer</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Nouvelle procedure
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

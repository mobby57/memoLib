'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 *  Liste des Workspaces - Vue d'ensemble du raisonnement
 * Avec SWR pour auto-refresh temps reel
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkspaceReasoning, WORKSPACE_STATES, WorkspaceState } from '@/types/workspace-reasoning';
import { Plus, Search, Filter } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WorkspacesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<WorkspaceState | 'ALL'>('ALL');
  
  // SWR avec auto-refresh toutes les 10 secondes
  const { data, error, isLoading } = useSWR(
    `/api/lawyer/workspaces?type=reasoning&state=${filterState !== 'ALL' ? filterState : ''}`,
    fetcher,
    {
      refreshInterval: 10000, // 10 secondes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  const workspaces: WorkspaceReasoning[] = data?.workspaces || [];
  
  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = searchQuery === '' || 
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.sourceRaw.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterState === 'ALL' || w.currentState === filterState;
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl"></span>
                Workspaces de Raisonnement
              </h1>
              <p className="text-gray-600 mt-2">
                Moteur de raisonnement IA - {workspaces.length} workspace(s) actif(s)
              </p>
            </div>
            
            <button
              onClick={() => router.push('/lawyer/workspace/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau Workspace
            </button>
          </div>
          
          {/* Filters */}
          <div className="mt-6 flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* State filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value as WorkspaceState | 'ALL')}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="ALL">Tous les etats</option>
                <option value="RECEIVED"> Recu</option>
                <option value="FACTS_EXTRACTED"> Faits extraits</option>
                <option value="CONTEXT_IDENTIFIED"> Contexte identifie</option>
                <option value="OBLIGATIONS_DEDUCED"> Obligations deduites</option>
                <option value="MISSING_IDENTIFIED"> Manques identifies</option>
                <option value="RISK_EVALUATED">️ Risques evalues</option>
                <option value="ACTION_PROPOSED"> Action proposee</option>
                <option value="READY_FOR_HUMAN"> Pret pour humain</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">️ Erreur de chargement des workspaces</p>
            <p className="text-sm text-red-600 mt-1">Verifiez votre connexion internet</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4"></div>
            <p className="text-gray-600">Chargement des workspaces...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun workspace trouve
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterState !== 'ALL'
                ? 'Essayez de modifier vos filtres.'
                : 'Creez votre premier workspace de raisonnement.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceCard({ workspace }: { workspace: WorkspaceReasoning }) {
  const stateConfig = WORKSPACE_STATES[workspace.currentState];
  
  return (
    <Link href={`/lawyer/workspace/${workspace.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stateConfig.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Workspace #{workspace.id.slice(0, 8)}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {workspace.sourceType} - {new Date(workspace.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          {/* etat actuel */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${stateConfig.color}-100 text-${stateConfig.color}-700`}>
            {stateConfig.label}
          </div>
        </div>
        
        {/* Apercu du message */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-sm text-gray-700 line-clamp-2">
            {workspace.sourceRaw}
          </p>
        </div>
        
        {/* Metadonnees */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span></span>
              {workspace.locked ? 'Verrouille' : 'En cours'}
            </span>
            <span>
              Incertitude : {Math.round(workspace.uncertaintyLevel * 100)}%
            </span>
          </div>
          
          {workspace.procedureType && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
              {workspace.procedureType}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

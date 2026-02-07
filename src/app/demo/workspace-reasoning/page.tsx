/**
 * Page de demonstration du Workspace Reasoning Engine
 * Test interactif du systeme MVP avec API reelle
 */

'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { WorkspaceReasoning, WorkspaceState } from '@/types/workspace-reasoning';
import { WorkspaceReasoningOrchestrator } from '@/components/workspace-reasoning/WorkspaceReasoningOrchestrator';
import { useWorkspaceReasoning, createWorkspace } from '@/hooks/useWorkspaceReasoning';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';

export default function WorkspaceReasoningDemoPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Hook pour gerer le workspace
  const { workspace, loading, error, transitionState, refetch } = useWorkspaceReasoning(workspaceId || '');
  
  // Creer le workspace de demonstration au chargement
  useEffect(() => {
    const initDemo = async () => {
      if (workspaceId) return; // Deja cree
      
      setIsCreating(true);
      setCreateError(null);
      
      try {
        const newWorkspace = await createWorkspace({
          sourceType: 'EMAIL',
          sourceId: 'demo-email-123',
          sourceRaw: `Objet: OQTF - Madame DUBOIS Sophie

Madame, Monsieur,

Je viens de recevoir une Obligation de Quitter le Territoire Francais (OQTF) datee du 15 janvier 2026. 

La notification indique que je dois quitter le territoire sous 30 jours. Je suis en France depuis 5 ans avec mes deux enfants scolarises.

Mon titre de sejour a expire il y a 3 mois et je n'ai pas pu le renouveler a temps pour des raisons medicales.

Pouvez-vous m'aider ?

Cordialement,
Sophie DUBOIS
06 12 34 56 78`,
          sourceMetadata: {
            from: 'sophie.dubois@email.com',
            subject: 'OQTF - Madame DUBOIS Sophie',
            receivedAt: '2026-01-20T10:30:00Z',
            channel: 'email'
          },
          procedureType: 'OQTF',
        });
        
        setWorkspaceId(newWorkspace.id);
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : 'Erreur de creation');
        console.error('Failed to create demo workspace:', err);
      } finally {
        setIsCreating(false);
      }
    };
    
    initDemo();
  }, [workspaceId]);
  
  // Workspace de demonstration initial (fallback)
  const fallbackWorkspace: WorkspaceReasoning = {
    id: 'loading',
    tenantId: 'demo-tenant',
    currentState: 'RECEIVED' as WorkspaceState,
    stateChangedAt: new Date(),
    stateChangedBy: 'SYSTEM',
    
    sourceType: 'EMAIL',
    sourceId: 'loading',
    sourceRaw: 'Loading...',
    sourceMetadata: '{}',
    
    procedureType: undefined,
    ownerUserId: 'demo-user',
    clientId: undefined,
    dossierId: undefined,
    emailId: undefined,
    
    reasoningQuality: 0.0,
    uncertaintyLevel: 1.0,
    confidenceScore: 0.0,
    
    locked: false,
    validatedBy: undefined,
    validatedAt: undefined,
    validationNote: undefined,
    
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: undefined,
    
    facts: [],
    contextHypotheses: [],
    obligations: [],
    missingElements: [],
    risks: [],
    proposedActions: [],
    reasoningTraces: [],
    transitions: [],
  };
  
  const handleStateChange = async (newState: WorkspaceState) => {
    if (!workspaceId) return;
    
    try {
      await transitionState(newState, `Transition vers ${newState}`);
    } catch (err) {
      alert(`Erreur de transition: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };
  
  const handleUpdate = async () => {
    if (!workspaceId) return;
    await refetch();
  };
  
  // Loading initial
  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Creation du workspace...</h2>
              <p className="text-gray-600 mt-1">Initialisation de la demonstration OQTF</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Erreur de creation
  if (createError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de creation</h2>
            <p className="text-red-600 mb-4">{createError}</p>
            <button
              onClick={() => {
                setCreateError(null);
                setWorkspaceId(null);
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reessayer
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Erreur de chargement
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <ToastProvider>
      <ErrorBoundary
        resetKeys={[workspaceId]}
        onError={(error, errorInfo) => {
          console.error('Workspace reasoning error:', error, errorInfo);
        }}
      >
        <div className="min-h-screen bg-gray-100">
          {loading && !workspace && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="text-gray-700 font-medium">Chargement...</span>
              </div>
            </div>
          )}
          
          <WorkspaceReasoningOrchestrator
            workspace={workspace || fallbackWorkspace}
            onStateChange={handleStateChange}
            onUpdate={handleUpdate}
            loading={typeof loading === 'object' ? loading : { workspace: !!loading }}
            onRefresh={refetch}
          />
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}


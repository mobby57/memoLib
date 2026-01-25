/**
 * Custom React Hook for Workspace Reasoning
 * 
 * Provides complete interface to workspace reasoning API with:
 * - Automatic data fetching and caching (SWR)
 * - Mutation functions for all operations
 * - Optimistic updates for instant UI feedback
 * - Loading and error state management
 * - Automatic revalidation after mutations
 * 
 * Usage:
 * ```tsx
 * const { 
 *   workspace, loading, error, 
 *   transitionState, addFact, confirmContext, 
 *   resolveMissing, executeAction, validateWorkspace 
 * } = useWorkspaceReasoning(workspaceId);
 * ```
 */

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import type { 
  WorkspaceReasoning, 
  WorkspaceState, 
  Fact, 
  ContextHypothesis,
  MissingElement,
  ProposedAction,
  FactSource,
  ActionType,
  ActionTarget,
  ActionPriority,
  ContextType,
  MissingType
} from '@/types/workspace-reasoning';
import { useToast } from '@/components/ui/Toast';
import { classifyError, createErrorFromResponse } from '@/lib/error-handler';

// ============================================
// TYPES
// ============================================

interface LoadingStates {
  workspace: boolean;    // Initial workspace fetch
  mutation: boolean;     // Any mutation in progress
  extraction: boolean;   // AI extraction specifically
}

interface UseWorkspaceReasoningResult {
  // Data
  workspace: WorkspaceReasoning | null;
  loading: LoadingStates;
  error: Error | null;
  
  // Mutations
  transitionState: (targetState: WorkspaceState, reason?: string) => Promise<void>;
  addFact: (data: AddFactData) => Promise<Fact>;
  confirmContext: (contextId: string) => Promise<void>;
  rejectContext: (contextId: string) => Promise<void>;
  resolveMissing: (missingId: string, resolution: string) => Promise<void>;
  executeAction: (actionId: string, result?: string) => Promise<void>;
  validateWorkspace: (note?: string) => Promise<void>;
  
  // Utils
  refetch: () => Promise<void>;
}

interface AddFactData {
  label: string;
  value: string;
  source: FactSource;
  sourceRef?: string;
}

interface ApiError {
  error: string;
  details?: any;
}

// ============================================
// FETCHER
// ============================================

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  
  return res.json();
}

// ============================================
// MAIN HOOK
// ============================================

export function useWorkspaceReasoning(workspaceId: string): UseWorkspaceReasoningResult {
  // Granular loading states
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    workspace: false,
    mutation: false,
    extraction: false,
  });
  
  const toast = useToast();
  
  // SWR for data fetching
  const { data, error, isLoading, mutate: swrMutate } = useSWR<{ workspace: WorkspaceReasoning }>(
    workspaceId ? `/api/workspace-reasoning/${workspaceId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests within 2s
      onSuccess: () => {
        // Clear workspace loading on success
        setLoadingStates(prev => ({ ...prev, workspace: false }));
      },
    }
  );
  
  // Update workspace loading when SWR isLoading changes
  useState(() => {
    setLoadingStates(prev => ({ ...prev, workspace: isLoading }));
  });
  
  // ============================================
  // MUTATION: Transition State
  // ============================================
  
  const transitionState = useCallback(async (targetState: WorkspaceState, reason?: string) => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    // Detect if this is an AI extraction operation (RECEIVED [Next] CONTEXT_IDENTIFIED)
    const isAIExtraction = targetState === 'CONTEXT_IDENTIFIED';
    
    setLoadingStates(prev => ({ 
      ...prev, 
      mutation: true,
      extraction: isAIExtraction 
    }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState, reason }),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      const data = await res.json();
      
      // Optimistic update
      await swrMutate();
      
      // Success toast
      toast.showToast(`Transition vers ${targetState} reussie`, 'success');
      
      return data;
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(
        classified.userMessage, 
        'error',
        classified.canRetry ? 'echec de la transition' : undefined
      );
      throw classified;
    } finally {
      setLoadingStates(prev => ({ 
        ...prev, 
        mutation: false,
        extraction: false 
      }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // MUTATION: Add Fact
  // ============================================
  
  const addFact = useCallback(async (factData: AddFactData): Promise<Fact> => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    setLoadingStates(prev => ({ ...prev, mutation: true }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/facts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factData),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      const data = await res.json();
      
      // Optimistic update
      await swrMutate();
      
      // Success toast
      toast.showToast('Fait ajoute avec succes', 'success');
      
      return data.fact;
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error');
      throw classified;
    } finally {
      setLoadingStates(prev => ({ ...prev, mutation: false }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // MUTATION: Confirm Context
  // ============================================
  
  const confirmContext = useCallback(async (contextId: string) => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    setLoadingStates(prev => ({ ...prev, mutation: true }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/contexts/${contextId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      // Optimistic update
      await swrMutate();
      
      // Success toast
      toast.showToast('Contexte confirme avec succes', 'success');
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error');
      throw classified;
    } finally {
      setLoadingStates(prev => ({ ...prev, mutation: false }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // MUTATION: Reject Context
  // ============================================
  
  const rejectContext = useCallback(async (contextId: string) => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    setLoadingStates(prev => ({ ...prev, mutation: true }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/contexts/${contextId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      // Optimistic update
      await swrMutate();
      
      // Success toast
      toast.showToast('Contexte rejete', 'success');
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error');
      throw classified;
    } finally {
      setLoadingStates(prev => ({ ...prev, mutation: false }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // MUTATION: Resolve Missing Element
  // ============================================
  
  const resolveMissing = useCallback(async (missingId: string, resolution: string) => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    setLoadingStates(prev => ({ ...prev, mutation: true }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/missing/${missingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      // Optimistic update
      await swrMutate();
      
      // Success toast
      toast.showToast('element manquant resolu', 'success');
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error');
      throw classified;
    } finally {
      setLoadingStates(prev => ({ ...prev, mutation: false }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // MUTATION: Execute Action
  // ============================================
  
  const executeAction = useCallback(async (actionId: string, result?: string) => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    setLoadingStates(prev => ({ ...prev, mutation: true }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/actions/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      // Optimistic update
      await swrMutate();
      
      // Success toast
      toast.showToast('Action executee avec succes', 'success');
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error');
      throw classified;
    } finally {
      setLoadingStates(prev => ({ ...prev, mutation: false }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // MUTATION: Validate Workspace (LOCK)
  // ============================================
  
  const validateWorkspace = useCallback(async (note?: string) => {
    if (!workspaceId) throw new Error('No workspace ID');
    
    setLoadingStates(prev => ({ ...prev, mutation: true }));
    
    try {
      const res = await fetch(`/api/workspace-reasoning/${workspaceId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationNote: note }),
      });
      
      if (!res.ok) {
        const error = await createErrorFromResponse(res);
        throw error;
      }
      
      // Final update - workspace is now locked
      await swrMutate();
      
      // Success toast
      toast.showToast(' Workspace valide et verrouille', 'success');
    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error');
      throw classified;
    } finally {
      setLoadingStates(prev => ({ ...prev, mutation: false }));
    }
  }, [workspaceId, swrMutate, toast]);
  
  // ============================================
  // REFETCH
  // ============================================
  
  const refetch = useCallback(async () => {
    await swrMutate();
  }, [swrMutate]);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    workspace: data?.workspace || null,
    loading: loadingStates,
    error: error || null,
    
    transitionState,
    addFact,
    confirmContext,
    rejectContext,
    resolveMissing,
    executeAction,
    validateWorkspace,
    
    refetch,
  };
}

// ============================================
// HELPER: Create Workspace
// ============================================

export async function createWorkspace(data: {
  sourceType: 'EMAIL' | 'FORM' | 'PHONE' | 'COURRIER' | 'API';
  sourceId?: string;
  sourceRaw: string;
  sourceMetadata?: Record<string, any>;
  procedureType?: string;
  clientId?: string;
  dossierId?: string;
  emailId?: string;
}): Promise<WorkspaceReasoning> {
  const res = await fetch('/api/workspace-reasoning/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error || 'Failed to create workspace');
  }
  
  const result = await res.json();
  return result.workspace;
}

// ============================================
// HELPER: Delete Workspace
// ============================================

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const res = await fetch(`/api/workspace-reasoning/${workspaceId}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error || 'Failed to delete workspace');
  }
  
  // Invalidate SWR cache
  await mutate(`/api/workspace-reasoning/${workspaceId}`, null, false);
}

// ============================================
// EXPORT
// ============================================

export default useWorkspaceReasoning;

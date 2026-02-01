/**
 * Hook pour gerer les validations IA cote client
 * Base sur CHARTE_IA_JURIDIQUE.md
 */

import { useState, useEffect, useCallback } from 'react';
import { AIAction, ValidationStatus, Alert } from '@/types';
import { logger } from '@/lib/logger';

interface UseValidationOptions {
  tenantId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // en ms
}

interface UseValidationReturn {
  // Actions en attente de validation
  pendingActions: AIAction[];
  
  // Alertes
  alerts: Alert[];
  unreadAlertsCount: number;
  
  // etats de chargement
  loading: boolean;
  validating: boolean;
  
  // Fonctions d'action
  approveAction: (actionId: string, comment?: string) => Promise<void>;
  rejectAction: (actionId: string, comment: string) => Promise<void>;
  modifyAction: (actionId: string, modifiedContent: any, comment?: string) => Promise<void>;
  
  // Gestion des alertes
  markAlertAsRead: (alertId: string) => Promise<void>;
  snoozeAlert: (alertId: string, until: Date) => Promise<void>;
  
  // Rafraichissement
  refresh: () => Promise<void>;
  
  // Erreur
  error: string | null;
}

export function useValidation({
  tenantId,
  autoRefresh = true,
  refreshInterval = 30000 // 30 secondes par defaut
}: UseValidationOptions): UseValidationReturn {
  
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Charge les actions en attente de validation
   */
  const loadPendingActions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/ai-actions?status=${ValidationStatus.PENDING}`
      );
      
      if (!response.ok) {
        throw new Error('Erreur de chargement des actions');
      }
      
      const data = await response.json();
      setPendingActions(data.actions || []);
      setError(null);
    } catch (err) {
      logger.error('Erreur chargement actions validation', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [tenantId]);
  
  /**
   * Charge les alertes
   */
  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/alerts?unreadOnly=false`
      );
      
      if (!response.ok) {
        throw new Error('Erreur de chargement des alertes');
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      logger.error('Erreur chargement alertes validation', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [tenantId]);
  
  /**
   * Rafraichit toutes les donnees
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadPendingActions(),
      loadAlerts()
    ]);
    setLoading(false);
  }, [loadPendingActions, loadAlerts]);
  
  /**
   * Approuve une action
   */
  const approveAction = useCallback(async (actionId: string, comment?: string) => {
    setValidating(true);
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/ai-actions/${actionId}/validate`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'approve',
            comment
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }
      
      // Retirer l'action de la liste des pending
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      setError(null);
      
      // Notification de succes (optionnel)
      // toast.success('Action approuvee avec succes');
      
    } catch (err) {
      logger.error('Erreur approbation action callback', { error: err, actionId });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setValidating(false);
    }
  }, [tenantId]);
  
  /**
   * Rejette une action
   */
  const rejectAction = useCallback(async (actionId: string, comment: string) => {
    if (!comment || comment.trim().length === 0) {
      setError('Un commentaire est requis pour rejeter une action');
      return;
    }
    
    setValidating(true);
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/ai-actions/${actionId}/validate`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'reject',
            comment
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors du rejet');
      }
      
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      setError(null);
      
    } catch (err) {
      logger.error('Erreur rejet action validation callback', { error: err, actionId, comment });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setValidating(false);
    }
  }, [tenantId]);
  
  /**
   * Modifie et approuve une action
   */
  const modifyAction = useCallback(async (
    actionId: string,
    modifiedContent: any,
    comment?: string
  ) => {
    setValidating(true);
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/ai-actions/${actionId}/validate`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'modify',
            modifiedContent,
            comment
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }
      
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      setError(null);
      
    } catch (err) {
      logger.error('Erreur approbation action validation callback', { error: err, actionId });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setValidating(false);
    }
  }, [tenantId]);
  
  /**
   * Marque une alerte comme lue
   */
  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/alerts?alertId=${alertId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read' })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur marquage alerte');
      }
      
      // Mettre a jour localement
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, read: true, readAt: new Date() }
          : alert
      ));
      
      setError(null);
    } catch (err) {
      logger.error('Erreur marquage alerte lue callback', { error: err, alertId });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [tenantId]);
  
  /**
   * Snooze une alerte
   */
  const snoozeAlert = useCallback(async (alertId: string, until: Date) => {
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/alerts?alertId=${alertId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'snooze',
            snoozeUntil: until.toISOString()
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur snooze alerte');
      }
      
      // Retirer temporairement de la liste
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      
      setError(null);
    } catch (err) {
      logger.error('Erreur snooze alerte callback', { error: err, alertId, until });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [tenantId]);
  
  /**
   * Chargement initial
   */
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);
  
  /**
   * Calculer le nombre d'alertes non lues
   */
  const unreadAlertsCount = alerts.filter(a => !a.read).length;
  
  return {
    pendingActions,
    alerts,
    unreadAlertsCount,
    loading,
    validating,
    approveAction,
    rejectAction,
    modifyAction,
    markAlertAsRead,
    snoozeAlert,
    refresh,
    error
  };
}

"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/forms/Button'
import { Modal } from '@/components/forms/Modal'
import { Input } from '@/components/forms/Input'
import { useToast } from '@/hooks'
import {
  getWorkflows,
  saveWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  executeWorkflow,
  getWorkflowExecutions,
  type Workflow,
  type TriggerType,
  type ActionType,
} from '@/lib/services/workflowService'
import { Play, Pause, Trash2, Plus, Edit, History, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(getWorkflows())
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showExecutions, setShowExecutions] = useState(false)
  const { showToast } = useToast()

  const refreshWorkflows = () => {
    setWorkflows(getWorkflows())
  }

  const handleToggle = (id: string) => {
    toggleWorkflow(id)
    refreshWorkflows()
    showToast('Workflow mis a jour', 'success')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce workflow ?')) return
    deleteWorkflow(id)
    refreshWorkflows()
    showToast('Workflow supprime', 'success')
  }

  const handleExecute = async (workflow: Workflow) => {
    try {
      showToast('Execution du workflow...', 'info')
      await executeWorkflow(workflow.id, {
        test: true,
        triggeredBy: 'manual',
      })
      refreshWorkflows()
      showToast('Workflow execute avec succes', 'success')
    } catch (error) {
      showToast('Erreur lors de l\'execution', 'error')
    }
  }

  const handleViewExecutions = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setShowExecutions(true)
  }

  const stats = {
    total: workflows.length,
    enabled: workflows.filter(w => w.enabled).length,
    disabled: workflows.filter(w => !w.enabled).length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
  }

  const triggerLabels: Record<TriggerType, string> = {
    dossier_created: 'Dossier cree',
    dossier_status_changed: 'Statut dossier modifie',
    facture_created: 'Facture creee',
    facture_overdue: 'Facture en retard',
    echeance_approaching: 'echeance proche',
    document_uploaded: 'Document uploade',
    client_created: 'Client cree',
    scheduled: 'Planifie',
  }

  const actionLabels: Record<ActionType, string> = {
    send_email: ' Email',
    create_task: ' Tache',
    update_status: '[emoji] Statut',
    assign_to_user: '[emoji] Attribution',
    generate_document: ' Document',
    create_notification: '[emoji] Notification',
    webhook: '[emoji] Webhook',
    run_script: '️ Script',
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Workflows', href: '/workflows' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Automatisation des Workflows
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automatisez vos processus metier avec des regles personnalisees
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau workflow
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total workflows</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.enabled}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Desactives</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">
            {stats.disabled}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Executions totales</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.totalExecutions}
          </p>
        </Card>
      </div>

      {/* Liste des workflows */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {workflow.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {workflow.enabled ? 'Actif' : 'Desactive'}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {workflow.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Declencheur:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {triggerLabels[workflow.trigger.type]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Actions:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {workflow.actions.map(a => actionLabels[a.type]).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Executions:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {workflow.executionCount}
                    </span>
                  </div>
                  {workflow.lastExecuted && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Derniere:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {new Date(workflow.lastExecuted).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecute(workflow)}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewExecutions(workflow)}
                >
                  <History className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(workflow.id)}
                >
                  {workflow.enabled ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(workflow.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun workflow configure
            </p>
            <Button onClick={() => setShowEditor(true)} className="mt-4">
              Creer votre premier workflow
            </Button>
          </Card>
        )}
      </div>

      {/* Modal des executions */}
      {showExecutions && selectedWorkflow && (
        <Modal 
          isOpen={showExecutions} 
          onClose={() => setShowExecutions(false)} 
          title={`Historique - ${selectedWorkflow.name}`}
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Historique - {selectedWorkflow.name}
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getWorkflowExecutions(selectedWorkflow.id).map((exec) => (
                <div
                  key={exec.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {exec.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {exec.status === 'failed' && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {exec.status === 'running' && (
                        <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {exec.status === 'completed' && 'Reussi'}
                        {exec.status === 'failed' && 'echoue'}
                        {exec.status === 'running' && 'En cours'}
                        {exec.status === 'pending' && 'En attente'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(exec.triggeredAt).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  {exec.error && (
                    <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                      Erreur: {exec.error}
                    </div>
                  )}

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {exec.results.length} action(s) executee(s)
                  </div>
                </div>
              ))}

              {getWorkflowExecutions(selectedWorkflow.id).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune execution enregistree
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

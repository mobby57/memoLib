'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

/**
 * 📊 Dashboard de Gestion des Formulaires & Décisions
 */

interface Stats {
  totalSubmissions: number;
  pendingApprovals: number;
  criticalRisks: number;
  strategicDecisions: number;
  approvalRate: number;
  averageImpactScore: number;
}

interface FormSubmission {
  id: string;
  formType: string;
  submitterEmail: string;
  status: string;
  impactScore: number;
  submittedAt: string;
  data: any;
}

interface ApprovalTask {
  id: string;
  approverRole: string;
  level: number;
  status: string;
  dueDate: string;
  submission: {
    formType: string;
    submitterEmail: string;
  };
}

interface RiskAssessment {
  id: string;
  category: string;
  description: string;
  priorityLevel: string;
  riskScore: number;
  status: string;
  submitterEmail: string;
}

export default function FormsDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [approvals, setApprovals] = useState<ApprovalTask[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les statistiques
      const statsRes = await fetch('/api/forms/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Charger les soumissions récentes
      const submissionsRes = await fetch('/api/forms/submissions?limit=10');
      const submissionsData = await submissionsRes.json();
      setSubmissions(submissionsData);

      // Charger les approbations en attente
      const approvalsRes = await fetch('/api/forms/approvals?status=pending');
      const approvalsData = await approvalsRes.json();
      setApprovals(approvalsData);

      // Charger les risques critiques
      const risksRes = await fetch('/api/forms/risks?priority=critical,high');
      const risksData = await risksRes.json();
      setRisks(risksData);

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Dashboard Décisionnel</h1>
          <p className="text-gray-600">
            Gestion centralisée des formulaires et décisions organisationnelles
          </p>
        </div>
        <Button onClick={() => window.location.href = '/lawyer/forms'}>
          ➕ Nouveau Formulaire
        </Button>
      </div>

      {/* Statistiques Clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Soumissions Totales</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalSubmissions || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approbations en Attente</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {stats?.pendingApprovals || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Nécessite action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risques Critiques</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats?.criticalRisks || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">Attention immédiate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Score Impact Moyen</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.averageImpactScore?.toFixed(1) || '0.0'}/20
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Derniers 30 jours</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Soumissions Récentes</TabsTrigger>
          <TabsTrigger value="approvals">
            Mes Approbations ({approvals.length})
          </TabsTrigger>
          <TabsTrigger value="risks">
            Risques ({risks.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Soumissions Récentes */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières Soumissions</CardTitle>
              <CardDescription>
                Historique des formulaires soumis récemment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={getFormTypeBadge(sub.formType)}>
                          {formatFormType(sub.formType)}
                        </Badge>
                        <span className="font-medium">{sub.submitterEmail}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(sub.submittedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Impact</div>
                        <div className={`font-bold ${getImpactColor(sub.impactScore)}`}>
                          {sub.impactScore}/20
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(sub.status)}>
                        {formatStatus(sub.status)}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Voir Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approbations en Attente */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approbations Requises</CardTitle>
              <CardDescription>
                Décisions en attente de votre validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge>Niveau {approval.level}</Badge>
                        <span className="font-medium">
                          {formatFormType(approval.submission.formType)}
                        </span>
                        <span className="text-gray-600">
                          par {approval.submission.submitterEmail}
                        </span>
                      </div>
                      <p className="text-sm text-orange-600 mt-1">
                        ⏰ Échéance: {new Date(approval.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Examiner
                      </Button>
                      <Button variant="default" size="sm" className="bg-green-600">
                        ✓ Approuver
                      </Button>
                      <Button variant="destructive" size="sm">
                        ✗ Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
                {approvals.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucune approbation en attente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risques */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risques Identifiés</CardTitle>
              <CardDescription>
                Risques critiques et élevés nécessitant attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={getRiskBadge(risk.priorityLevel)}>
                          {risk.priorityLevel.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{risk.category}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {risk.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Soumis par {risk.submitterEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Score</div>
                        <div className="text-2xl font-bold text-red-600">
                          {risk.riskScore}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Traiter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tendances</CardTitle>
              <CardDescription>Analyse des décisions organisationnelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Taux d'Approbation</h3>
                  <div className="text-4xl font-bold text-green-600">
                    {stats?.approvalRate || 0}%
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Basé sur les 90 derniers jours
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Délai Moyen d'Approbation</h3>
                  <div className="text-4xl font-bold">4.2 jours</div>
                  <p className="text-sm text-gray-600 mt-2">
                    -15% vs mois précédent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helpers pour le formatage
function formatFormType(type: string): string {
  const types: Record<string, string> = {
    'resource-request': '💼 Demande de Ressources',
    'strategic-decision': '🎯 Décision Stratégique',
    'risk-assessment': '⚠️ Évaluation de Risque',
  };
  return types[type] || type;
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    pending: 'En Attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    cancelled: 'Annulé',
  };
  return statuses[status] || status;
}

function getFormTypeBadge(type: string): 'default' | 'secondary' | 'outline' {
  return type === 'strategic-decision' ? 'default' : 'secondary';
}

function getStatusBadge(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
}

function getRiskBadge(level: string): 'default' | 'destructive' | 'secondary' {
  if (level === 'critical') return 'destructive';
  return 'default';
}

function getImpactColor(score: number): string {
  if (score >= 15) return 'text-red-600';
  if (score >= 9) return 'text-orange-600';
  if (score >= 5) return 'text-yellow-600';
  return 'text-green-600';
}

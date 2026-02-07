'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';

/**
 *  Dashboard DeVELOPPEMENT AVANCe
 * Monitoring temps reel, debugging IA, metriques performance
 */

export default function DevDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [workflowStats, setWorkflowStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh 5s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [logsRes, metricsRes, aiRes, workflowRes, healthRes] = await Promise.all([
        fetch('/api/dev/logs?limit=100'),
        fetch('/api/dev/metrics'),
        fetch('/api/dev/ai-stats'),
        fetch('/api/dev/workflow-stats'),
        fetch('/api/dev/health'),
      ]);

      setLogs(await logsRes.json());
      setMetrics(await metricsRes.json());
      setAiStats(await aiRes.json());
      setWorkflowStats(await workflowRes.json());
      setSystemHealth(await healthRes.json());
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  const clearLogs = async () => {
    await fetch('/api/dev/logs', { method: 'DELETE' });
    setLogs([]);
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    const response = await fetch(`/api/dev/logs/export?format=${format}`);
    const data = await response.text();
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.${format}`;
    a.click();
  };

  if (!metrics || !systemHealth) {
    return <div className="p-6"> Chargement dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tete */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold"> Dashboard Developpement</h1>
          <p className="text-gray-600">Monitoring temps reel & debugging avance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportLogs('json')}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => exportLogs('csv')}>
            Export CSV
          </Button>
          <Button variant="destructive" onClick={clearLogs}>
            ? Clear Logs
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status Systeme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.status === 'healthy' ? ' Operationnel' : ' Probleme'}
            </div>
            <p className="text-xs text-gray-500">Uptime: {systemHealth.uptime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Requetes IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats?.total || 0}</div>
            <p className="text-xs text-gray-500">Avg: {aiStats?.averageDuration?.toFixed(0)}ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workflows Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowStats?.active || 0}</div>
            <p className="text-xs text-gray-500">
              Taux succes: {workflowStats?.successRate?.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageDuration?.toFixed(0)}ms</div>
            <p className="text-xs text-gray-500">{metrics.totalOperations} operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs"> Logs</TabsTrigger>
          <TabsTrigger value="ai"> IA</TabsTrigger>
          <TabsTrigger value="workflows"> Workflows</TabsTrigger>
          <TabsTrigger value="performance"> Performance</TabsTrigger>
        </TabsList>

        {/* Logs en temps reel */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs en Temps Reel</CardTitle>
              <CardDescription>Derniers evenements systeme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${
                      log.level === 'ERROR' || log.level === 'CRITICAL'
                        ? 'bg-red-50 border-red-300'
                        : log.level === 'WARN'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.level === 'ERROR' ? 'destructive' : 'default'}>
                            {log.level}
                          </Badge>
                          <Badge variant="outline">{log.category}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1 font-medium">{log.message}</p>
                        {log.context && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistiques IA */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>Analyse IA - Metriques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600">Total Requetes</p>
                    <p className="text-2xl font-bold">{aiStats?.total || 0}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded">
                    <p className="text-sm text-gray-600">Taux Succes</p>
                    <p className="text-2xl font-bold">{aiStats?.successRate?.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded">
                    <p className="text-sm text-gray-600">Duree Moyenne</p>
                    <p className="text-2xl font-bold">{aiStats?.averageDuration?.toFixed(0)}ms</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Requetes les plus lentes</h3>
                  <div className="space-y-2">
                    {aiStats?.slowest?.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded flex justify-between">
                        <span className="font-mono text-sm">{item.operation}</span>
                        <Badge variant={item.duration > 5000 ? 'destructive' : 'default'}>
                          {item.duration.toFixed(0)}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Modeles utilises</h3>
                  <div className="space-y-2">
                    {aiStats?.models?.map((model: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span>{model.name}</span>
                        <Badge>{model.count} requetes</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflows - etat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold">{workflowStats?.active || 0}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded">
                    <p className="text-sm text-gray-600">Completes</p>
                    <p className="text-2xl font-bold">{workflowStats?.completed || 0}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded">
                    <p className="text-sm text-gray-600">echoues</p>
                    <p className="text-2xl font-bold">{workflowStats?.failed || 0}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded">
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold">{workflowStats?.pending || 0}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Workflows par type</h3>
                  <div className="space-y-2">
                    {workflowStats?.byType?.map((type: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <span>{type.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{type.count} executions</Badge>
                          <Badge>{type.successRate?.toFixed(1)}% succes</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Systeme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Operations les plus lentes</h3>
                  <div className="space-y-2">
                    {metrics.slowestOperations?.map((op: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-sm">{op.operation}</span>
                          <Badge variant={op.duration > 1000 ? 'destructive' : 'default'}>
                            {op.duration.toFixed(0)}ms
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{op.category}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(op.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Duree Moyenne Globale</p>
                    <p className="text-2xl font-bold">{metrics.averageDuration?.toFixed(0)}ms</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Taux de Succes</p>
                    <p className="text-2xl font-bold">{metrics.successRate?.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

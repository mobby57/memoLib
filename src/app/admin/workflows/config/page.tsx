'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';

/**
 * ️ Interface d'Administration - Configuration Avancee des Workflows
 */

export default function WorkflowConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [preset, setPreset] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/workflows/config');
      const data = await response.json();
      setConfig(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement config:', error);
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch('/api/workflows/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      alert(' Configuration sauvegardee!');
    } catch (error) {
      alert(' Erreur sauvegarde');
    }
    setSaving(false);
  };

  const loadPreset = async (presetName: string) => {
    try {
      const response = await fetch(`/api/workflows/config/preset/${presetName}`);
      const data = await response.json();
      setConfig(data);
      setPreset(presetName);
    } catch (error) {
      console.error('Erreur chargement preset:', error);
    }
  };

  if (loading || !config) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tete */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">️ Configuration Avancee</h1>
          <p className="text-gray-600">Personnalisation complete des workflows intelligents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig}>
            [emoji] Recharger
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? '[emoji] Sauvegarde...' : '[emoji] Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Configurations Predefinies</CardTitle>
          <CardDescription>Charger une configuration optimisee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant={preset === 'default' ? 'default' : 'outline'}
              onClick={() => loadPreset('default')}
            >
              [emoji] Par Defaut
            </Button>
            <Button
              variant={preset === 'performance' ? 'default' : 'outline'}
              onClick={() => loadPreset('performance')}
            >
               Performance
            </Button>
            <Button
              variant={preset === 'security' ? 'default' : 'outline'}
              onClick={() => loadPreset('security')}
            >
              [emoji] Securite
            </Button>
            <Button
              variant={preset === 'automated' ? 'default' : 'outline'}
              onClick={() => loadPreset('automated')}
            >
              [emoji] Automatique
            </Button>
            <Button
              variant={preset === 'law-firm' ? 'default' : 'outline'}
              onClick={() => loadPreset('law-firm')}
              className="col-span-2"
            >
              ️ Cabinet Juridique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Configuration */}
      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai">[emoji] IA</TabsTrigger>
          <TabsTrigger value="notifications">[emoji] Notifications</TabsTrigger>
          <TabsTrigger value="forms">[emoji] Formulaires</TabsTrigger>
          <TabsTrigger value="calendar">[emoji] Calendrier</TabsTrigger>
          <TabsTrigger value="security">[emoji] Securite</TabsTrigger>
        </TabsList>

        {/* Configuration IA */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intelligence Artificielle</CardTitle>
              <CardDescription>Parametres de l'IA pour l'analyse et les suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={config.ai.provider}
                    onValueChange={(value) => setConfig({
                      ...config,
                      ai: { ...config.ai, provider: value },
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modele</Label>
                  <Input
                    value={config.ai.model}
                    onChange={(e) => setConfig({
                      ...config,
                      ai: { ...config.ai, model: e.target.value },
                    })}
                    placeholder="llama3.2:latest"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Temperature: {config.ai.temperature}</Label>
                  <Slider
                    value={[config.ai.temperature]}
                    onValueChange={([value]) => setConfig({
                      ...config,
                      ai: { ...config.ai, temperature: value },
                    })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-gray-500">
                    0 = Conservateur, 1 = Creatif
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.ai.maxTokens}
                    onChange={(e) => setConfig({
                      ...config,
                      ai: { ...config.ai, maxTokens: parseInt(e.target.value) },
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profondeur d'Analyse</Label>
                  <Select
                    value={config.ai.analysisDepth}
                    onValueChange={(value) => setConfig({
                      ...config,
                      ai: { ...config.ai, analysisDepth: value },
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick"> Rapide</SelectItem>
                      <SelectItem value="standard">[emoji] Standard</SelectItem>
                      <SelectItem value="deep">[emoji] Approfondie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Seuil de Confiance: {config.ai.confidenceThreshold}</Label>
                  <Slider
                    value={[config.ai.confidenceThreshold]}
                    onValueChange={([value]) => setConfig({
                      ...config,
                      ai: { ...config.ai, confidenceThreshold: value },
                    })}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.ai.fallbackEnabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    ai: { ...config.ai, fallbackEnabled: checked },
                  })}
                />
                <Label>Activer le fallback (reponses par defaut si IA indisponible)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Gestion des alertes et notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.notifications.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    notifications: { ...config.notifications, enabled: checked },
                  })}
                />
                <Label>Activer les notifications</Label>
              </div>

              <div className="space-y-4">
                <Label>Canaux de notification</Label>
                <div className="grid grid-cols-2 gap-4">
                  {['web', 'email', 'sms', 'webhook'].map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Switch
                        checked={config.notifications.channels.includes(channel)}
                        onCheckedChange={(checked) => {
                          const channels = checked
                            ? [...config.notifications.channels, channel]
                            : config.notifications.channels.filter((c: string) => c !== channel);
                          setConfig({
                            ...config,
                            notifications: { ...config.notifications, channels },
                          });
                        }}
                      />
                      <Label className="capitalize">{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priorites */}
              {['critical', 'high', 'medium', 'low'].map((priority) => (
                <Card key={priority}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{priority}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.notifications.priority[priority].sound}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              priority: {
                                ...config.notifications.priority,
                                [priority]: {
                                  ...config.notifications.priority[priority],
                                  sound: checked,
                                },
                              },
                            },
                          })}
                        />
                        <Label>[emoji] Son</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.notifications.priority[priority].dismissible}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              priority: {
                                ...config.notifications.priority,
                                [priority]: {
                                  ...config.notifications.priority[priority],
                                  dismissible: checked,
                                },
                              },
                            },
                          })}
                        />
                        <Label>️ Dismissible</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Timeout (minutes)</Label>
                        <Input
                          type="number"
                          value={config.notifications.priority[priority].timeoutMinutes}
                          onChange={(e) => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              priority: {
                                ...config.notifications.priority,
                                [priority]: {
                                  ...config.notifications.priority[priority],
                                  timeoutMinutes: parseInt(e.target.value),
                                },
                              },
                            },
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Escalade apres (minutes)</Label>
                        <Input
                          type="number"
                          value={config.notifications.priority[priority].escalateAfterMinutes}
                          onChange={(e) => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              priority: {
                                ...config.notifications.priority,
                                [priority]: {
                                  ...config.notifications.priority[priority],
                                  escalateAfterMinutes: parseInt(e.target.value),
                                },
                              },
                            },
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Heures Calmes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Heures Calmes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.quietHours.enabled}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        notifications: {
                          ...config.notifications,
                          quietHours: {
                            ...config.notifications.quietHours,
                            enabled: checked,
                          },
                        },
                      })}
                    />
                    <Label>Activer</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Debut</Label>
                      <Input
                        type="time"
                        value={config.notifications.quietHours.start}
                        onChange={(e) => setConfig({
                          ...config,
                          notifications: {
                            ...config.notifications,
                            quietHours: {
                              ...config.notifications.quietHours,
                              start: e.target.value,
                            },
                          },
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fin</Label>
                      <Input
                        type="time"
                        value={config.notifications.quietHours.end}
                        onChange={(e) => setConfig({
                          ...config,
                          notifications: {
                            ...config.notifications,
                            quietHours: {
                              ...config.notifications.quietHours,
                              end: e.target.value,
                            },
                          },
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autres tabs... */}
        <TabsContent value="forms">
          <Card>
            <CardHeader>
              <CardTitle>Formulaires Dynamiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch checked={config.forms.autofill} />
                <Label>Autofill avec donnees existantes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={config.forms.aiSuggestions} />
                <Label>Suggestions IA en temps reel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={config.forms.conditionalLogic} />
                <Label>Logique conditionnelle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={config.forms.saveProgress} />
                <Label>Sauvegarde automatique</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier & Planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={config.calendar.provider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Interne</SelectItem>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={config.calendar.autoSchedule} />
                <Label>Planification automatique</Label>
              </div>

              <div className="space-y-2">
                <Label>Duree par defaut (minutes)</Label>
                <Input type="number" value={config.calendar.defaultDuration} />
              </div>

              <div className="space-y-2">
                <Label>Buffer entre RDV (minutes)</Label>
                <Input type="number" value={config.calendar.bufferMinutes} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Securite & Conformite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch checked={config.security.encryptData} />
                <Label>Chiffrement des donnees</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={config.security.auditLog} />
                <Label>Journal d'audit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={config.security.requireTwoFactor} />
                <Label>Double authentification obligatoire</Label>
              </div>

              <div className="space-y-2">
                <Label>Retention des donnees (jours)</Label>
                <Input type="number" value={config.security.dataRetentionDays} />
                <p className="text-xs text-gray-500">
                  Minimum 30 jours, recommande 2555 jours (7 ans) pour juridique
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

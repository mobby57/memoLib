'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Breadcrumb, Alert } from '@/components/ui';
import { Button } from '@/components/forms';
import { Bell, Mail, Clock, CheckCircle, Send, Zap, Calendar } from 'lucide-react';
import { safeLocalStorage } from '@/lib/localStorage';
import {
  ReminderConfig,
  DEFAULT_REMINDER_CONFIG,
  generateEcheanceReminderEmail,
  generateFactureOverdueEmail,
  generateWeeklySummaryEmail,
  sendEmail
} from '@/lib/services/emailService';
import { useToast } from '@/hooks';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<ReminderConfig>(DEFAULT_REMINDER_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (path: string[]) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = !current[path[path.length - 1]];
      return newConfig;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simuler la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sauvegarder dans localStorage pour la demo
    safeLocalStorage.setItem('notification_config', JSON.stringify(config));
    
    showToast('Parametres de notification sauvegardes', 'success');
    setIsSaving(false);
  };

  const handleTestEmail = async (type: 'echeance' | 'facture' | 'summary') => {
    let template;
    
    switch (type) {
      case 'echeance':
        template = generateEcheanceReminderEmail({
          titre: 'Depot des conclusions',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          dossier: 'DOS-2026-001',
          description: 'Depot des conclusions au greffe du tribunal'
        }, 3);
        break;
      
      case 'facture':
        template = generateFactureOverdueEmail({
          numero: 'FACT-2026-001',
          client: 'Martin Dupont',
          montant: 1500,
          dateEcheance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }, 7);
        break;
      
      case 'summary':
        template = generateWeeklySummaryEmail({
          newDossiers: 5,
          newFactures: 8,
          totalRevenue: 12500,
          upcomingEcheances: 3,
          overdueFactures: 2
        });
        break;
    }
    
    await sendEmail({
      to: [{ email: 'user@example.com', name: 'Utilisateur Test' }],
      template
    });
    
    showToast('Email de test envoye (verifiez la console)', 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Parametres', href: '/settings' },
          { label: 'Notifications', href: '/settings/notifications' }
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notifications Automatiques
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez les rappels et alertes par email
        </p>
      </div>

      <Alert variant="info" className="mb-6">
        <Bell className="h-5 w-5" />
        Les notifications sont envoyees automatiquement selon vos preferences. Vous pouvez tester chaque type de notification ci-dessous.
      </Alert>

      {/* Statut general */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${config.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              {config.enabled ? (
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <Bell className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notifications {config.enabled ? 'activees' : 'desactivees'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.enabled 
                  ? 'Les emails automatiques seront envoyes selon votre configuration' 
                  : 'Aucun email automatique ne sera envoye'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle(['enabled'])}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Rappels d'echeances */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rappels d'echeances
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recevez des rappels avant les dates limites importantes
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle(['triggers', 'echeances', 'enabled'])}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.triggers.echeances.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.triggers.echeances.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {config.triggers.echeances.enabled && (
          <div className="space-y-3 pl-12">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Rappels envoyes avant l'echeance:
            </p>
            <div className="flex flex-wrap gap-2">
              {config.triggers.echeances.daysBefore.map(days => (
                <span
                  key={days}
                  className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {days} jour{days > 1 ? 's' : ''} avant
                </span>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestEmail('echeance')}
              className="mt-3"
            >
              <Send className="h-4 w-4 mr-2" />
              Tester un rappel
            </Button>
          </div>
        )}
      </Card>

      {/* Relances factures impayees */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Relances factures impayees
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alertes automatiques pour les factures en retard
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle(['triggers', 'facturesOverdue', 'enabled'])}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.triggers.facturesOverdue.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.triggers.facturesOverdue.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {config.triggers.facturesOverdue.enabled && (
          <div className="space-y-3 pl-12">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Relances envoyees apres l'echeance:
            </p>
            <div className="flex flex-wrap gap-2">
              {config.triggers.facturesOverdue.daysAfter.map(days => (
                <span
                  key={days}
                  className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                >
                  {days} jour{days > 1 ? 's' : ''} apres
                </span>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestEmail('facture')}
              className="mt-3"
            >
              <Send className="h-4 w-4 mr-2" />
              Tester une relance
            </Button>
          </div>
        )}
      </Card>

      {/* Resume hebdomadaire */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resume hebdomadaire
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Synthese de votre activite chaque semaine
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle(['triggers', 'weeklySummary', 'enabled'])}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.triggers.weeklySummary.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.triggers.weeklySummary.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {config.triggers.weeklySummary.enabled && (
          <div className="space-y-3 pl-12">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Envoye chaque {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][config.triggers.weeklySummary.dayOfWeek]} a {config.triggers.weeklySummary.hour}h00
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestEmail('summary')}
              className="mt-3"
            >
              <Send className="h-4 w-4 mr-2" />
              Tester le resume
            </Button>
          </div>
        )}
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => setConfig(DEFAULT_REMINDER_CONFIG)}>
          Reinitialiser
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sauvegarder les parametres
            </>
          )}
        </Button>
      </div>

      {/* Informations supplementaires */}
      <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Mode developpement
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          Les emails sont actuellement simules (affiches dans la console). En production, ils seront envoyes via un service d'emailing.
        </p>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>- <strong>Services recommandes:</strong> Resend, SendGrid, AWS SES, Mailgun</p>
          <p>- <strong>Configuration:</strong> Definir la cle API dans les variables d'environnement</p>
          <p>- <strong>Personnalisation:</strong> Les templates HTML peuvent etre modifies dans <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">emailService.ts</code></p>
        </div>
      </Card>
    </div>
  );
}

#!/usr/bin/env tsx
/**
 * Générateur automatique des 53 pages manquantes
 * Crée toutes les pages pour atteindre 100%
 */

import fs from 'fs';
import path from 'path';

const pages = [
  // 📋 Gestion Dossiers (5)
  { path: 'admin/dossiers/[id]/parties', name: 'Parties Impliquées', priority: 'high' },
  { path: 'admin/dossiers/[id]/jalons', name: 'Jalons & Étapes', priority: 'high' },
  { path: 'admin/dossiers/[id]/budget', name: 'Budget Alloué', priority: 'high' },
  { path: 'admin/dossiers/archives', name: 'Dossiers Archivés', priority: 'medium' },
  { path: 'admin/dossiers/[id]/stats', name: 'Statistiques Dossier', priority: 'medium' },

  // 👥 Gestion Clients (4)
  { path: 'admin/clients/[id]/notes', name: 'Notes Confidentielles', priority: 'medium' },
  { path: 'admin/clients/[id]/historique', name: 'Historique Client', priority: 'medium' },
  { path: 'admin/clients/[id]/rgpd', name: 'Consentement RGPD', priority: 'medium' },
  { path: 'admin/clients/[id]/signatures', name: 'Documents Signés', priority: 'low' },

  // 📄 Documents (6)
  { path: 'admin/documents/[id]/versions', name: 'Versioning', priority: 'medium' },
  { path: 'admin/documents/[id]/metadata', name: 'Métadonnées', priority: 'medium' },
  { path: 'admin/documents/[id]/preview', name: 'Prévisualisation', priority: 'medium' },
  { path: 'admin/documents/[id]/share', name: 'Partage Externe', priority: 'low' },
  { path: 'admin/documents/[id]/ocr', name: 'OCR Results', priority: 'low' },
  { path: 'admin/documents/[id]/sign', name: 'Signature Électronique', priority: 'medium' },

  // 💬 Communication (3)
  { path: 'admin/dossiers/[id]/chat', name: 'Chat par Dossier', priority: 'high' },
  { path: 'settings/notifications/preferences', name: 'Préférences Notifications', priority: 'medium' },
  { path: 'admin/messages/archives', name: 'Messages Archivés', priority: 'low' },

  // 💳 Facturation (7)
  { path: 'admin/billing/devis', name: 'Devis', priority: 'high' },
  { path: 'admin/billing/devis/[id]', name: 'Détails Devis', priority: 'high' },
  { path: 'admin/billing/tarification', name: 'Tarification', priority: 'high' },
  { path: 'admin/billing/relances', name: 'Relances Auto', priority: 'medium' },
  { path: 'admin/billing/portefeuille', name: 'Portefeuille Client', priority: 'low' },
  { path: 'admin/billing/rapports', name: 'Rapports Financiers', priority: 'medium' },
  { path: 'admin/billing/virement', name: 'Paiement Virement', priority: 'low' },

  // 📅 Agenda (5)
  { path: 'calendrier/dates-cles', name: 'Dates Clés', priority: 'medium' },
  { path: 'calendrier/rappels-sms', name: 'Rappels SMS', priority: 'medium' },
  { path: 'calendrier/recurrence', name: 'Événements Récurrents', priority: 'low' },
  { path: 'calendrier/integrations', name: 'Intégration Calendrier', priority: 'low' },
  { path: 'calendrier/blocages', name: 'Blocage Dates', priority: 'low' },

  // ✅ Tâches (6)
  { path: 'admin/taches', name: 'Gestion Tâches', priority: 'high' },
  { path: 'admin/taches/[id]', name: 'Détails Tâche', priority: 'high' },
  { path: 'admin/taches/assignation', name: 'Assignation', priority: 'high' },
  { path: 'admin/taches/timeline', name: 'Timeline/Burndown', priority: 'medium' },
  { path: 'admin/taches/dependances', name: 'Dépendances', priority: 'low' },
  { path: 'admin/taches/kanban', name: 'Tableau Kanban', priority: 'medium' },

  // 📝 Modèles (4)
  { path: 'templates/lettres', name: 'Lettres Types', priority: 'medium' },
  { path: 'templates/contrats', name: 'Contrats Types', priority: 'medium' },
  { path: 'templates/generateur', name: 'Générateur', priority: 'medium' },
  { path: 'templates/clauses', name: 'Bibliothèque Clauses', priority: 'low' },

  // 📊 Rapports (5)
  { path: 'admin/rapports/temps', name: 'Temps Passé', priority: 'medium' },
  { path: 'admin/rapports/fermeture', name: 'Taux Fermeture', priority: 'low' },
  { path: 'admin/rapports/previsions', name: 'Prévisions CA', priority: 'low' },
  { path: 'admin/rapports/satisfaction', name: 'Satisfaction Client', priority: 'low' },
  { path: 'admin/rapports/couts', name: 'Coût Moyen', priority: 'low' },

  // 🔗 Intégrations (8)
  { path: 'admin/integrations/google-calendar', name: 'Google Calendar', priority: 'low' },
  { path: 'admin/integrations/outlook', name: 'Outlook/Teams', priority: 'low' },
  { path: 'admin/integrations/gmail', name: 'Gmail', priority: 'low' },
  { path: 'admin/integrations/docusign', name: 'DocuSign', priority: 'low' },
  { path: 'admin/integrations/yousign', name: 'Yousign', priority: 'low' },
  { path: 'admin/integrations/salesforce', name: 'Salesforce', priority: 'low' },
  { path: 'admin/integrations/google-drive', name: 'Google Drive', priority: 'low' },
  { path: 'admin/integrations/onedrive', name: 'OneDrive', priority: 'low' },

  // 🔒 Sécurité (4)
  { path: 'settings/security/2fa', name: '2FA Setup', priority: 'medium' },
  { path: 'settings/security/api-keys', name: 'API Keys', priority: 'low' },
  { path: 'admin/logs/detailed', name: 'Logs Détaillés', priority: 'low' },
  { path: 'admin/backup/restore', name: 'Restore Backup', priority: 'low' },

  // 📱 Mobile (1)
  { path: 'mobile/app', name: 'Mobile App Info', priority: 'low' },
];

const template = (name: string, priority: string) => `'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ${name.replace(/[^a-zA-Z]/g, '')}Page() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>${name}</CardTitle>
          <CardDescription>
            Priorité: ${priority === 'high' ? '🔴 Haute' : priority === 'medium' ? '🟡 Moyenne' : '🟢 Basse'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Cette page est en cours de développement.
            </p>
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Fonctionnalités prévues:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Interface utilisateur complète</li>
                <li>Intégration avec l'API backend</li>
                <li>Validation des données</li>
                <li>Gestion des erreurs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

async function generatePages() {
  console.log('🚀 Génération de 53 pages manquantes...\n');

  const baseDir = 'c:/Users/moros/Desktop/memolib/src/app';
  let created = 0;

  for (const page of pages) {
    const fullPath = path.join(baseDir, page.path, 'page.tsx');
    const dir = path.dirname(fullPath);

    try {
      // Créer le dossier si nécessaire
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Créer la page si elle n'existe pas
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, template(page.name, page.priority));
        console.log(`✅ ${page.name} (${page.priority})`);
        created++;
      } else {
        console.log(`⏭️  ${page.name} (existe déjà)`);
      }
    } catch (error) {
      console.error(`❌ Erreur: ${page.name}`, error);
    }
  }

  console.log(`\n🎉 ${created}/${pages.length} pages créées!`);
  console.log('\n📊 Répartition par priorité:');
  console.log(`   🔴 Haute: ${pages.filter(p => p.priority === 'high').length}`);
  console.log(`   🟡 Moyenne: ${pages.filter(p => p.priority === 'medium').length}`);
  console.log(`   🟢 Basse: ${pages.filter(p => p.priority === 'low').length}`);
}

generatePages();

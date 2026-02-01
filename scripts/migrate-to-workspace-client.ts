/**
 * Migration vers Architecture Workspace Client Unifié
 * 
 * Transforme l'ancienne architecture vers le nouveau modèle :
 * - 1 Client = 1 Workspace unique
 * - Dossiers → Procédures (sous-entités)
 * - Emails centralisés dans WorkspaceEmail
 * - Timeline unifiée
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

interface MigrationStats {
  clientsMigrated: number;
  workspacesCreated: number;
  proceduresCreated: number;
  emailsMigrated: number;
  documentsMigrated: number;
  errors: string[];
}

const stats: MigrationStats = {
  clientsMigrated: 0,
  workspacesCreated: 0,
  proceduresCreated: 0,
  emailsMigrated: 0,
  documentsMigrated: 0,
  errors: [],
};

/**
 * Mapper statut dossier → statut procédure
 */
function mapDossierStatus(statut: string): string {
  const mapping: Record<string, string> = {
    'en_cours': 'active',
    'urgent': 'active',
    'en_attente': 'pending',
    'termine': 'closed',
    'archive': 'archived',
    'suspendu': 'pending',
  };
  return mapping[statut] || 'active';
}

/**
 * Mapper priorité dossier → urgence procédure
 */
function mapDossierPriority(priorite: string): string {
  const mapping: Record<string, string> = {
    'critique': 'critique',
    'haute': 'eleve',
    'normale': 'moyen',
    'basse': 'faible',
  };
  return mapping[priorite] || 'moyen';
}

/**
 * Créer un workspace pour un client
 */
async function createWorkspaceForClient(client: any, tenantId: string) {
  try {
    const workspace = await prisma.workspace.create({
      data: {
        tenantId,
        clientId: client.id,
        title: `Espace ${client.firstName} ${client.lastName}`,
        description: `Workspace unifié pour ${client.firstName} ${client.lastName}`,
        reference: `WS-${Date.now()}-${client.id.substring(0, 8)}`,
        status: client.status === 'actif' ? 'active' : client.status === 'archive' ? 'archived' : 'active',
        globalPriority: 'normale',
        firstContactDate: client.datePremiereVisite || client.createdAt,
        lastActivityDate: client.lastActivityAt || new Date(),
        createdById: 'system-migration',
        primaryLawyerId: null,
        preferredChannel: client.prefCommunication || 'email',
        notificationsEnabled: client.accepteNotifications ?? true,
        metadata: JSON.stringify({
          migratedAt: new Date().toISOString(),
          originalClientId: client.id,
        }),
      },
    });

    stats.workspacesCreated++;
    logger.info(`✅ Workspace créé pour client ${client.id}`, { workspaceId: workspace.id });

    return workspace;
  } catch (error) {
    const errorMsg = `❌ Erreur création workspace pour client ${client.id}: ${error}`;
    stats.errors.push(errorMsg);
    logger.error(errorMsg, error);
    throw error;
  }
}

/**
 * Migrer un dossier vers une procédure
 */
async function migrateDossierToProcedure(dossier: any, workspaceId: string) {
  try {
    const procedure = await prisma.procedure.create({
      data: {
        workspaceId,
        procedureType: dossier.typeDossier || 'AUTRE',
        title: dossier.numero || `Procédure ${dossier.id.substring(0, 8)}`,
        description: dossier.description || dossier.objet,
        reference: dossier.numero,
        status: mapDossierStatus(dossier.statut),
        urgencyLevel: mapDossierPriority(dossier.priorite),
        notificationDate: dossier.dateCreation,
        deadlineDate: dossier.dateEcheance || dossier.dateProchaineEtape,
        startedAt: dossier.dateOuverture || dossier.dateCreation,
        closedAt: dossier.dateCloture,
        assignedToId: dossier.responsableId,
        metadata: JSON.stringify({
          originalDossierId: dossier.id,
          articleCeseda: dossier.articleCeseda,
          juridiction: dossier.juridiction,
          numeroJuridiction: dossier.numeroJuridiction,
          typeRecours: dossier.typeRecours,
        }),
      },
    });

    stats.proceduresCreated++;
    logger.info(`✅ Procédure créée depuis dossier ${dossier.id}`, { procedureId: procedure.id });

    return procedure;
  } catch (error) {
    const errorMsg = `❌ Erreur migration dossier ${dossier.id}: ${error}`;
    stats.errors.push(errorMsg);
    logger.error(errorMsg, error);
    return null;
  }
}

/**
 * Migrer un email vers WorkspaceEmail
 */
async function migrateEmailToWorkspace(email: any, workspaceId: string) {
  try {
    await prisma.workspaceEmail.create({
      data: {
        workspaceId,
        messageId: email.messageId,
        threadId: email.threadId,
        from: email.from,
        to: email.to,
        subject: email.subject,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
        receivedDate: email.receivedDate,
        direction: 'inbound', // Par défaut, à affiner selon la logique
        category: email.classification?.type,
        priority: email.classification?.priority || 'normal',
        hasAttachments: !!email.attachments,
        attachments: email.attachments,
        aiProcessed: !!email.classification,
        aiClassified: email.classification?.type,
        aiConfidence: email.classification?.confidence,
        isRead: email.isRead,
        isStarred: email.isStarred,
        isArchived: email.isArchived,
        needsResponse: email.needsResponse,
        responseGenerated: email.responseGenerated,
        responseDraft: email.responseDraft,
      },
    });

    stats.emailsMigrated++;
  } catch (error) {
    const errorMsg = `❌ Erreur migration email ${email.id}: ${error}`;
    stats.errors.push(errorMsg);
    logger.error(errorMsg, error);
  }
}

/**
 * Créer timeline event de migration
 */
async function createMigrationTimelineEvent(workspaceId: string, clientName: string) {
  await prisma.timelineEvent.create({
    data: {
      workspaceId,
      eventType: 'migration',
      title: 'Workspace créé automatiquement',
      description: `Migration automatique vers architecture Workspace Client Unifié pour ${clientName}`,
      actorType: 'system',
      metadata: JSON.stringify({
        migrationDate: new Date().toISOString(),
        migrationScript: 'migrate-to-workspace-client.ts',
      }),
    },
  });
}

/**
 * Fonction principale de migration
 */
async function migrateToWorkspaceClient() {
  console.log('\n🚀 Début migration vers Workspace Client Unifié\n');
  console.log('================================================\n');

  try {
    // 1. Récupérer tous les clients
    const clients = await prisma.client.findMany({
      include: {
        dossiers: true,
        emails: {
          include: {
            classification: true,
          },
        },
      },
    });

    console.log(`📊 Clients à migrer : ${clients.length}\n`);

    // 2. Pour chaque client
    for (const client of clients) {
      console.log(`\n🔄 Migration client: ${client.firstName} ${client.lastName} (${client.email})`);

      try {
        // 2.1 Vérifier si workspace existe déjà
        const existingWorkspace = await prisma.workspace.findUnique({
          where: { clientId: client.id },
        });

        if (existingWorkspace) {
          console.log(`⚠️  Workspace existe déjà pour ce client, skip.`);
          continue;
        }

        // 2.2 Créer workspace
        const workspace = await createWorkspaceForClient(client, client.tenantId);

        // 2.3 Migrer dossiers → procédures
        console.log(`   📁 Migration de ${client.dossiers.length} dossiers...`);
        for (const dossier of client.dossiers) {
          await migrateDossierToProcedure(dossier, workspace.id);
        }

        // 2.4 Migrer emails
        console.log(`   📧 Migration de ${client.emails.length} emails...`);
        for (const email of client.emails) {
          await migrateEmailToWorkspace(email, workspace.id);
        }

        // 2.5 Mettre à jour stats workspace
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            totalProcedures: client.dossiers.length,
            activeProcedures: client.dossiers.filter(d => 
              d.statut === 'en_cours' || d.statut === 'urgent'
            ).length,
            totalEmails: client.emails.length,
            totalDocuments: 0, // À calculer si nécessaire
          },
        });

        // 2.6 Créer timeline event
        await createMigrationTimelineEvent(workspace.id, `${client.firstName} ${client.lastName}`);

        stats.clientsMigrated++;
        console.log(`   ✅ Client migré avec succès`);

      } catch (error) {
        console.error(`   ❌ Erreur migration client ${client.id}:`, error);
        stats.errors.push(`Client ${client.id}: ${error}`);
      }
    }

    // 3. Afficher rapport final
    console.log('\n================================================');
    console.log('📊 RAPPORT DE MIGRATION\n');
    console.log(`✅ Clients migrés      : ${stats.clientsMigrated}/${clients.length}`);
    console.log(`✅ Workspaces créés    : ${stats.workspacesCreated}`);
    console.log(`✅ Procédures créées   : ${stats.proceduresCreated}`);
    console.log(`✅ Emails migrés       : ${stats.emailsMigrated}`);
    console.log(`✅ Documents migrés    : ${stats.documentsMigrated}`);
    console.log(`\n❌ Erreurs             : ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERREURS RENCONTRÉES:\n');
      stats.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    console.log('\n🎉 Migration terminée!\n');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  migrateToWorkspaceClient()
    .then(() => {
      console.log('✨ Migration complète réussie');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec migration:', error);
      process.exit(1);
    });
}

export { migrateToWorkspaceClient, stats };

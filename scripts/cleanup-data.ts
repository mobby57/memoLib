#!/usr/bin/env ts-node

/**
 * Data Retention & Cleanup Script for GDPR/CCPA Compliance
 * 
 * Runs as a cron job to automatically delete or anonymize data
 * according to retention policies
 * 
 * Schedule: Daily at 2 AM UTC
 * cron: 0 2 * * *
 */

import { PrismaClient } from '@prisma/client';
import { GDPRCompliance } from '../src/frontend/lib/compliance/gdpr';

const prisma = new PrismaClient();

// Retention periods (in days)
const RETENTION_POLICIES = {
    emails: 365,              // 1 year
    auditLogs: 730,           // 2 years
    financialRecords: 2555,   // 7 years (legal requirement)
    anonymousAnalytics: 1095, // 3 years
    deletedAccounts: 30,      // 30 day grace period
    dataExports: 30,          // Export download links expire after 30 days
    sessions: 90,             // Inactive sessions
    passwordResetTokens: 1,   // 24 hours
    emailVerificationTokens: 7, // 7 days
};

/**
 * Main cleanup function
 */
async function runCleanup() {
    console.log('🧹 Starting data cleanup job...');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    try {
        // 1. Process scheduled account deletions
        await processScheduledDeletions();

        // 2. Clean up old emails
        await cleanupOldEmails();

        // 3. Clean up old audit logs
        await cleanupOldAuditLogs();

        // 4. Clean up expired data exports
        await cleanupExpiredExports();

        // 5. Clean up inactive sessions
        await cleanupInactiveSessions();

        // 6. Clean up expired tokens
        await cleanupExpiredTokens();

        // 7. Anonymize old analytics data
        await anonymizeOldAnalytics();

        console.log('✅ Data cleanup completed successfully');
    } catch (error) {
        console.error('❌ Data cleanup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Process scheduled account deletions
 */
async function processScheduledDeletions() {
    console.log('\n📋 Processing scheduled account deletions...');

    const now = new Date();
    const deletionRequests = await prisma.deletionRequest.findMany({
        where: {
            status: 'scheduled',
            scheduledFor: {
                lte: now
            }
        }
    });

    console.log(`Found ${deletionRequests.length} accounts to delete`);

    for (const request of deletionRequests) {
        try {
            await GDPRCompliance.executeDeletion(request.userId);
            console.log(`✅ Deleted account: ${request.userId}`);
        } catch (error) {
            console.error(`❌ Failed to delete account ${request.userId}:`, error);
        }
    }
}

/**
 * Clean up old emails
 */
async function cleanupOldEmails() {
    console.log('\n📧 Cleaning up old emails...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.emails);

    const result = await prisma.email.deleteMany({
        where: {
            receivedAt: {
                lt: cutoffDate
            },
            // Don't delete starred/important emails
            labels: {
                none: {
                    name: {
                        in: ['starred', 'important']
                    }
                }
            }
        }
    });

    console.log(`✅ Deleted ${result.count} old emails (older than ${RETENTION_POLICIES.emails} days)`);
}

/**
 * Clean up old audit logs
 */
async function cleanupOldAuditLogs() {
    console.log('\n📝 Cleaning up old audit logs...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.auditLogs);

    const result = await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate
            }
        }
    });

    console.log(`✅ Deleted ${result.count} old audit logs (older than ${RETENTION_POLICIES.auditLogs} days)`);
}

/**
 * Clean up expired data exports
 */
async function cleanupExpiredExports() {
    console.log('\n💾 Cleaning up expired data exports...');

    const now = new Date();

    const expiredExports = await prisma.dataExportRequest.findMany({
        where: {
            status: 'completed',
            expiresAt: {
                lt: now
            }
        }
    });

    console.log(`Found ${expiredExports.length} expired exports`);

    for (const exportRequest of expiredExports) {
        try {
            // Delete the export file from storage
            if (exportRequest.downloadUrl) {
                await deleteExportFile(exportRequest.downloadUrl);
            }

            // Update database
            await prisma.dataExportRequest.update({
                where: { id: exportRequest.id },
                data: {
                    downloadUrl: null,
                    status: 'expired'
                }
            });

            console.log(`✅ Cleaned up export: ${exportRequest.id}`);
        } catch (error) {
            console.error(`❌ Failed to clean up export ${exportRequest.id}:`, error);
        }
    }
}

/**
 * Clean up inactive sessions
 */
async function cleanupInactiveSessions() {
    console.log('\n🔒 Cleaning up inactive sessions...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.sessions);

    const result = await prisma.session.deleteMany({
        where: {
            OR: [
                {
                    expires: {
                        lt: new Date()
                    }
                },
                {
                    createdAt: {
                        lt: cutoffDate
                    }
                }
            ]
        }
    });

    console.log(`✅ Deleted ${result.count} inactive sessions`);
}

/**
 * Clean up expired tokens
 */
async function cleanupExpiredTokens() {
    console.log('\n🔑 Cleaning up expired tokens...');

    // Password reset tokens
    const passwordCutoff = new Date();
    passwordCutoff.setDate(passwordCutoff.getDate() - RETENTION_POLICIES.passwordResetTokens);

    const passwordTokens = await prisma.verificationToken.deleteMany({
        where: {
            expires: {
                lt: new Date()
            }
        }
    });

    console.log(`✅ Deleted ${passwordTokens.count} expired tokens`);
}

/**
 * Anonymize old analytics data
 */
async function anonymizeOldAnalytics() {
    console.log('\n📊 Anonymizing old analytics data...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.anonymousAnalytics);

    // Anonymize audit logs (keep for analytics but remove PII)
    const result = await prisma.auditLog.updateMany({
        where: {
            createdAt: {
                lt: cutoffDate
            },
            userId: {
                not: 'ANONYMIZED'
            }
        },
        data: {
            userId: 'ANONYMIZED',
            ipAddress: '0.0.0.0',
            userAgent: 'ANONYMIZED',
            location: null
        }
    });

    console.log(`✅ Anonymized ${result.count} old audit log entries`);
}

/**
 * Helper: Delete export file from storage
 */
async function deleteExportFile(url: string): Promise<void> {
    // In production, delete from S3, CloudFlare R2, etc.
    console.log(`🗑️  Would delete file: ${url}`);
    // await s3.deleteObject({ Bucket: 'exports', Key: filename });
}

/**
 * Generate cleanup report
 */
async function generateReport() {
    console.log('\n📈 Cleanup Statistics:');
    console.log('====================');

    // Count records by category
    const emailCount = await prisma.email.count();
    const auditLogCount = await prisma.auditLog.count();
    const sessionCount = await prisma.session.count();
    const exportCount = await prisma.dataExportRequest.count({
        where: { status: 'completed' }
    });

    console.log(`Emails: ${emailCount.toLocaleString()}`);
    console.log(`Audit Logs: ${auditLogCount.toLocaleString()}`);
    console.log(`Active Sessions: ${sessionCount.toLocaleString()}`);
    console.log(`Data Exports: ${exportCount.toLocaleString()}`);

    // Pending deletions
    const pendingDeletions = await prisma.deletionRequest.count({
        where: { status: 'scheduled' }
    });
    console.log(`Pending Account Deletions: ${pendingDeletions}`);
}

/**
 * Run the cleanup job
 */
if (require.main === module) {
    runCleanup()
        .then(() => generateReport())
        .then(() => {
            console.log('\n✨ All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fatal error:', error);
            process.exit(1);
        });
}

export { runCleanup, generateReport };

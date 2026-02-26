/**
 * GDPR Compliance System for MemoLib
 * Implements EU General Data Protection Regulation requirements
 * 
 * Key Features:
 * - Right to Access (Article 15)
 * - Right to Rectification (Article 16)
 * - Right to Erasure / "Right to be Forgotten" (Article 17)
 * - Right to Data Portability (Article 20)
 * - Consent Management (Article 7)
 * - Data Breach Notification (Article 33)
 */

import { prisma } from '@/lib/prisma';

export type ConsentType =
    | 'essential'      // Required for service operation
    | 'analytics'      // Google Analytics, Mixpanel, etc.
    | 'marketing'      // Email marketing, ads
    | 'personalization' // User preferences, recommendations
    | 'third_party';   // Social media, external integrations

export type DataCategory =
    | 'profile'        // Name, email, avatar
    | 'communications' // Emails, messages, notes
    | 'financial'      // Payment history, invoices
    | 'usage'          // Activity logs, analytics
    | 'preferences'    // Settings, consents
    | 'technical';     // IP addresses, device info

export interface ConsentRecord {
    type: ConsentType;
    granted: boolean;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    version: string; // Policy version
}

export interface DataExportRequest {
    userId: string;
    requestedAt: Date;
    categories: DataCategory[];
    format: 'json' | 'csv' | 'pdf';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: Date;
}

export interface DeletionRequest {
    userId: string;
    requestedAt: Date;
    scheduledFor: Date; // 30-day grace period
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
    reason?: string;
}

/**
 * GDPR Compliance Manager
 */
export class GDPRCompliance {

    /**
     * Record user consent
     */
    static async recordConsent(
        userId: string,
        consent: Omit<ConsentRecord, 'timestamp'>
    ): Promise<void> {
        await prisma.userConsent.create({
            data: {
                userId,
                type: consent.type,
                granted: consent.granted,
                ipAddress: consent.ipAddress,
                userAgent: consent.userAgent,
                policyVersion: consent.version,
                grantedAt: new Date()
            }
        });
    }

    /**
     * Get user consents
     */
    static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
        const consents = await prisma.userConsent.findMany({
            where: { userId },
            orderBy: { grantedAt: 'desc' }
        });

        return consents.map((c: any) => ({
            type: c.type as ConsentType,
            granted: c.granted,
            timestamp: c.grantedAt,
            ipAddress: c.ipAddress,
            userAgent: c.userAgent,
            version: c.policyVersion
        }));
    }

    /**
     * Check if user has granted specific consent
     */
    static async hasConsent(
        userId: string,
        type: ConsentType
    ): Promise<boolean> {
        const consent = await prisma.userConsent.findFirst({
            where: { userId, type },
            orderBy: { grantedAt: 'desc' }
        });

        return consent?.granted ?? false;
    }

    /**
     * Export user data (Article 15 & 20)
     */
    static async exportUserData(
        userId: string,
        categories: DataCategory[] = ['profile', 'communications', 'financial', 'usage', 'preferences', 'technical']
    ): Promise<any> {
        const exportData: any = {
            exportedAt: new Date().toISOString(),
            userId,
            categories: {}
        };

        // Profile data
        if (categories.includes('profile')) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            exportData.categories.profile = user;
        }

        // Communications
        if (categories.includes('communications')) {
            const emails = await prisma.email.findMany({
                where: { userId },
                select: {
                    id: true,
                    subject: true,
                    from: true,
                    to: true,
                    receivedAt: true,
                    body: true,
                    labels: true
                }
            });
            exportData.categories.communications = { emails };
        }

        // Financial data
        if (categories.includes('financial')) {
            const stripeCustomer = await prisma.stripeCustomer.findUnique({
                where: { userId },
                include: {
                    paymentIntents: true,
                    invoices: true
                }
            });

            const subscriptions = await prisma.subscription.findMany({
                where: { userId }
            });

            exportData.categories.financial = {
                stripeCustomerId: stripeCustomer?.stripeCustomerId,
                paymentHistory: stripeCustomer?.paymentIntents,
                invoices: stripeCustomer?.invoices,
                subscriptions
            };
        }

        // Usage data
        if (categories.includes('usage')) {
            const auditLogs = await prisma.auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 1000 // Last 1000 events
            });
            exportData.categories.usage = { auditLogs };
        }

        // Preferences
        if (categories.includes('preferences')) {
            const consents = await this.getUserConsents(userId);
            const settings = await prisma.userSettings.findUnique({
                where: { userId }
            });
            exportData.categories.preferences = { consents, settings };
        }

        // Technical data
        if (categories.includes('technical')) {
            const sessions = await prisma.session.findMany({
                where: { userId },
                select: {
                    id: true,
                    sessionToken: true,
                    expires: true,
                    createdAt: true
                }
            });
            exportData.categories.technical = { sessions };
        }

        return exportData;
    }

    /**
     * Create data export request
     */
    static async requestDataExport(
        userId: string,
        format: 'json' | 'csv' | 'pdf' = 'json',
        categories?: DataCategory[]
    ): Promise<string> {
        const request = await prisma.dataExportRequest.create({
            data: {
                userId,
                format,
                categories: categories || ['profile', 'communications', 'financial', 'usage', 'preferences', 'technical'],
                status: 'pending',
                requestedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Trigger async job to generate export
        // In production, use background job queue (Bull, BullMQ, etc.)
        this.processDataExport(request.id).catch(console.error);

        return request.id;
    }

    /**
     * Process data export (background job)
     */
    private static async processDataExport(requestId: string): Promise<void> {
        try {
            const request = await prisma.dataExportRequest.findUnique({
                where: { id: requestId }
            });

            if (!request) return;

            // Update status
            await prisma.dataExportRequest.update({
                where: { id: requestId },
                data: { status: 'processing' }
            });

            // Export data
            const data = await this.exportUserData(
                request.userId,
                request.categories as DataCategory[]
            );

            // Generate file
            const filename = `gdpr-export-${request.userId}-${Date.now()}.${request.format}`;
            let content: string = '';

            switch (request.format) {
                case 'json':
                    content = JSON.stringify(data, null, 2);
                    break;
                case 'csv':
                    content = this.convertToCSV(data);
                    break;
                case 'pdf':
                    content = await this.convertToPDF(data);
                    break;
            }

            // Upload to storage (S3, CloudFlare R2, etc.)
            const downloadUrl = await this.uploadExportFile(filename, content);

            // Update request
            await prisma.dataExportRequest.update({
                where: { id: requestId },
                data: {
                    status: 'completed',
                    downloadUrl,
                    completedAt: new Date()
                }
            });

            // Send email notification
            await this.notifyExportReady(request.userId, downloadUrl);

        } catch (error) {
            console.error('Export failed:', error);
            await prisma.dataExportRequest.update({
                where: { id: requestId },
                data: { status: 'failed' }
            });
        }
    }

    /**
     * Request account deletion (Article 17)
     */
    static async requestDeletion(
        userId: string,
        reason?: string
    ): Promise<DeletionRequest> {
        // Check if user has active subscriptions
        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: ['active', 'trialing'] }
            }
        });

        if (activeSubscription) {
            throw new Error('Cannot delete account with active subscription. Please cancel first.');
        }

        // Schedule deletion for 30 days from now (grace period)
        const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const deletion = await prisma.deletionRequest.create({
            data: {
                userId,
                reason,
                requestedAt: new Date(),
                scheduledFor,
                status: 'scheduled'
            }
        });

        // Send confirmation email
        await this.notifyDeletionScheduled(userId, scheduledFor);

        return {
            userId: deletion.userId,
            requestedAt: deletion.requestedAt,
            scheduledFor: deletion.scheduledFor,
            status: deletion.status as any,
            reason: deletion.reason || undefined
        };
    }

    /**
     * Cancel deletion request
     */
    static async cancelDeletion(userId: string): Promise<void> {
        await prisma.deletionRequest.updateMany({
            where: {
                userId,
                status: 'scheduled'
            },
            data: {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        });

        await this.notifyDeletionCancelled(userId);
    }

    /**
     * Execute account deletion (run by cron job)
     */
    static async executeDeletion(userId: string): Promise<void> {
        // Anonymize or delete data based on legal requirements

        // 1. Delete user data
        await prisma.email.deleteMany({ where: { userId } });
        await prisma.note.deleteMany({ where: { userId } });
        await prisma.workspace.deleteMany({ where: { userId } });

        // 2. Anonymize financial records (keep for tax/legal, but remove PII)
        await prisma.stripeCustomer.updateMany({
            where: { userId },
            data: {
                email: `deleted-${userId}@anonymized.local`
            }
        });

        // 3. Anonymize audit logs
        await prisma.auditLog.updateMany({
            where: { userId },
            data: {
                userId: 'DELETED',
                metadata: { anonymized: true }
            }
        });

        // 4. Delete user account
        await prisma.user.update({
            where: { id: userId },
            data: {
                email: `deleted-${userId}@anonymized.local`,
                name: 'Deleted User',
                image: null,
                deletedAt: new Date()
            }
        });

        // 5. Update deletion request
        await prisma.deletionRequest.updateMany({
            where: { userId, status: 'scheduled' },
            data: {
                status: 'completed',
                executedAt: new Date()
            }
        });
    }

    /**
     * Data breach notification (Article 33)
     */
    static async reportDataBreach(
        affectedUserIds: string[],
        breachType: string,
        description: string,
        severity: 'low' | 'medium' | 'high' | 'critical'
    ): Promise<void> {
        const breach = await prisma.dataBreach.create({
            data: {
                breachType,
                description,
                severity,
                affectedUsers: affectedUserIds.length,
                discoveredAt: new Date(),
                notifiedAt: null
            }
        });

        // If high/critical, notify supervisory authority within 72h (Article 33)
        if (severity === 'high' || severity === 'critical') {
            await this.notifySupervisoryAuthority(breach.id);
        }

        // Notify affected users (Article 34)
        for (const userId of affectedUserIds) {
            await this.notifyUserOfBreach(userId, breach.id);
        }

        await prisma.dataBreach.update({
            where: { id: breach.id },
            data: { notifiedAt: new Date() }
        });
    }

    /**
     * Helper: Convert data to CSV
     */
    private static convertToCSV(data: any): string {
        // Simplified CSV conversion
        // In production, use library like papaparse
        return JSON.stringify(data);
    }

    /**
     * Helper: Convert data to PDF
     */
    private static async convertToPDF(data: any): Promise<string> {
        // Use library like puppeteer, pdfkit, jsPDF
        return JSON.stringify(data);
    }

    /**
     * Helper: Upload export file
     */
    private static async uploadExportFile(
        filename: string,
        content: string
    ): Promise<string> {
        // Upload to S3, CloudFlare R2, etc.
        // For now, return mock URL
        return `https://exports.memolib.com/${filename}`;
    }

    /**
     * Helper: Notify export ready
     */
    private static async notifyExportReady(
        userId: string,
        downloadUrl: string
    ): Promise<void> {
        // Send email via your email service
        console.log(`Export ready for user ${userId}: ${downloadUrl}`);
    }

    /**
     * Helper: Notify deletion scheduled
     */
    private static async notifyDeletionScheduled(
        userId: string,
        scheduledFor: Date
    ): Promise<void> {
        console.log(`Deletion scheduled for user ${userId} on ${scheduledFor}`);
    }

    /**
     * Helper: Notify deletion cancelled
     */
    private static async notifyDeletionCancelled(userId: string): Promise<void> {
        console.log(`Deletion cancelled for user ${userId}`);
    }

    /**
     * Helper: Notify supervisory authority
     */
    private static async notifySupervisoryAuthority(breachId: string): Promise<void> {
        // Report to relevant DPA (Data Protection Authority)
        console.log(`Breach ${breachId} reported to supervisory authority`);
    }

    /**
     * Helper: Notify user of data breach
     */
    private static async notifyUserOfBreach(
        userId: string,
        breachId: string
    ): Promise<void> {
        console.log(`User ${userId} notified of breach ${breachId}`);
    }
}

/**
 * Cookie Consent Categories (GDPR compliance)
 */
export const COOKIE_CATEGORIES = {
    essential: {
        name: 'Essential',
        description: 'Required for the website to function. Cannot be disabled.',
        required: true,
        cookies: ['session', 'csrf_token', 'auth_token']
    },
    analytics: {
        name: 'Analytics',
        description: 'Help us understand how visitors use our website.',
        required: false,
        cookies: ['_ga', '_gid', '_gat', 'mixpanel']
    },
    marketing: {
        name: 'Marketing',
        description: 'Used to track visitors across websites for advertising.',
        required: false,
        cookies: ['_fbp', '_gcl_au', 'ads_conversion']
    },
    personalization: {
        name: 'Personalization',
        description: 'Remember your preferences and settings.',
        required: false,
        cookies: ['theme', 'language', 'sidebar_state']
    }
} as const;

/**
 * Data retention periods (GDPR Article 5)
 */
export const DATA_RETENTION = {
    emails: 365,              // 1 year
    auditLogs: 730,           // 2 years
    financialRecords: 2555,   // 7 years (tax requirement)
    anonymousAnalytics: 1095, // 3 years
    deletedAccounts: 30       // 30 day grace period
} as const;

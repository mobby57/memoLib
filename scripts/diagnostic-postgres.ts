#!/usr/bin/env node
/**
 * Database Diagnostic Script for PostgreSQL
 * Runs health checks and stores results in DatabaseDiagnosticLog
 * 
 * Usage:
 *   npx ts-node scripts/diagnostic-postgres.ts
 *   npx ts-node scripts/diagnostic-postgres.ts --slack
 *   npx ts-node scripts/diagnostic-postgres.ts --verbose
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DiagnosticResult {
  timestamp: Date;
  schemaStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  accessGrantColumns: number;
  accessGrantColumnsOk: boolean;
  enumAccessGrantExists: boolean;
  enumValues: string | null;
  foreignKeyCount: number;
  foreignKeysValid: boolean;
  foreignKeyDetails: string | null;
  indexCount: number;
  indexesValid: boolean;
  indexDetails: string | null;
  accessGrantRowCount: number;
  invitationRowCount: number;
  dossierRowCount: number;
  userRowCount: number;
  connectionOk: boolean;
  connectionError: string | null;
  responseTimeMs: number | null;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'ERROR';
  healthScore: number;
  issues: string[];
  warnings: string[];
  databaseVersion: string | null;
  databaseSize: number | null;
  diagnosticDuration: number;
  error: string | null;
}

class PostgresDiagnostic {
  private pool: Pool;
  private startTime: number;
  private result: DiagnosticResult;
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.startTime = Date.now();
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });

    this.result = {
      timestamp: new Date(),
      schemaStatus: 'HEALTHY',
      accessGrantColumns: 0,
      accessGrantColumnsOk: false,
      enumAccessGrantExists: false,
      enumValues: null,
      foreignKeyCount: 0,
      foreignKeysValid: true,
      foreignKeyDetails: null,
      indexCount: 0,
      indexesValid: true,
      indexDetails: null,
      accessGrantRowCount: 0,
      invitationRowCount: 0,
      dossierRowCount: 0,
      userRowCount: 0,
      connectionOk: false,
      connectionError: null,
      responseTimeMs: null,
      overallHealth: 'UNKNOWN' as any,
      healthScore: 0,
      issues: [],
      warnings: [],
      databaseVersion: null,
      databaseSize: null,
      diagnosticDuration: 0,
      error: null,
    };
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (this.verbose) {
      const prefix = `[${level.toUpperCase()}]`;
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    this.log('Testing database connection...');
    const start = Date.now();

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      this.result.connectionOk = true;
      this.result.responseTimeMs = Date.now() - start;
      this.log(`✅ Connection OK (${this.result.responseTimeMs}ms)`);
    } catch (error: any) {
      this.result.connectionOk = false;
      this.result.connectionError = error.message;
      this.result.issues.push(`Database connection failed: ${error.message}`);
      this.log(`❌ Connection FAILED: ${error.message}`, 'error');
      throw error; // Fatal error
    }
  }

  /**
   * Get database version
   */
  private async getDatabaseVersion(): Promise<void> {
    this.log('Fetching database version...');

    try {
      const client = await this.pool.connect();
      const result = await client.query("SELECT version()");
      client.release();

      const version = result.rows[0]?.version || 'Unknown';
      this.result.databaseVersion = version.split(',')[0]; // Get first part
      this.log(`ℹ️ Database: ${this.result.databaseVersion}`);
    } catch (error: any) {
      this.log(`⚠️ Could not fetch version: ${error.message}`, 'warn');
    }
  }

  /**
   * Get database size
   */
  private async getDatabaseSize(): Promise<void> {
    this.log('Fetching database size...');

    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT pg_database_size(current_database()) / 1024.0 / 1024.0 as size_mb
      `);
      client.release();

      this.result.databaseSize = Math.round(result.rows[0]?.size_mb * 100) / 100;
      this.log(`ℹ️ Database size: ${this.result.databaseSize} MB`);
    } catch (error: any) {
      this.log(`⚠️ Could not fetch size: ${error.message}`, 'warn');
    }
  }

  /**
   * Check AccessGrant table columns
   */
  private async checkAccessGrantColumns(): Promise<void> {
    this.log('Checking AccessGrant columns...');

    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'AccessGrant'
        ORDER BY ordinal_position
      `);
      client.release();

      this.result.accessGrantColumns = result.rows.length;

      // Expected columns
      const expectedColumns = [
        'id',
        'invitationId',
        'clientUserId',
        'dossierId',
        'expiresAt',
        'revokedAt',
        'status',
        'createdAt',
        'updatedAt',
      ];

      const actualColumns = result.rows.map((r: any) => r.column_name);
      const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));
      const extraColumns = actualColumns.filter(c => !expectedColumns.includes(c));

      this.result.accessGrantColumnsOk = missingColumns.length === 0;

      if (missingColumns.length > 0) {
        this.result.schemaStatus = 'ERROR';
        this.result.issues.push(`Missing AccessGrant columns: ${missingColumns.join(', ')}`);
        this.log(`❌ Missing columns: ${missingColumns.join(', ')}`, 'error');
      } else {
        this.log(`✅ All expected columns present (${this.result.accessGrantColumns})`);
      }

      if (extraColumns.length > 0) {
        this.result.warnings.push(`Extra AccessGrant columns: ${extraColumns.join(', ')}`);
        this.log(`⚠️ Extra columns: ${extraColumns.join(', ')}`, 'warn');
      }
    } catch (error: any) {
      this.result.schemaStatus = 'ERROR';
      this.result.issues.push(`Failed to check AccessGrant columns: ${error.message}`);
      this.log(`❌ Error checking columns: ${error.message}`, 'error');
    }
  }

  /**
   * Check AccessGrantStatus enum exists
   */
  private async checkEnums(): Promise<void> {
    this.log('Checking enums...');

    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t
        LEFT JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'AccessGrantStatus'
        GROUP BY t.typname
      `);
      client.release();

      if (result.rows.length > 0) {
        this.result.enumAccessGrantExists = true;
        this.result.enumValues = JSON.stringify(result.rows[0].enum_values);
        this.log(`✅ AccessGrantStatus enum exists: ${result.rows[0].enum_values.join(', ')}`);
      } else {
        this.result.enumAccessGrantExists = false;
        this.result.schemaStatus = 'ERROR';
        this.result.issues.push('AccessGrantStatus enum does not exist');
        this.log(`❌ AccessGrantStatus enum NOT found`, 'error');
      }
    } catch (error: any) {
      this.result.issues.push(`Failed to check enums: ${error.message}`);
      this.log(`❌ Error checking enums: ${error.message}`, 'error');
    }
  }

  /**
   * Check foreign key constraints
   */
  private async checkForeignKeys(): Promise<void> {
    this.log('Checking foreign keys...');

    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT
          constraint_name,
          table_name,
          column_name,
          referenced_table_name
        FROM information_schema.referential_constraints
        WHERE table_name = 'AccessGrant'
        ORDER BY constraint_name
      `);
      client.release();

      this.result.foreignKeyCount = result.rows.length;
      this.result.foreignKeyDetails = JSON.stringify(result.rows);

      // Expected FK constraints (at minimum)
      const expectedFKs = ['invitationId', 'clientUserId', 'dossierId'];
      const actualFKs = result.rows.map((r: any) => r.column_name);

      const missingFKs = expectedFKs.filter(fk => 
        !actualFKs.some((actual: string) => actual.includes(fk.toLowerCase()))
      );

      if (missingFKs.length > 0) {
        this.result.foreignKeysValid = false;
        this.result.schemaStatus = 'WARNING';
        this.result.warnings.push(`Missing FK constraints: ${missingFKs.join(', ')}`);
        this.log(`⚠️ Missing FKs: ${missingFKs.join(', ')}`, 'warn');
      } else {
        this.log(`✅ All expected FK constraints present (${this.result.foreignKeyCount})`);
      }
    } catch (error: any) {
      this.result.foreignKeysValid = false;
      this.result.warnings.push(`Failed to check FKs: ${error.message}`);
      this.log(`⚠️ Error checking FKs: ${error.message}`, 'warn');
    }
  }

  /**
   * Check indexes
   */
  private async checkIndexes(): Promise<void> {
    this.log('Checking indexes...');

    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'AccessGrant'
        ORDER BY indexname
      `);
      client.release();

      this.result.indexCount = result.rows.length;
      this.result.indexDetails = JSON.stringify(result.rows);

      // Expected indexes
      const expectedIndexes = [
        'AccessGrant_pkey',
        'AccessGrant_invitationId_key',
        'AccessGrant_dossierId_idx',
        'AccessGrant_clientUserId_idx',
      ];

      const actualIndexes = result.rows.map((r: any) => r.indexname);
      const missingIndexes = expectedIndexes.filter(idx => !actualIndexes.includes(idx));

      if (missingIndexes.length > 0) {
        this.result.indexesValid = false;
        this.result.warnings.push(`Missing indexes: ${missingIndexes.join(', ')}`);
        this.log(`⚠️ Missing indexes: ${missingIndexes.join(', ')}`, 'warn');
      } else {
        this.log(`✅ All expected indexes present (${this.result.indexCount})`);
      }
    } catch (error: any) {
      this.result.indexesValid = false;
      this.result.warnings.push(`Failed to check indexes: ${error.message}`);
      this.log(`⚠️ Error checking indexes: ${error.message}`, 'warn');
    }
  }

  /**
   * Check table row counts
   */
  private async checkTableCounts(): Promise<void> {
    this.log('Checking table row counts...');

    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT
          'AccessGrant' as table_name, COUNT(*) as row_count FROM "AccessGrant"
        UNION ALL
        SELECT 'Invitation' as table_name, COUNT(*) as row_count FROM "Invitation"
        UNION ALL
        SELECT 'Dossier' as table_name, COUNT(*) as row_count FROM "Dossier"
        UNION ALL
        SELECT 'User' as table_name, COUNT(*) as row_count FROM "User"
      `);
      client.release();

      for (const row of result.rows) {
        const count = parseInt(row.row_count, 10);
        switch (row.table_name) {
          case 'AccessGrant':
            this.result.accessGrantRowCount = count;
            break;
          case 'Invitation':
            this.result.invitationRowCount = count;
            break;
          case 'Dossier':
            this.result.dossierRowCount = count;
            break;
          case 'User':
            this.result.userRowCount = count;
            break;
        }
      }

      this.log(
        `✅ Row counts: AccessGrant=${this.result.accessGrantRowCount}, ` +
        `Invitation=${this.result.invitationRowCount}, ` +
        `Dossier=${this.result.dossierRowCount}, ` +
        `User=${this.result.userRowCount}`
      );
    } catch (error: any) {
      this.result.warnings.push(`Failed to check row counts: ${error.message}`);
      this.log(`⚠️ Error checking row counts: ${error.message}`, 'warn');
    }
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(): void {
    let score = 100;

    // Connection
    if (!this.result.connectionOk) score -= 50;

    // Schema
    if (!this.result.accessGrantColumnsOk) score -= 20;
    if (!this.result.enumAccessGrantExists) score -= 15;
    if (!this.result.foreignKeysValid) score -= 10;
    if (!this.result.indexesValid) score -= 5;

    // Warnings reduce score slightly
    score -= Math.min(this.result.warnings.length * 2, 10);

    this.result.healthScore = Math.max(0, score);

    // Determine overall health
    if (this.result.issues.length > 0) {
      this.result.overallHealth = 'CRITICAL';
    } else if (this.result.warnings.length > 0) {
      this.result.overallHealth = 'DEGRADED';
    } else if (this.result.connectionOk && this.result.schemaStatus === 'HEALTHY') {
      this.result.overallHealth = 'HEALTHY';
    } else {
      this.result.overallHealth = 'ERROR';
    }

    this.log(`ℹ️ Health score: ${this.result.healthScore}/100 (${this.result.overallHealth})`);
  }

  /**
   * Run all diagnostics
   */
  async run(): Promise<DiagnosticResult> {
    this.log('Starting PostgreSQL diagnostic...');

    try {
      await this.testConnection();
      await this.getDatabaseVersion();
      await this.getDatabaseSize();
      await this.checkAccessGrantColumns();
      await this.checkEnums();
      await this.checkForeignKeys();
      await this.checkIndexes();
      await this.checkTableCounts();
      this.calculateHealthScore();
    } catch (error: any) {
      this.result.overallHealth = 'ERROR';
      this.result.error = error.message;
      this.log(`❌ Diagnostic failed: ${error.message}`, 'error');
    }

    this.result.diagnosticDuration = Date.now() - this.startTime;
    this.log(`⏱️ Diagnostic completed in ${this.result.diagnosticDuration}ms`);

    return this.result;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Save diagnostic result to database
 */
async function saveDiagnosticResult(result: DiagnosticResult): Promise<void> {
  try {
    await prisma.databaseDiagnosticLog.create({
      data: {
        timestamp: result.timestamp,
        schemaStatus: result.schemaStatus,
        accessGrantColumns: result.accessGrantColumns,
        accessGrantColumnsOk: result.accessGrantColumnsOk,
        enumAccessGrantExists: result.enumAccessGrantExists,
        enumValues: result.enumValues,
        foreignKeyCount: result.foreignKeyCount,
        foreignKeysValid: result.foreignKeysValid,
        foreignKeyDetails: result.foreignKeyDetails,
        indexCount: result.indexCount,
        indexesValid: result.indexesValid,
        indexDetails: result.indexDetails,
        accessGrantRowCount: result.accessGrantRowCount,
        invitationRowCount: result.invitationRowCount,
        dossierRowCount: result.dossierRowCount,
        userRowCount: result.userRowCount,
        connectionOk: result.connectionOk,
        connectionError: result.connectionError,
        responseTimeMs: result.responseTimeMs,
        overallHealth: result.overallHealth,
        healthScore: result.healthScore,
        issues: JSON.stringify(result.issues),
        warnings: JSON.stringify(result.warnings),
        databaseVersion: result.databaseVersion,
        databaseSize: result.databaseSize,
        diagnosticDuration: result.diagnosticDuration,
        error: result.error,
        triggeredBy: 'manual',
      },
    });

    console.log('✅ Diagnostic result saved to database');
  } catch (error: any) {
    console.error('❌ Failed to save diagnostic result:', error.message);
    throw error;
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(result: DiagnosticResult): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️ SLACK_WEBHOOK_URL not set, skipping Slack notification');
    return;
  }

  const color =
    result.overallHealth === 'HEALTHY'
      ? '#36a64f'
      : result.overallHealth === 'DEGRADED'
        ? '#ff9500'
        : '#ff0000';

  const issuesText = result.issues.length > 0
    ? `🔴 *Issues:*\n${result.issues.map(i => `• ${i}`).join('\n')}`
    : '✅ No issues';

  const warningsText = result.warnings.length > 0
    ? `\n⚠️ *Warnings:*\n${result.warnings.map(w => `• ${w}`).join('\n')}`
    : '';

  const payload = {
    attachments: [
      {
        color,
        title: `PostgreSQL Database Diagnostic - ${result.overallHealth}`,
        text: `Health Score: ${result.healthScore}/100`,
        fields: [
          {
            title: 'Connection',
            value: result.connectionOk ? '✅ OK' : `❌ FAILED: ${result.connectionError}`,
            short: true,
          },
          {
            title: 'Response Time',
            value: result.responseTimeMs ? `${result.responseTimeMs}ms` : 'N/A',
            short: true,
          },
          {
            title: 'Schema Status',
            value: result.schemaStatus,
            short: true,
          },
          {
            title: 'Database Size',
            value: result.databaseSize ? `${result.databaseSize} MB` : 'N/A',
            short: true,
          },
          {
            title: 'Row Counts',
            value: `AccessGrant: ${result.accessGrantRowCount}, Invitation: ${result.invitationRowCount}, Dossier: ${result.dossierRowCount}, User: ${result.userRowCount}`,
            short: false,
          },
          {
            title: 'Details',
            value: `${issuesText}${warningsText}`,
            short: false,
          },
        ],
        footer: `Diagnostic Duration: ${result.diagnosticDuration}ms`,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('✅ Slack notification sent');
    } else {
      console.error('❌ Failed to send Slack notification:', response.statusText);
    }
  } catch (error: any) {
    console.error('❌ Error sending Slack notification:', error.message);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const sendSlack = args.includes('--slack');

  console.log('🔍 PostgreSQL Database Diagnostic\n');

  const diagnostic = new PostgresDiagnostic(verbose);

  try {
    const result = await diagnostic.run();

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`  Health: ${result.overallHealth} (${result.healthScore}/100)`);
    console.log(`  Issues: ${result.issues.length}`);
    console.log(`  Warnings: ${result.warnings.length}`);
    console.log(`  Duration: ${result.diagnosticDuration}ms`);

    // Save to database
    await saveDiagnosticResult(result);

    // Send Slack notification if requested
    if (sendSlack) {
      await sendSlackNotification(result);
    }

    // Exit with error if critical
    if (result.overallHealth === 'CRITICAL' || result.overallHealth === 'ERROR') {
      process.exit(1);
    }
  } finally {
    await diagnostic.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

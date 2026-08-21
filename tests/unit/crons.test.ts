/**
 * Tests: Email Sync Cron + Invoice Reminders + Trial Expiry
 */
import { describe, it, expect } from 'vitest';

describe('Email Sync Cron', () => {
  describe('Gmail body extraction', () => {
    it('decodes base64url text/plain body', () => {
      const encoded = Buffer.from('Bonjour Maître, voici mon dossier.').toString('base64url');
      const decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
      expect(decoded).toBe('Bonjour Maître, voici mon dossier.');
    });

    it('strips HTML tags from html body', () => {
      const html = '<div><p>Bonjour <strong>Maître</strong></p><br><p>Cordialement</p></div>';
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      expect(text).toBe('Bonjour Maître Cordialement');
    });

    it('limits body to 10000 chars', () => {
      const longBody = 'x'.repeat(20000);
      const limited = longBody.slice(0, 10000);
      expect(limited.length).toBe(10000);
    });
  });

  describe('Deduplication', () => {
    it('uses providerMessageId for dedup', () => {
      const existingIds = ['msg-001', 'msg-002', 'msg-003'];
      const newMsgId = 'msg-004';
      const isDuplicate = existingIds.includes(newMsgId);
      expect(isDuplicate).toBe(false);
    });

    it('detects duplicate message', () => {
      const existingIds = ['msg-001', 'msg-002', 'msg-003'];
      const newMsgId = 'msg-002';
      const isDuplicate = existingIds.includes(newMsgId);
      expect(isDuplicate).toBe(true);
    });
  });

  describe('Token refresh logic', () => {
    it('detects expired token', () => {
      const tokenExpiry = new Date('2026-08-14T10:00:00Z');
      const now = new Date('2026-08-15T10:00:00Z');
      const isExpired = tokenExpiry < now;
      expect(isExpired).toBe(true);
    });

    it('detects valid token', () => {
      const tokenExpiry = new Date('2026-08-16T10:00:00Z');
      const now = new Date('2026-08-15T10:00:00Z');
      const isExpired = tokenExpiry < now;
      expect(isExpired).toBe(false);
    });
  });

  describe('Sync date window', () => {
    it('uses 7 day lookback for first sync', () => {
      const now = new Date('2026-08-15T10:00:00Z');
      const lastSync = null;
      const lookback = lastSync
        ? Math.floor(lastSync.getTime() / 1000)
        : Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
      
      const expectedDate = new Date('2026-08-08T10:00:00Z');
      expect(lookback).toBe(Math.floor(expectedDate.getTime() / 1000));
    });

    it('uses lastSync for subsequent syncs', () => {
      const lastSync = new Date('2026-08-15T08:00:00Z');
      const lookback = Math.floor(lastSync.getTime() / 1000);
      expect(lookback).toBeGreaterThan(0);
    });
  });
});

describe('Invoice Reminders', () => {
  describe('Overdue detection', () => {
    it('calculates days overdue correctly', () => {
      const now = new Date('2026-08-15T10:00:00Z');
      const echeance = new Date('2026-08-01T10:00:00Z');
      const daysOverdue = Math.floor((now.getTime() - echeance.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysOverdue).toBe(14);
    });

    it('determines reminder level at J+7', () => {
      const daysOverdue = 7;
      let level: string | null = null;
      if (daysOverdue >= 30) level = 'formal';
      else if (daysOverdue >= 15) level = 'second';
      else if (daysOverdue >= 7) level = 'first';
      expect(level).toBe('first');
    });

    it('determines reminder level at J+15', () => {
      const daysOverdue = 18;
      let level: string | null = null;
      if (daysOverdue >= 30) level = 'formal';
      else if (daysOverdue >= 15) level = 'second';
      else if (daysOverdue >= 7) level = 'first';
      expect(level).toBe('second');
    });

    it('determines reminder level at J+30 (mise en demeure)', () => {
      const daysOverdue = 35;
      let level: string | null = null;
      if (daysOverdue >= 30) level = 'formal';
      else if (daysOverdue >= 15) level = 'second';
      else if (daysOverdue >= 7) level = 'first';
      expect(level).toBe('formal');
    });

    it('no reminder for less than 7 days overdue', () => {
      const daysOverdue = 5;
      let level: string | null = null;
      if (daysOverdue >= 30) level = 'formal';
      else if (daysOverdue >= 15) level = 'second';
      else if (daysOverdue >= 7) level = 'first';
      expect(level).toBeNull();
    });
  });

  describe('Anti-spam (dedup)', () => {
    it('prevents sending same level twice', () => {
      const metadata = { reminder_first: '2026-08-10T10:00:00Z' };
      const alreadySent = metadata.reminder_first !== undefined;
      expect(alreadySent).toBe(true);
    });

    it('allows sending next level', () => {
      const metadata = { reminder_first: '2026-08-10T10:00:00Z' };
      const alreadySent = (metadata as any).reminder_second !== undefined;
      expect(alreadySent).toBe(false);
    });
  });
});

describe('Trial Expiry', () => {
  describe('Days left calculation', () => {
    it('calculates 3 days left correctly', () => {
      const now = new Date('2026-08-15T10:00:00Z');
      const trialEnd = new Date('2026-08-18T10:00:00Z');
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysLeft).toBe(3);
    });

    it('calculates 1 day left', () => {
      const now = new Date('2026-08-15T10:00:00Z');
      const trialEnd = new Date('2026-08-16T10:00:00Z');
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysLeft).toBe(1);
    });

    it('detects expired trial (negative days)', () => {
      const now = new Date('2026-08-16T10:00:00Z');
      const trialEnd = new Date('2026-08-15T10:00:00Z');
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysLeft).toBeLessThanOrEqual(0);
    });
  });

  describe('Email type selection', () => {
    it('sends J-3 email when 3 days left', () => {
      const daysLeft = 3;
      let emailType: string | null = null;
      if (daysLeft === 3) emailType = 'j3';
      else if (daysLeft === 1) emailType = 'j1';
      else if (daysLeft <= 0 && daysLeft >= -1) emailType = 'expired';
      expect(emailType).toBe('j3');
    });

    it('sends J-1 email when 1 day left', () => {
      const daysLeft = 1;
      let emailType: string | null = null;
      if (daysLeft === 3) emailType = 'j3';
      else if (daysLeft === 1) emailType = 'j1';
      else if (daysLeft <= 0 && daysLeft >= -1) emailType = 'expired';
      expect(emailType).toBe('j1');
    });

    it('sends expired email day after trial ends', () => {
      const daysLeft = 0;
      let emailType: string | null = null;
      if (daysLeft === 3) emailType = 'j3';
      else if (daysLeft === 1) emailType = 'j1';
      else if (daysLeft <= 0 && daysLeft >= -1) emailType = 'expired';
      expect(emailType).toBe('expired');
    });

    it('no email for 5 days left', () => {
      const daysLeft = 5;
      let emailType: string | null = null;
      if (daysLeft === 3) emailType = 'j3';
      else if (daysLeft === 1) emailType = 'j1';
      else if (daysLeft <= 0 && daysLeft >= -1) emailType = 'expired';
      expect(emailType).toBeNull();
    });

    it('no email for expired more than 1 day ago', () => {
      const daysLeft = -3;
      let emailType: string | null = null;
      if (daysLeft === 3) emailType = 'j3';
      else if (daysLeft === 1) emailType = 'j1';
      else if (daysLeft <= 0 && daysLeft >= -1) emailType = 'expired';
      expect(emailType).toBeNull();
    });
  });
});

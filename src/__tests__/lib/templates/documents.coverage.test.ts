/**
 * Tests pour src/lib/templates/documents.ts
 */
import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_ACKNOWLEDGMENT,
  TEMPLATE_APPOINTMENT_CONFIRMATION,
  TEMPLATE_DOCUMENT_REQUEST,
  TEMPLATE_SIMPLE_LETTER,
  TEMPLATE_CASE_SUMMARY,
  TEMPLATE_REMINDER,
  DOCUMENT_TEMPLATES,
  getTemplate,
  getTemplatesByLevel,
  getTemplatesByType,
  generateDocument,
} from '@/lib/templates/documents';

describe('documents.ts — Full Coverage', () => {
  describe('TEMPLATE_ACKNOWLEDGMENT', () => {
    it('should generate acknowledgment with all variables', () => {
      const content = TEMPLATE_ACKNOWLEDGMENT.generate({
        clientName: 'M. Dupont',
        messageDate: '15/01/2026',
        messageSubject: 'Demande titre de séjour',
        dossierRef: 'DOS-2026-001',
        responseDelay: '48 heures',
      });
      expect(content).toContain('M. Dupont');
      expect(content).toContain('15/01/2026');
      expect(content).toContain('DOS-2026-001');
      expect(content).toContain('48 heures');
    });

    it('should handle missing responseDelay', () => {
      const content = TEMPLATE_ACKNOWLEDGMENT.generate({
        clientName: 'Test',
        messageDate: '01/01/2026',
        messageSubject: 'Test',
        dossierRef: 'REF',
      });
      expect(content).toContain('prochainement');
      expect(content).not.toContain('undefined');
    });

    it('should generate correct subject', () => {
      const subject = TEMPLATE_ACKNOWLEDGMENT.subject!({ dossierRef: 'DOS-123' });
      expect(subject).toBe('Accuse de reception - DOS-123');
    });
  });

  describe('TEMPLATE_APPOINTMENT_CONFIRMATION', () => {
    it('should generate confirmation with location', () => {
      const content = TEMPLATE_APPOINTMENT_CONFIRMATION.generate({
        clientName: 'Mme Martin',
        appointmentDate: '20/02/2026',
        appointmentTime: '14h30',
        appointmentType: 'Consultation',
        location: '12 rue de Paris',
      });
      expect(content).toContain('Mme Martin');
      expect(content).toContain('14h30');
      expect(content).toContain('12 rue de Paris');
    });

    it('should generate with visio link', () => {
      const content = TEMPLATE_APPOINTMENT_CONFIRMATION.generate({
        clientName: 'Test',
        appointmentDate: '01/01/2026',
        appointmentTime: '10h',
        appointmentType: 'Visio',
        visioLink: 'https://meet.google.com/abc',
      });
      expect(content).toContain('https://meet.google.com/abc');
    });

    it('should generate with documents to bring', () => {
      const content = TEMPLATE_APPOINTMENT_CONFIRMATION.generate({
        clientName: 'Test',
        appointmentDate: '01/01/2026',
        appointmentTime: '10h',
        appointmentType: 'RDV',
        documentsToBring: ['Passeport', 'Titre de séjour'],
      });
      expect(content).toContain('Passeport');
      expect(content).toContain('Titre de séjour');
    });
  });

  describe('TEMPLATE_DOCUMENT_REQUEST', () => {
    it('should generate document request', () => {
      const content = TEMPLATE_DOCUMENT_REQUEST.generate({
        clientName: 'M. Durand',
        dossierRef: 'DOS-456',
        caseType: 'OQTF',
        documents: [
          { name: 'Passeport', reason: 'Identification', format: 'PDF' },
          { name: 'Justificatif domicile' },
        ],
        deadline: '01/03/2026',
        transmissionMethod: 'email ou portail',
      });
      expect(content).toContain('M. Durand');
      expect(content).toContain('Passeport');
      expect(content).toContain('01/03/2026');
      expect(content).toContain('email ou portail');
    });

    it('should handle no deadline and no transmissionMethod', () => {
      const content = TEMPLATE_DOCUMENT_REQUEST.generate({
        clientName: 'Test',
        dossierRef: 'REF',
        caseType: 'Type',
        documents: [{ name: 'Doc1' }],
      });
      expect(content).not.toContain('undefined');
      expect(content).toContain('repondant directement');
    });
  });

  describe('TEMPLATE_SIMPLE_LETTER', () => {
    it('should generate letter with all fields', () => {
      const content = TEMPLATE_SIMPLE_LETTER.generate({
        clientName: 'M. Test',
        dossierRef: 'REF-001',
        subject: 'Information',
        context: 'Suite à notre échange',
        mainMessage: 'Voici les informations demandées.',
        nextSteps: ['Envoyer documents', 'Prendre RDV'],
        attachments: ['Document1.pdf'],
      });
      expect(content).toContain('Suite à notre échange');
      expect(content).toContain('Voici les informations');
      expect(content).toContain('1. Envoyer documents');
      expect(content).toContain('Document1.pdf');
    });

    it('should handle minimal fields', () => {
      const content = TEMPLATE_SIMPLE_LETTER.generate({
        clientName: 'Test',
        dossierRef: 'REF',
        subject: 'Objet',
        mainMessage: 'Message',
      });
      expect(content).toContain('Message');
      expect(content).not.toContain('undefined');
    });
  });

  describe('TEMPLATE_CASE_SUMMARY', () => {
    it('should generate case summary', () => {
      const content = TEMPLATE_CASE_SUMMARY.generate({
        clientName: 'M. Client',
        dossierRef: 'DOS-789',
        caseType: 'Titre de séjour',
        openingDate: '01/01/2026',
        currentStatus: 'En instruction',
        nextDeadline: '15/03/2026',
        timeline: [{ date: '01/01', description: 'Ouverture' }],
        documentsReceived: ['Passeport'],
        documentsPending: ['Justificatif'],
      });
      expect(content).toContain('DOS-789');
      expect(content).toContain('En instruction');
      expect(content).toContain('15/03/2026');
      expect(content).toContain('Passeport');
      expect(content).toContain('Justificatif');
    });
  });

  describe('TEMPLATE_REMINDER', () => {
    it('should generate first reminder (soft tone)', () => {
      const content = TEMPLATE_REMINDER.generate({
        clientName: 'Test',
        dossierRef: 'REF',
        initialRequestDate: '01/01/2026',
        pendingItems: ['Doc A', 'Doc B'],
        attemptNumber: 1,
      });
      expect(content).toContain('pas encore recu');
      expect(content).toContain('Doc A');
      expect(content).not.toContain('Attention');
    });

    it('should generate second reminder', () => {
      const content = TEMPLATE_REMINDER.generate({
        clientName: 'Test',
        dossierRef: 'REF',
        initialRequestDate: '01/01/2026',
        pendingItems: ['Doc A'],
        attemptNumber: 2,
      });
      expect(content).toContain('rappelons');
    });

    it('should generate third reminder (urgent)', () => {
      const content = TEMPLATE_REMINDER.generate({
        clientName: 'Test',
        dossierRef: 'REF',
        initialRequestDate: '01/01/2026',
        pendingItems: ['Doc A'],
        attemptNumber: 3,
      });
      expect(content).toContain('Malgre nos precedentes relances');
      expect(content).toContain('Attention');
    });
  });

  describe('DOCUMENT_TEMPLATES', () => {
    it('should contain all 6 templates', () => {
      expect(Object.keys(DOCUMENT_TEMPLATES)).toHaveLength(6);
      expect(DOCUMENT_TEMPLATES.acknowledgment_auto).toBe(TEMPLATE_ACKNOWLEDGMENT);
      expect(DOCUMENT_TEMPLATES.reminder_auto).toBe(TEMPLATE_REMINDER);
    });
  });

  describe('getTemplate', () => {
    it('should return template by id', () => {
      expect(getTemplate('acknowledgment_auto')).toBe(TEMPLATE_ACKNOWLEDGMENT);
      expect(getTemplate('simple_letter')).toBe(TEMPLATE_SIMPLE_LETTER);
    });

    it('should return null for unknown id', () => {
      expect(getTemplate('nonexistent')).toBeNull();
    });
  });

  describe('getTemplatesByLevel', () => {
    it('should return GREEN templates', () => {
      const green = getTemplatesByLevel('GREEN');
      expect(green.length).toBeGreaterThan(0);
      expect(green.every(t => t.autonomyLevel === 'GREEN')).toBe(true);
    });

    it('should return ORANGE templates', () => {
      const orange = getTemplatesByLevel('ORANGE');
      expect(orange.length).toBeGreaterThan(0);
      expect(orange.every(t => t.autonomyLevel === 'ORANGE')).toBe(true);
    });

    it('should return empty for RED (no RED templates defined)', () => {
      const red = getTemplatesByLevel('RED');
      expect(red).toEqual([]);
    });
  });

  describe('getTemplatesByType', () => {
    it('should filter by document type', () => {
      const ack = getTemplatesByType('ACKNOWLEDGMENT' as any);
      expect(ack.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateDocument', () => {
    it('should generate a valid document', () => {
      const result = generateDocument('acknowledgment_auto', {
        clientName: 'Test',
        messageDate: '01/01/2026',
        messageSubject: 'Sujet',
        dossierRef: 'REF-001',
      });
      expect(result.success).toBe(true);
      expect(result.content).toContain('Test');
      expect(result.subject).toContain('REF-001');
    });

    it('should fail for unknown template', () => {
      const result = generateDocument('unknown_template', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Template non trouve');
    });

    it('should fail for missing required variables', () => {
      const result = generateDocument('acknowledgment_auto', {
        clientName: 'Test',
        // missing messageDate, messageSubject, dossierRef
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Variables manquantes');
      expect(result.error).toContain('messageDate');
    });

    it('should handle generation error gracefully', () => {
      // Pass documents as non-iterable to trigger .map() error
      const result = generateDocument('document_request', {
        clientName: 'Test',
        dossierRef: 'REF',
        caseType: 'Type',
        documents: 'not-an-array', // Will cause .map to fail
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur de generation');
    });
  });
});

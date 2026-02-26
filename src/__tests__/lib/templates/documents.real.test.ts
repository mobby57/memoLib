/**
 * Real tests for templates/documents.ts to increase actual coverage
 * Tests document templates with their generate functions
 */

import {
  TEMPLATE_ACKNOWLEDGMENT,
  TEMPLATE_APPOINTMENT_CONFIRMATION,
  TEMPLATE_DOCUMENT_REQUEST,
  TEMPLATE_SIMPLE_LETTER,
  TEMPLATE_CASE_SUMMARY,
  TEMPLATE_REMINDER,
} from '@/lib/templates/documents'

describe('templates/documents - REAL TESTS', () => {
  describe('TEMPLATE_ACKNOWLEDGMENT', () => {
    it('should be defined with correct type', () => {
      expect(TEMPLATE_ACKNOWLEDGMENT).toBeDefined()
      expect(TEMPLATE_ACKNOWLEDGMENT.id).toBe('acknowledgment_auto')
    })

    it('should have GREEN autonomy level', () => {
      expect(TEMPLATE_ACKNOWLEDGMENT.autonomyLevel).toBe('GREEN')
    })

    it('should not require validation', () => {
      expect(TEMPLATE_ACKNOWLEDGMENT.requiresValidation).toBe(false)
    })

    it('should have required variables', () => {
      const requiredVars = TEMPLATE_ACKNOWLEDGMENT.variables.filter(v => v.required)
      expect(requiredVars.length).toBeGreaterThan(0)
      expect(requiredVars.map(v => v.name)).toContain('clientName')
    })

    it('should generate content with variables', () => {
      const vars = {
        clientName: 'M. Dupont',
        messageDate: '01/01/2024',
        messageSubject: 'Demande de titre',
        dossierRef: 'DOS-2024-001',
      }
      const content = TEMPLATE_ACKNOWLEDGMENT.generate(vars)
      expect(content).toContain('M. Dupont')
      expect(content).toContain('01/01/2024')
      expect(content).toContain('Demande de titre')
    })

    it('should generate subject line', () => {
      const vars = { dossierRef: 'DOS-2024-001' }
      const subject = TEMPLATE_ACKNOWLEDGMENT.subject?.(vars)
      expect(subject).toContain('DOS-2024-001')
    })
  })

  describe('TEMPLATE_APPOINTMENT_CONFIRMATION', () => {
    it('should be defined', () => {
      expect(TEMPLATE_APPOINTMENT_CONFIRMATION).toBeDefined()
    })

    it('should have appointment date variable', () => {
      const hasDateVar = TEMPLATE_APPOINTMENT_CONFIRMATION.variables.some(
        v => v.name.toLowerCase().includes('date') && v.type === 'date'
      )
      expect(hasDateVar).toBe(true)
    })

    it('should generate appointment confirmation', () => {
      const vars = {
        clientName: 'Mme Martin',
        appointmentDate: '15/01/2024',
        appointmentTime: '14:00',
        location: 'Cabinet Paris',
        dossierRef: 'DOS-2024-002',
      }
      const content = TEMPLATE_APPOINTMENT_CONFIRMATION.generate(vars)
      expect(content).toContain('Mme Martin')
      expect(content).toContain('15/01/2024')
    })
  })

  describe('TEMPLATE_DOCUMENT_REQUEST', () => {
    it('should be defined', () => {
      expect(TEMPLATE_DOCUMENT_REQUEST).toBeDefined()
    })

    it('should have ORANGE autonomy level (requires review)', () => {
      expect(TEMPLATE_DOCUMENT_REQUEST.autonomyLevel).toBe('ORANGE')
    })

    it('should require validation', () => {
      expect(TEMPLATE_DOCUMENT_REQUEST.requiresValidation).toBe(true)
    })

    it('should have documents list variable', () => {
      const docsVar = TEMPLATE_DOCUMENT_REQUEST.variables.find(
        v => v.name === 'documentsList' || v.type === 'list'
      )
      expect(docsVar).toBeDefined()
    })

    it('should generate document request', () => {
      const vars = {
        clientName: 'M. Dubois',
        caseType: 'Titre de séjour',
        documents: [
          { name: 'Passeport', reason: 'Identification' },
          { name: 'Justificatif de domicile' },
        ],
        deadline: '30/01/2024',
        dossierRef: 'DOS-2024-003',
      }
      const content = TEMPLATE_DOCUMENT_REQUEST.generate(vars)
      expect(content).toContain('M. Dubois')
      expect(content).toContain('Passeport')
    })
  })

  describe('TEMPLATE_SIMPLE_LETTER', () => {
    it('should be defined', () => {
      expect(TEMPLATE_SIMPLE_LETTER).toBeDefined()
    })

    it('should have mainMessage variable', () => {
      const msgVar = TEMPLATE_SIMPLE_LETTER.variables.find(
        v => v.name === 'mainMessage'
      )
      expect(msgVar).toBeDefined()
    })

    it('should generate formatted letter', () => {
      const vars = {
        clientName: 'M. Garcia',
        body: 'Contenu de la lettre',
        date: '01/02/2024',
      }
      const content = TEMPLATE_SIMPLE_LETTER.generate(vars)
      expect(content.length).toBeGreaterThan(0)
    })
  })

  describe('TEMPLATE_CASE_SUMMARY', () => {
    it('should be defined', () => {
      expect(TEMPLATE_CASE_SUMMARY).toBeDefined()
    })

    it('should be ORANGE or RED level (sensitive)', () => {
      expect(['ORANGE', 'RED']).toContain(TEMPLATE_CASE_SUMMARY.autonomyLevel)
    })

    it('should require validation', () => {
      expect(TEMPLATE_CASE_SUMMARY.requiresValidation).toBe(true)
    })

    it('should have case-related variables', () => {
      const varNames = TEMPLATE_CASE_SUMMARY.variables.map(v => v.name)
      expect(varNames.some(n => n.includes('dossier') || n.includes('case') || n.includes('client'))).toBe(true)
    })
  })

  describe('TEMPLATE_REMINDER', () => {
    it('should be defined', () => {
      expect(TEMPLATE_REMINDER).toBeDefined()
    })

    it('should have deadline variable', () => {
      const deadlineVar = TEMPLATE_REMINDER.variables.find(
        v => v.name.toLowerCase().includes('deadline') || v.name.toLowerCase().includes('date')
      )
      expect(deadlineVar).toBeDefined()
    })

    it('should generate reminder with proper variables', () => {
      const vars = {
        clientName: 'M. Lopez',
        dossierRef: 'DOS-2024-005',
        initialRequestDate: '01/01/2024',
        pendingItems: ['Passeport', 'Photos'],
        attemptNumber: 1,
      }
      const content = TEMPLATE_REMINDER.generate(vars)
      expect(content).toContain('M. Lopez')
      expect(content).toContain('Passeport')
    })
  })

  describe('All templates collection', () => {
    const allTemplates = [
      TEMPLATE_ACKNOWLEDGMENT,
      TEMPLATE_APPOINTMENT_CONFIRMATION,
      TEMPLATE_DOCUMENT_REQUEST,
      TEMPLATE_SIMPLE_LETTER,
      TEMPLATE_CASE_SUMMARY,
      TEMPLATE_REMINDER,
    ]

    it('should all have unique IDs', () => {
      const ids = allTemplates.map(t => t.id)
      const uniqueIds = [...new Set(ids)]
      expect(uniqueIds.length).toBe(ids.length)
    })

    it('should all have generate function', () => {
      allTemplates.forEach(template => {
        expect(typeof template.generate).toBe('function')
      })
    })

    it('should all have required variables array', () => {
      allTemplates.forEach(template => {
        expect(Array.isArray(template.variables)).toBe(true)
      })
    })
  })

  describe('Template variable types', () => {
    const allVariables = [
      ...TEMPLATE_ACKNOWLEDGMENT.variables,
      ...TEMPLATE_APPOINTMENT_CONFIRMATION.variables,
      ...TEMPLATE_DOCUMENT_REQUEST.variables,
    ]

    it('should have valid types', () => {
      const validTypes = ['text', 'date', 'number', 'list']
      allVariables.forEach(v => {
        expect(validTypes).toContain(v.type)
      })
    })

    it('should have descriptions', () => {
      allVariables.forEach(v => {
        expect(v.description).toBeDefined()
        expect(v.description.length).toBeGreaterThan(0)
      })
    })
  })
})

/**
 * Real tests for crypto.ts to increase actual coverage
 * Tests all cryptographic utility functions
 */

import crypto from 'crypto'
import {
  calculateHash,
  verifyHash,
  hashAuditEvent,
  hashDocument,
  verifyDocumentIntegrity,
} from '@/lib/crypto'

describe('crypto - REAL TESTS', () => {
  describe('calculateHash', () => {
    it('should calculate SHA-256 hash for string', () => {
      const data = 'test string'
      const hash = calculateHash(data)
      
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64) // SHA-256 = 64 hex chars
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should calculate SHA-256 hash for Buffer', () => {
      const data = Buffer.from('buffer data', 'utf-8')
      const hash = calculateHash(data)
      
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })

    it('should produce consistent hashes', () => {
      const data = 'consistent test'
      const hash1 = calculateHash(data)
      const hash2 = calculateHash(data)
      
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different data', () => {
      const hash1 = calculateHash('data1')
      const hash2 = calculateHash('data2')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should match native crypto module', () => {
      const data = 'verification data'
      const expected = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
      
      expect(calculateHash(data)).toBe(expected)
    })

    it('should handle empty string', () => {
      const hash = calculateHash('')
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })

    it('should handle unicode characters', () => {
      const data = 'Données françaises avec accents éèàù'
      const hash = calculateHash(data)
      
      expect(hash.length).toBe(64)
      expect(hash).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('verifyHash', () => {
    it('should return true for matching hash', () => {
      const data = 'secret data'
      const hash = calculateHash(data)
      
      expect(verifyHash(data, hash)).toBe(true)
    })

    it('should return false for non-matching hash', () => {
      const data = 'original data'
      const wrongHash = 'a'.repeat(64)
      
      expect(verifyHash(data, wrongHash)).toBe(false)
    })

    it('should work with Buffer', () => {
      const data = Buffer.from('buffer verification', 'utf-8')
      const hash = calculateHash(data)
      
      expect(verifyHash(data, hash)).toBe(true)
    })

    it('should detect data tampering', () => {
      const original = 'original content'
      const hash = calculateHash(original)
      const tampered = 'tampered content'
      
      expect(verifyHash(tampered, hash)).toBe(false)
    })
  })

  describe('hashAuditEvent', () => {
    it('should hash audit event object', () => {
      const event = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        action: 'CREATE',
        objectType: 'dossier',
        objectId: 'dossier-789',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        metadata: { reason: 'test' },
      }
      
      const hash = hashAuditEvent(event)
      
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })

    it('should produce consistent hashes for same event', () => {
      const event = {
        action: 'READ',
        objectType: 'client',
        timestamp: '2024-01-15T10:30:00.000Z',
      }
      
      const hash1 = hashAuditEvent(event)
      const hash2 = hashAuditEvent(event)
      
      expect(hash1).toBe(hash2)
    })

    it('should handle Date and string timestamps', () => {
      const dateEvent = {
        action: 'UPDATE',
        objectType: 'document',
        timestamp: new Date('2024-06-01T00:00:00Z'),
      }
      
      const stringEvent = {
        action: 'UPDATE',
        objectType: 'document',
        timestamp: '2024-06-01T00:00:00.000Z',
      }
      
      const hash1 = hashAuditEvent(dateEvent)
      const hash2 = hashAuditEvent(stringEvent)
      
      expect(hash1).toBe(hash2)
    })

    it('should handle null fields', () => {
      const event = {
        tenantId: null,
        userId: null,
        action: 'DELETE',
        objectType: 'email',
        objectId: null,
        timestamp: new Date(),
      }
      
      const hash = hashAuditEvent(event)
      expect(hash.length).toBe(64)
    })

    it('should include metadata in hash', () => {
      const baseEvent = {
        action: 'CREATE',
        objectType: 'dossier',
        timestamp: '2024-01-01T00:00:00Z',
      }
      
      const withMeta = {
        ...baseEvent,
        metadata: { extra: 'info' },
      }
      
      const hash1 = hashAuditEvent(baseEvent)
      const hash2 = hashAuditEvent(withMeta)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('hashDocument', () => {
    const sampleFile = Buffer.from('PDF content here', 'utf-8')
    const sampleMetadata = {
      filename: 'document.pdf',
      mimeType: 'application/pdf',
      uploadedBy: 'user-123',
      timestamp: new Date('2024-02-20T14:00:00Z'),
    }

    it('should hash document with metadata', () => {
      const hash = hashDocument(sampleFile, sampleMetadata)
      
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })

    it('should produce consistent hashes', () => {
      const hash1 = hashDocument(sampleFile, sampleMetadata)
      const hash2 = hashDocument(sampleFile, sampleMetadata)
      
      expect(hash1).toBe(hash2)
    })

    it('should change hash when file changes', () => {
      const file1 = Buffer.from('content A', 'utf-8')
      const file2 = Buffer.from('content B', 'utf-8')
      
      const hash1 = hashDocument(file1, sampleMetadata)
      const hash2 = hashDocument(file2, sampleMetadata)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should change hash when metadata changes', () => {
      const meta1 = { ...sampleMetadata, filename: 'file1.pdf' }
      const meta2 = { ...sampleMetadata, filename: 'file2.pdf' }
      
      const hash1 = hashDocument(sampleFile, meta1)
      const hash2 = hashDocument(sampleFile, meta2)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should handle string timestamp', () => {
      const metaWithString = {
        ...sampleMetadata,
        timestamp: '2024-02-20T14:00:00.000Z',
      }
      
      const hash = hashDocument(sampleFile, metaWithString)
      expect(hash.length).toBe(64)
    })
  })

  describe('verifyDocumentIntegrity', () => {
    const sampleFile = Buffer.from('Document content', 'utf-8')
    const sampleMetadata = {
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      uploadedBy: 'admin',
      timestamp: new Date(),
    }

    it('should verify document with metadata', () => {
      const hash = hashDocument(sampleFile, sampleMetadata)
      
      const isValid = verifyDocumentIntegrity(sampleFile, hash, sampleMetadata)
      expect(isValid).toBe(true)
    })

    it('should detect tampered document', () => {
      const originalHash = hashDocument(sampleFile, sampleMetadata)
      const tamperedFile = Buffer.from('Modified content', 'utf-8')
      
      const isValid = verifyDocumentIntegrity(tamperedFile, originalHash, sampleMetadata)
      expect(isValid).toBe(false)
    })

    it('should verify file alone without metadata', () => {
      const hash = calculateHash(sampleFile)
      
      const isValid = verifyDocumentIntegrity(sampleFile, hash)
      expect(isValid).toBe(true)
    })

    it('should detect tampering without metadata', () => {
      const hash = calculateHash(sampleFile)
      const tamperedFile = Buffer.from('Different content', 'utf-8')
      
      const isValid = verifyDocumentIntegrity(tamperedFile, hash)
      expect(isValid).toBe(false)
    })

    it('should handle metadata changes', () => {
      const originalMeta = { ...sampleMetadata }
      const originalHash = hashDocument(sampleFile, originalMeta)
      
      const changedMeta = { ...sampleMetadata, filename: 'changed.pdf' }
      
      const isValid = verifyDocumentIntegrity(sampleFile, originalHash, changedMeta)
      expect(isValid).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    it('should support full document verification workflow', () => {
      // 1. Create document
      const fileContent = Buffer.from('Legal document content', 'utf-8')
      const metadata = {
        filename: 'contract.pdf',
        mimeType: 'application/pdf',
        uploadedBy: 'lawyer-001',
        timestamp: new Date(),
      }
      
      // 2. Hash for storage
      const storedHash = hashDocument(fileContent, metadata)
      
      // 3. Later, verify integrity
      const isValid = verifyDocumentIntegrity(fileContent, storedHash, metadata)
      expect(isValid).toBe(true)
      
      // 4. Detect if tampered
      const tamperedContent = Buffer.from('Modified document', 'utf-8')
      const isTampered = !verifyDocumentIntegrity(tamperedContent, storedHash, metadata)
      expect(isTampered).toBe(true)
    })

    it('should support audit trail integrity', () => {
      // Create series of audit events
      const events = [
        { action: 'CREATE', objectType: 'dossier', timestamp: new Date() },
        { action: 'UPDATE', objectType: 'dossier', timestamp: new Date() },
        { action: 'SUBMIT', objectType: 'dossier', timestamp: new Date() },
      ]
      
      // Hash each event
      const hashes = events.map(hashAuditEvent)
      
      // All hashes should be valid
      hashes.forEach(hash => {
        expect(hash.length).toBe(64)
      })
      
      // Each hash should be unique
      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(events.length)
    })
  })
})

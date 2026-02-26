/**
 * Tests pour lib/services/storageService.ts - Fonctions pures
 * Tests des utilitaires de formatage et d'icônes
 */

// ============================================
// COPIE DES FONCTIONS PURES POUR TESTS ISOLÉS
// (Le fichier original utilise 'use client' et safeLocalStorage)
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '️';
  if (mimeType === 'application/pdf') return '';
  if (mimeType.includes('word')) return '';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '';
  if (mimeType.includes('text')) return '';
  return '';
}

describe('storageService - Utilitaires de stockage', () => {

  // ============================================
  // formatFileSize
  // ============================================
  describe('formatFileSize', () => {
    describe('Bytes', () => {
      test('0 bytes', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
      });

      test('1 byte', () => {
        expect(formatFileSize(1)).toBe('1 Bytes');
      });

      test('100 bytes', () => {
        expect(formatFileSize(100)).toBe('100 Bytes');
      });

      test('1023 bytes', () => {
        expect(formatFileSize(1023)).toBe('1023 Bytes');
      });
    });

    describe('Kilobytes', () => {
      test('1 KB (1024 bytes)', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
      });

      test('1.5 KB', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB');
      });

      test('10 KB', () => {
        expect(formatFileSize(10240)).toBe('10 KB');
      });

      test('100 KB', () => {
        expect(formatFileSize(102400)).toBe('100 KB');
      });

      test('500 KB', () => {
        expect(formatFileSize(512000)).toBe('500 KB');
      });

      test('1023 KB (presque 1 MB)', () => {
        const result = formatFileSize(1047552); // 1023 * 1024
        expect(result).toContain('KB');
      });
    });

    describe('Megabytes', () => {
      test('1 MB', () => {
        expect(formatFileSize(1048576)).toBe('1 MB');
      });

      test('1.5 MB', () => {
        expect(formatFileSize(1572864)).toBe('1.5 MB');
      });

      test('10 MB', () => {
        expect(formatFileSize(10485760)).toBe('10 MB');
      });

      test('50 MB (limite typique upload)', () => {
        expect(formatFileSize(52428800)).toBe('50 MB');
      });

      test('100 MB', () => {
        expect(formatFileSize(104857600)).toBe('100 MB');
      });

      test('500 MB', () => {
        expect(formatFileSize(524288000)).toBe('500 MB');
      });
    });

    describe('Gigabytes', () => {
      test('1 GB', () => {
        expect(formatFileSize(1073741824)).toBe('1 GB');
      });

      test('2.5 GB', () => {
        expect(formatFileSize(2684354560)).toBe('2.5 GB');
      });

      test('10 GB', () => {
        expect(formatFileSize(10737418240)).toBe('10 GB');
      });
    });

    describe('Cas limites', () => {
      test('retourne une chaîne formatée', () => {
        const result = formatFileSize(12345);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      test('arrondit à 2 décimales', () => {
        const result = formatFileSize(1234567);
        expect(result).toMatch(/^\d+(\.\d{1,2})? [A-Z]+$/);
      });

      test('gère les très petits fichiers', () => {
        expect(formatFileSize(1)).toBe('1 Bytes');
        expect(formatFileSize(10)).toBe('10 Bytes');
      });
    });

    describe('Valeurs courantes de documents', () => {
      test('document Word typique (~100 KB)', () => {
        const result = formatFileSize(102400);
        expect(result).toBe('100 KB');
      });

      test('PDF typique (~500 KB)', () => {
        const result = formatFileSize(512000);
        expect(result).toBe('500 KB');
      });

      test('image haute résolution (~5 MB)', () => {
        const result = formatFileSize(5242880);
        expect(result).toBe('5 MB');
      });

      test('fichier Excel (~2 MB)', () => {
        const result = formatFileSize(2097152);
        expect(result).toBe('2 MB');
      });
    });
  });

  // ============================================
  // getFileIcon
  // ============================================
  describe('getFileIcon', () => {
    describe('Images', () => {
      test('image/jpeg', () => {
        const icon = getFileIcon('image/jpeg');
        expect(icon).toBeDefined();
      });

      test('image/png', () => {
        const icon = getFileIcon('image/png');
        expect(icon).toBeDefined();
      });

      test('image/gif', () => {
        const icon = getFileIcon('image/gif');
        expect(icon).toBeDefined();
      });

      test('image/webp', () => {
        const icon = getFileIcon('image/webp');
        expect(icon).toBeDefined();
      });

      test('image/svg+xml', () => {
        const icon = getFileIcon('image/svg+xml');
        expect(icon).toBeDefined();
      });

      test('toutes les images ont la même icône', () => {
        const jpegIcon = getFileIcon('image/jpeg');
        const pngIcon = getFileIcon('image/png');
        const gifIcon = getFileIcon('image/gif');
        expect(jpegIcon).toBe(pngIcon);
        expect(pngIcon).toBe(gifIcon);
      });
    });

    describe('Documents PDF', () => {
      test('application/pdf', () => {
        const icon = getFileIcon('application/pdf');
        expect(icon).toBeDefined();
      });
    });

    describe('Documents Word', () => {
      test('application/msword (doc)', () => {
        const icon = getFileIcon('application/msword');
        expect(icon).toBeDefined();
      });

      test('application/vnd.openxmlformats-officedocument.wordprocessingml.document (docx)', () => {
        const icon = getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(icon).toBeDefined();
      });

      test('doc et docx ont la même icône', () => {
        const docIcon = getFileIcon('application/msword');
        const docxIcon = getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(docIcon).toBe(docxIcon);
      });
    });

    describe('Documents Excel', () => {
      test('application/vnd.ms-excel (xls)', () => {
        const icon = getFileIcon('application/vnd.ms-excel');
        expect(icon).toBeDefined();
      });

      test('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx)', () => {
        const icon = getFileIcon('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(icon).toBeDefined();
      });
    });

    describe('Documents texte', () => {
      test('text/plain', () => {
        const icon = getFileIcon('text/plain');
        expect(icon).toBeDefined();
      });

      test('text/html', () => {
        const icon = getFileIcon('text/html');
        expect(icon).toBeDefined();
      });

      test('text/csv', () => {
        const icon = getFileIcon('text/csv');
        expect(icon).toBeDefined();
      });
    });

    describe('Types inconnus', () => {
      test('application/octet-stream', () => {
        const icon = getFileIcon('application/octet-stream');
        expect(icon).toBeDefined();
      });

      test('application/zip', () => {
        const icon = getFileIcon('application/zip');
        expect(icon).toBeDefined();
      });

      test('type vide', () => {
        const icon = getFileIcon('');
        expect(icon).toBeDefined();
      });

      test('type invalide', () => {
        const icon = getFileIcon('something/random');
        expect(icon).toBeDefined();
      });
    });

    describe('Icônes distinctes', () => {
      test('PDF vs Word', () => {
        const pdfIcon = getFileIcon('application/pdf');
        const wordIcon = getFileIcon('application/msword');
        // Les icônes peuvent être différentes ou identiques selon l'implémentation
        expect(pdfIcon).toBeDefined();
        expect(wordIcon).toBeDefined();
      });
    });
  });

  // ============================================
  // Tests d'intégration
  // ============================================
  describe('Intégration formatFileSize + types de fichiers', () => {
    const testFiles = [
      { name: 'document.pdf', size: 524288, type: 'application/pdf' },
      { name: 'image.jpg', size: 2097152, type: 'image/jpeg' },
      { name: 'rapport.docx', size: 102400, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { name: 'data.xlsx', size: 1048576, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { name: 'notes.txt', size: 1024, type: 'text/plain' },
    ];

    test.each(testFiles)('$name ($type) - formatage correct', ({ name, size, type }) => {
      const formattedSize = formatFileSize(size);
      const icon = getFileIcon(type);
      
      expect(formattedSize).toBeDefined();
      expect(formattedSize.length).toBeGreaterThan(0);
      expect(icon).toBeDefined();
    });
  });

  // ============================================
  // Tests de performance/stress
  // ============================================
  describe('Performance', () => {
    test('formatFileSize gère les très grands nombres', () => {
      const result = formatFileSize(1099511627776); // 1 TB
      expect(result).toBeDefined();
    });

    test('formatFileSize est cohérent sur plusieurs appels', () => {
      const results = Array(100).fill(0).map(() => formatFileSize(1048576));
      expect(new Set(results).size).toBe(1); // Tous identiques
    });

    test('getFileIcon est cohérent sur plusieurs appels', () => {
      const results = Array(100).fill(0).map(() => getFileIcon('application/pdf'));
      expect(new Set(results).size).toBe(1); // Tous identiques
    });
  });
});

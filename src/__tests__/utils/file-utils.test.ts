/**
 * Tests pour les utilitaires de fichiers
 * Couverture: extension, taille, MIME type, validation
 */

describe('File Utils', () => {
  describe('Extension Extraction', () => {
    const getExtension = (filename: string): string => {
      const lastDot = filename.lastIndexOf('.');
      if (lastDot === -1 || lastDot === 0) return '';
      return filename.slice(lastDot + 1).toLowerCase();
    };

    it('devrait extraire l\'extension simple', () => {
      expect(getExtension('document.pdf')).toBe('pdf');
    });

    it('devrait gérer les extensions multiples', () => {
      expect(getExtension('archive.tar.gz')).toBe('gz');
    });

    it('devrait retourner vide sans extension', () => {
      expect(getExtension('filename')).toBe('');
    });

    it('devrait gérer les fichiers cachés', () => {
      expect(getExtension('.gitignore')).toBe('');
    });

    it('devrait mettre en minuscules', () => {
      expect(getExtension('Document.PDF')).toBe('pdf');
    });
  });

  describe('Filename Without Extension', () => {
    const getBasename = (filename: string): string => {
      const lastDot = filename.lastIndexOf('.');
      if (lastDot === -1 || lastDot === 0) return filename;
      return filename.slice(0, lastDot);
    };

    it('devrait extraire le nom de base', () => {
      expect(getBasename('document.pdf')).toBe('document');
    });

    it('devrait gérer les points multiples', () => {
      expect(getBasename('my.document.pdf')).toBe('my.document');
    });
  });

  describe('MIME Type Detection', () => {
    const getMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
      };
      return mimeTypes[ext || ''] || 'application/octet-stream';
    };

    it('devrait retourner le MIME type pour PDF', () => {
      expect(getMimeType('document.pdf')).toBe('application/pdf');
    });

    it('devrait retourner le MIME type pour images', () => {
      expect(getMimeType('photo.jpg')).toBe('image/jpeg');
      expect(getMimeType('image.png')).toBe('image/png');
    });

    it('devrait retourner octet-stream pour extension inconnue', () => {
      expect(getMimeType('file.xyz')).toBe('application/octet-stream');
    });
  });

  describe('File Size Formatting', () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const k = 1024;
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
    };

    it('devrait formater les bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('devrait formater les KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('devrait formater les MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('devrait formater les GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('devrait gérer 0', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('Parse File Size', () => {
    const parseFileSize = (size: string): number => {
      const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      const multipliers: Record<string, number> = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 ** 2,
        'GB': 1024 ** 3,
        'TB': 1024 ** 4,
      };
      
      return value * (multipliers[unit] || 1);
    };

    it('devrait parser KB', () => {
      expect(parseFileSize('10 KB')).toBe(10240);
    });

    it('devrait parser MB', () => {
      expect(parseFileSize('5 MB')).toBe(5 * 1024 * 1024);
    });

    it('devrait gérer les décimales', () => {
      expect(parseFileSize('1.5 KB')).toBe(1536);
    });
  });

  describe('File Type Categories', () => {
    const getFileCategory = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      
      const categories: Record<string, string[]> = {
        'document': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
        'spreadsheet': ['xls', 'xlsx', 'csv', 'ods'],
        'image': ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
        'video': ['mp4', 'avi', 'mov', 'mkv', 'webm'],
        'audio': ['mp3', 'wav', 'flac', 'aac', 'ogg'],
        'archive': ['zip', 'rar', '7z', 'tar', 'gz'],
        'code': ['js', 'ts', 'py', 'java', 'c', 'cpp', 'html', 'css'],
      };
      
      for (const [category, extensions] of Object.entries(categories)) {
        if (extensions.includes(ext || '')) return category;
      }
      
      return 'other';
    };

    it('devrait catégoriser les documents', () => {
      expect(getFileCategory('file.pdf')).toBe('document');
      expect(getFileCategory('file.docx')).toBe('document');
    });

    it('devrait catégoriser les images', () => {
      expect(getFileCategory('photo.jpg')).toBe('image');
      expect(getFileCategory('logo.png')).toBe('image');
    });

    it('devrait catégoriser les tableurs', () => {
      expect(getFileCategory('data.xlsx')).toBe('spreadsheet');
    });

    it('devrait retourner other pour extension inconnue', () => {
      expect(getFileCategory('file.xyz')).toBe('other');
    });
  });

  describe('File Validation', () => {
    interface FileValidation {
      maxSize: number;
      allowedTypes: string[];
    }

    const validateFile = (
      filename: string,
      size: number,
      rules: FileValidation
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      
      if (size > rules.maxSize) {
        errors.push(`Fichier trop volumineux (max: ${rules.maxSize} bytes)`);
      }
      
      if (!rules.allowedTypes.includes(ext)) {
        errors.push(`Type de fichier non autorisé: ${ext}`);
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('devrait valider un fichier conforme', () => {
      const result = validateFile('doc.pdf', 1000, {
        maxSize: 5000,
        allowedTypes: ['pdf', 'doc'],
      });
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter un fichier trop gros', () => {
      const result = validateFile('doc.pdf', 10000, {
        maxSize: 5000,
        allowedTypes: ['pdf'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('volumineux');
    });

    it('devrait rejeter un type non autorisé', () => {
      const result = validateFile('script.exe', 1000, {
        maxSize: 5000,
        allowedTypes: ['pdf', 'doc'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non autorisé');
    });
  });

  describe('Unique Filename Generation', () => {
    const generateUniqueFilename = (
      original: string,
      existingNames: string[]
    ): string => {
      if (!existingNames.includes(original)) return original;
      
      const ext = original.includes('.') 
        ? '.' + original.split('.').pop()
        : '';
      const base = original.includes('.')
        ? original.slice(0, original.lastIndexOf('.'))
        : original;
      
      let counter = 1;
      let newName = `${base} (${counter})${ext}`;
      
      while (existingNames.includes(newName)) {
        counter++;
        newName = `${base} (${counter})${ext}`;
      }
      
      return newName;
    };

    it('devrait retourner le nom original si unique', () => {
      expect(generateUniqueFilename('doc.pdf', ['other.pdf'])).toBe('doc.pdf');
    });

    it('devrait ajouter un numéro si existant', () => {
      expect(generateUniqueFilename('doc.pdf', ['doc.pdf'])).toBe('doc (1).pdf');
    });

    it('devrait incrémenter le numéro', () => {
      expect(generateUniqueFilename('doc.pdf', ['doc.pdf', 'doc (1).pdf'])).toBe('doc (2).pdf');
    });
  });

  describe('Path Utilities', () => {
    const getDirectory = (path: string): string => {
      const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
      if (lastSlash === -1) return '';
      return path.slice(0, lastSlash);
    };

    const getFilename = (path: string): string => {
      const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
      return path.slice(lastSlash + 1);
    };

    const joinPath = (...parts: string[]): string => {
      return parts.join('/').replace(/\/+/g, '/');
    };

    it('devrait extraire le répertoire', () => {
      expect(getDirectory('/path/to/file.txt')).toBe('/path/to');
    });

    it('devrait extraire le nom de fichier', () => {
      expect(getFilename('/path/to/file.txt')).toBe('file.txt');
    });

    it('devrait joindre les chemins', () => {
      expect(joinPath('path', 'to', 'file.txt')).toBe('path/to/file.txt');
    });

    it('devrait normaliser les slashes multiples', () => {
      expect(joinPath('path/', '/to/', '/file.txt')).toBe('path/to/file.txt');
    });
  });

  describe('Safe Filename', () => {
    const toSafeFilename = (filename: string): string => {
      return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    };

    it('devrait remplacer les caractères interdits', () => {
      expect(toSafeFilename('file<>:name.txt')).toBe('file___name.txt');
    });

    it('devrait remplacer les espaces', () => {
      expect(toSafeFilename('my file name.txt')).toBe('my_file_name.txt');
    });
  });

  describe('File Icon Selection', () => {
    const getFileIcon = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      
      const icons: Record<string, string> = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'xls': '📊',
        'xlsx': '📊',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'zip': '📦',
        'mp3': '🎵',
        'mp4': '🎬',
      };
      
      return icons[ext || ''] || '📎';
    };

    it('devrait retourner l\'icône PDF', () => {
      expect(getFileIcon('document.pdf')).toBe('📄');
    });

    it('devrait retourner l\'icône image', () => {
      expect(getFileIcon('photo.jpg')).toBe('🖼️');
    });

    it('devrait retourner l\'icône par défaut', () => {
      expect(getFileIcon('file.xyz')).toBe('📎');
    });
  });

  describe('Data URL Generation', () => {
    const createDataUrl = (content: string, mimeType: string): string => {
      const base64 = Buffer.from(content).toString('base64');
      return `data:${mimeType};base64,${base64}`;
    };

    it('devrait créer un data URL', () => {
      const dataUrl = createDataUrl('Hello', 'text/plain');
      expect(dataUrl.startsWith('data:text/plain;base64,')).toBe(true);
    });
  });
});

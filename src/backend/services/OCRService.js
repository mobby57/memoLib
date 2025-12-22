// 📄 SERVICE OCR - Extraction de texte des documents
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import pdf2pic from 'pdf2pic';
import fs from 'fs/promises';
import path from 'path';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  // Initialisation du worker Tesseract
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.worker = await createWorker('fra');
      this.isInitialized = true;
      console.log('✅ OCR Service initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation OCR:', error);
      throw error;
    }
  }

  // Extraction de texte selon le type de fichier
  async extractText(filePath, mimeType) {
    await this.initialize();
    
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);
        case 'image/jpeg':
        case 'image/png':
        case 'image/webp':
          return await this.extractFromImage(filePath);
        default:
          throw new Error(`Type de fichier non supporté: ${mimeType}`);
      }
    } catch (error) {
      console.error('Erreur extraction OCR:', error);
      throw new Error(`Extraction impossible: ${error.message}`);
    }
  }

  // Extraction depuis PDF
  async extractFromPDF(filePath) {
    try {
      // Conversion PDF en images
      const convert = pdf2pic.fromPath(filePath, {
        density: 300,
        saveFilename: "page",
        savePath: path.dirname(filePath),
        format: "png",
        width: 2000,
        height: 2000
      });

      const results = await convert.bulk(-1);
      const texts = [];

      // OCR sur chaque page
      for (const result of results) {
        const imagePath = result.path;
        const pageText = await this.extractFromImage(imagePath);
        texts.push(pageText);
        
        // Nettoyage du fichier temporaire
        await fs.unlink(imagePath).catch(() => {});
      }

      return {
        text: texts.join('\n\n--- PAGE SUIVANTE ---\n\n'),
        pages: texts.length,
        confidence: 0.8
      };

    } catch (error) {
      console.error('Erreur extraction PDF:', error);
      throw error;
    }
  }

  // Extraction depuis image
  async extractFromImage(imagePath) {
    try {
      // Préprocessing de l'image pour améliorer l'OCR
      const processedPath = await this.preprocessImage(imagePath);
      
      // OCR avec Tesseract
      const { data: { text, confidence } } = await this.worker.recognize(processedPath);
      
      // Nettoyage du fichier temporaire si créé
      if (processedPath !== imagePath) {
        await fs.unlink(processedPath).catch(() => {});
      }

      return {
        text: this.cleanText(text),
        confidence: confidence / 100,
        originalPath: imagePath
      };

    } catch (error) {
      console.error('Erreur extraction image:', error);
      throw error;
    }
  }

  // Préprocessing de l'image pour améliorer l'OCR
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(2000, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png({ quality: 100 })
        .toFile(processedPath);

      return processedPath;
    } catch (error) {
      console.error('Erreur preprocessing:', error);
      return imagePath; // Retourner l'original en cas d'erreur
    }
  }

  // Nettoyage du texte extrait
  cleanText(text) {
    return text
      // Supprimer les caractères de contrôle
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      // Normaliser les espaces
      .replace(/\s+/g, ' ')
      // Supprimer les espaces en début/fin
      .trim()
      // Corriger les sauts de ligne
      .replace(/\n\s*\n/g, '\n\n')
      // Supprimer les lignes vides multiples
      .replace(/\n{3,}/g, '\n\n');
  }

  // Validation du fichier
  async validateFile(filePath, mimeType) {
    try {
      const stats = await fs.stat(filePath);
      
      // Vérifier la taille (max 50MB)
      if (stats.size > 50 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 50MB)');
      }

      // Vérifier le type MIME
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (!allowedTypes.includes(mimeType)) {
        throw new Error(`Type de fichier non autorisé: ${mimeType}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Validation échouée: ${error.message}`);
    }
  }

  // Nettoyage des ressources
  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Métriques OCR
  getMetrics() {
    return {
      isInitialized: this.isInitialized,
      supportedFormats: ['PDF', 'JPEG', 'PNG', 'WebP'],
      maxFileSize: '50MB',
      language: 'Français',
      accuracy: '85-95%'
    };
  }
}

// Instance singleton
const ocrService = new OCRService();

export default ocrService;
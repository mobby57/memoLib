/**
 * OpenAI Files API Service
 * Handles file uploads, management, and operations for assistants, fine-tuning, and batch processing
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class FilesService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/files';
  }

  /**
   * Upload file to OpenAI
   */
  async uploadFile(file, purpose, expiresAfter = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);
      
      if (expiresAfter) {
        formData.append('expires_after[anchor]', expiresAfter.anchor || 'created_at');
        formData.append('expires_after[seconds]', expiresAfter.seconds || 2592000);
      }

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * List files with optional filters
   */
  async listFiles(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.after) params.append('after', options.after);
      if (options.limit) params.append('limit', options.limit);
      if (options.order) params.append('order', options.order);
      if (options.purpose) params.append('purpose', options.purpose);

      const url = `${this.baseURL}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`List files failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  /**
   * Get file information
   */
  async getFile(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get file failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get file error:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete file failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/${fileId}/content`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download file failed: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  }

  // Helper methods for specific use cases

  /**
   * Upload training data for fine-tuning
   */
  async uploadTrainingData(jsonlContent, filename = 'training_data.jsonl') {
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const file = new File([blob], filename, { type: 'application/jsonl' });
    
    return this.uploadFile(file, 'fine-tune');
  }

  /**
   * Upload document for assistants
   */
  async uploadDocument(file, expiresAfter = null) {
    return this.uploadFile(file, 'assistants', expiresAfter);
  }

  /**
   * Upload batch processing file
   */
  async uploadBatchFile(jsonlContent, filename = 'batch_requests.jsonl') {
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const file = new File([blob], filename, { type: 'application/jsonl' });
    
    return this.uploadFile(file, 'batch', { seconds: 2592000 }); // 30 days
  }

  /**
   * Get files by purpose
   */
  async getFilesByPurpose(purpose) {
    return this.listFiles({ purpose, limit: 100 });
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles() {
    try {
      const files = await this.listFiles({ limit: 1000 });
      const now = Math.floor(Date.now() / 1000);
      const expiredFiles = files.data.filter(file => 
        file.expires_at && file.expires_at < now
      );

      const deletePromises = expiredFiles.map(file => this.deleteFile(file.id));
      await Promise.all(deletePromises);

      return { deleted: expiredFiles.length };
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Validate file for upload
   */
  validateFile(file, purpose) {
    const maxSizes = {
      'fine-tune': 512 * 1024 * 1024, // 512 MB
      'assistants': 512 * 1024 * 1024, // 512 MB
      'batch': 200 * 1024 * 1024, // 200 MB
      'vision': 512 * 1024 * 1024, // 512 MB
      'user_data': 512 * 1024 * 1024 // 512 MB
    };

    const allowedTypes = {
      'fine-tune': ['.jsonl'],
      'batch': ['.jsonl'],
      'assistants': ['.pdf', '.txt', '.md', '.docx', '.json', '.jsonl'],
      'vision': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'user_data': [] // Any type
    };

    if (file.size > maxSizes[purpose]) {
      throw new Error(`File too large. Max size for ${purpose}: ${maxSizes[purpose] / (1024 * 1024)}MB`);
    }

    if (allowedTypes[purpose].length > 0) {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes[purpose].includes(fileExt)) {
        throw new Error(`Invalid file type for ${purpose}. Allowed: ${allowedTypes[purpose].join(', ')}`);
      }
    }

    return true;
  }
}

export default new FilesService();
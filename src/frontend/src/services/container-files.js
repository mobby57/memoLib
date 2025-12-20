/**
 * OpenAI Container Files API Service
 * Manages files within Code Interpreter containers
 */

class ContainerFilesService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/containers';
  }

  /**
   * Create container file
   */
  async createFile(containerId, file, fileId = null) {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (fileId) formData.append('file_id', fileId);

      const response = await fetch(`${this.baseURL}/${containerId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Create container file failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create container file error:', error);
      throw error;
    }
  }

  /**
   * List container files
   */
  async listFiles(containerId, options = {}) {
    try {
      const {
        after = null,
        limit = 20,
        order = 'desc'
      } = options;

      const params = new URLSearchParams();
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      params.append('order', order);

      const response = await fetch(`${this.baseURL}/${containerId}/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`List container files failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List container files error:', error);
      throw error;
    }
  }

  /**
   * Retrieve container file
   */
  async getFile(containerId, fileId) {
    try {
      const response = await fetch(`${this.baseURL}/${containerId}/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get container file failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get container file error:', error);
      throw error;
    }
  }

  /**
   * Retrieve container file content
   */
  async getFileContent(containerId, fileId) {
    try {
      const response = await fetch(`${this.baseURL}/${containerId}/files/${fileId}/content`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get container file content failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Get container file content error:', error);
      throw error;
    }
  }

  /**
   * Delete container file
   */
  async deleteFile(containerId, fileId) {
    try {
      const response = await fetch(`${this.baseURL}/${containerId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete container file failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete container file error:', error);
      throw error;
    }
  }

  // Helper methods for email-specific use cases

  /**
   * Upload email data for analysis
   */
  async uploadEmailData(containerId, emailData, filename = 'email_data.json') {
    const jsonContent = JSON.stringify(emailData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });
    
    return this.createFile(containerId, file);
  }

  /**
   * Upload CSV data for email analytics
   */
  async uploadCSVData(containerId, csvContent, filename = 'email_analytics.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], filename, { type: 'text/csv' });
    
    return this.createFile(containerId, file);
  }

  /**
   * Upload email templates for processing
   */
  async uploadEmailTemplates(containerId, templates) {
    const results = [];
    
    for (const [index, template] of templates.entries()) {
      const filename = `template_${index + 1}.html`;
      const blob = new Blob([template.content], { type: 'text/html' });
      const file = new File([blob], filename, { type: 'text/html' });
      
      const result = await this.createFile(containerId, file);
      results.push({ ...result, templateName: template.name });
    }
    
    return results;
  }

  /**
   * Get analysis results
   */
  async getAnalysisResults(containerId, resultFileName = 'analysis_results.json') {
    try {
      const files = await this.listFiles(containerId);
      const resultFile = files.data.find(file => 
        file.path.includes(resultFileName)
      );
      
      if (!resultFile) {
        throw new Error('Analysis results not found');
      }
      
      const content = await this.getFileContent(containerId, resultFile.id);
      const text = await content.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Get analysis results error:', error);
      throw error;
    }
  }

  /**
   * Clean up container files
   */
  async cleanup(containerId, keepRecent = 5) {
    try {
      const files = await this.listFiles(containerId, { limit: 100 });
      
      // Sort by creation date and keep only recent files
      const sortedFiles = files.data.sort((a, b) => b.created_at - a.created_at);
      const filesToDelete = sortedFiles.slice(keepRecent);
      
      const deletePromises = filesToDelete.map(file => 
        this.deleteFile(containerId, file.id)
      );
      
      await Promise.allSettled(deletePromises);
      
      return { deleted: filesToDelete.length, kept: keepRecent };
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(containerId) {
    try {
      const files = await this.listFiles(containerId, { limit: 100 });
      
      const stats = {
        totalFiles: files.data.length,
        totalSize: files.data.reduce((sum, file) => sum + file.bytes, 0),
        fileTypes: {},
        sources: { user: 0, assistant: 0 }
      };
      
      files.data.forEach(file => {
        // Count file types
        const ext = file.path.split('.').pop() || 'unknown';
        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
        
        // Count sources
        stats.sources[file.source] = (stats.sources[file.source] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Get file stats error:', error);
      throw error;
    }
  }

  /**
   * Batch upload files
   */
  async batchUpload(containerId, files) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.createFile(containerId, file);
        results.push({ success: true, file: result });
      } catch (error) {
        results.push({ success: false, error: error.message, fileName: file.name });
      }
    }
    
    return {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Download all files as zip (conceptual - would need backend support)
   */
  async downloadAllFiles(containerId) {
    const files = await this.listFiles(containerId);
    const downloads = [];
    
    for (const file of files.data) {
      try {
        const content = await this.getFileContent(containerId, file.id);
        downloads.push({
          name: file.path.split('/').pop(),
          content,
          size: file.bytes
        });
      } catch (error) {
        console.warn(`Failed to download ${file.path}:`, error);
      }
    }
    
    return downloads;
  }
}

export default new ContainerFilesService();
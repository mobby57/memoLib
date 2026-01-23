// ============================================
// Azure Services Integration for IA Poste Manager
// ============================================

import { BlobServiceClient } from '@azure/storage-blob';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

// ============================================
// Azure Blob Storage Service
// ============================================

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface BlobConfig {
  connectionString?: string;
  containerName: string;
}

class AzureBlobService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string;
  private isConfigured: boolean = false;

  constructor(config: BlobConfig) {
    this.containerName = config.containerName;
    
    if (config.connectionString) {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
        this.isConfigured = true;
      } catch (error) {
        console.warn('Azure Blob Storage not configured:', error);
      }
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<UploadResult> {
    if (!this.blobServiceClient) {
      return { success: false, error: 'Azure Blob Storage not configured' };
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: contentType }
      });

      return {
        success: true,
        url: blockBlobClient.url
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    if (!this.blobServiceClient) {
      return false;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.delete();
      return true;
    } catch (error) {
      console.error('Error deleting blob:', error);
      return false;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    if (!this.blobServiceClient) {
      return [];
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const files: string[] = [];

      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        files.push(blob.name);
      }

      return files;
    } catch (error) {
      console.error('Error listing blobs:', error);
      return [];
    }
  }

  async getFileUrl(fileName: string, expiresInMinutes: number = 60): Promise<string | null> {
    if (!this.blobServiceClient) {
      return null;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      // For public containers, return direct URL
      // For private, you would generate SAS token here
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }
}

// ============================================
// Azure Key Vault Service
// ============================================

class AzureKeyVaultService {
  private secretClient: SecretClient | null = null;
  private isConfigured: boolean = false;
  private cache: Map<string, { value: string; expires: number }> = new Map();
  private cacheDurationMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(vaultUri?: string) {
    if (vaultUri) {
      try {
        const credential = new DefaultAzureCredential();
        this.secretClient = new SecretClient(vaultUri, credential);
        this.isConfigured = true;
      } catch (error) {
        console.warn('Azure Key Vault not configured:', error);
      }
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async getSecret(secretName: string): Promise<string | null> {
    if (!this.secretClient) {
      return null;
    }

    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    try {
      const secret = await this.secretClient.getSecret(secretName);
      const value = secret.value || null;

      if (value) {
        this.cache.set(secretName, {
          value,
          expires: Date.now() + this.cacheDurationMs
        });
      }

      return value;
    } catch (error) {
      console.error(`Error getting secret ${secretName}:`, error);
      return null;
    }
  }

  async setSecret(secretName: string, value: string): Promise<boolean> {
    if (!this.secretClient) {
      return false;
    }

    try {
      await this.secretClient.setSecret(secretName, value);
      this.cache.set(secretName, {
        value,
        expires: Date.now() + this.cacheDurationMs
      });
      return true;
    } catch (error) {
      console.error(`Error setting secret ${secretName}:`, error);
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================
// Azure Configuration Helper
// ============================================

interface AzureConfig {
  blob: {
    connectionString: string | undefined;
    containerName: string;
  };
  keyVault: {
    uri: string | undefined;
  };
  database: {
    url: string | undefined;
  };
  ad: {
    clientId: string | undefined;
    tenantId: string | undefined;
    clientSecret: string | undefined;
    enabled: boolean;
  };
}

export function getAzureConfig(): AzureConfig {
  return {
    blob: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: process.env.AZURE_STORAGE_CONTAINER || 'documents'
    },
    keyVault: {
      uri: process.env.AZURE_KEY_VAULT_URI
    },
    database: {
      url: process.env.DATABASE_URL
    },
    ad: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      enabled: process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === 'true'
    }
  };
}

// ============================================
// Singleton Instances
// ============================================

let blobServiceInstance: AzureBlobService | null = null;
let keyVaultServiceInstance: AzureKeyVaultService | null = null;

export function getAzureBlobService(): AzureBlobService {
  if (!blobServiceInstance) {
    const config = getAzureConfig();
    blobServiceInstance = new AzureBlobService({
      connectionString: config.blob.connectionString,
      containerName: config.blob.containerName
    });
  }
  return blobServiceInstance;
}

export function getAzureKeyVaultService(): AzureKeyVaultService {
  if (!keyVaultServiceInstance) {
    const config = getAzureConfig();
    keyVaultServiceInstance = new AzureKeyVaultService(config.keyVault.uri);
  }
  return keyVaultServiceInstance;
}

// ============================================
// Health Check
// ============================================

export interface AzureServicesStatus {
  blob: {
    configured: boolean;
    healthy: boolean;
  };
  keyVault: {
    configured: boolean;
    healthy: boolean;
  };
  database: {
    configured: boolean;
    type: 'azure-postgresql' | 'neon' | 'sqlite' | 'unknown';
  };
  azureAd: {
    configured: boolean;
    enabled: boolean;
  };
}

export async function checkAzureServicesHealth(): Promise<AzureServicesStatus> {
  const config = getAzureConfig();
  const blobService = getAzureBlobService();
  const keyVaultService = getAzureKeyVaultService();

  // Detect database type
  let dbType: 'azure-postgresql' | 'neon' | 'sqlite' | 'unknown' = 'unknown';
  const dbUrl = config.database.url || '';
  
  if (dbUrl.includes('postgres.database.azure.com')) {
    dbType = 'azure-postgresql';
  } else if (dbUrl.includes('neon.tech')) {
    dbType = 'neon';
  } else if (dbUrl.startsWith('file:')) {
    dbType = 'sqlite';
  }

  return {
    blob: {
      configured: blobService.isAvailable(),
      healthy: blobService.isAvailable() // Could add actual health check
    },
    keyVault: {
      configured: keyVaultService.isAvailable(),
      healthy: keyVaultService.isAvailable() // Could add actual health check
    },
    database: {
      configured: !!config.database.url,
      type: dbType
    },
    azureAd: {
      configured: !!(config.ad.clientId && config.ad.tenantId),
      enabled: config.ad.enabled
    }
  };
}

export { AzureBlobService, AzureKeyVaultService };

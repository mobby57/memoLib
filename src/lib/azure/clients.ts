import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { SecretClient } from '@azure/keyvault-secrets';

// Create a single shared credential instance (supports CLI, MI, SP)
const credential = new DefaultAzureCredential();

export function getBlobServiceClient(): BlobServiceClient {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME');
  }
  const accountUrl = `https://${accountName}.blob.core.windows.net`;
  return new BlobServiceClient(accountUrl, credential);
}

export function getSecretClient(): SecretClient {
  const vaultName = process.env.AZURE_KEY_VAULT_NAME;
  if (!vaultName) {
    throw new Error('Missing AZURE_KEY_VAULT_NAME');
  }
  const kvUrl = `https://${vaultName}.vault.azure.net`;
  return new SecretClient(kvUrl, credential);
}

export type { BlobServiceClient, SecretClient };

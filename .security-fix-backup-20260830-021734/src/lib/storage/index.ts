import type { StorageService } from "./types";
import { LocalStorageService } from "./localStorageService";
import { AzureBlobStorageService } from "./azureBlobStorageService";

let instance: StorageService | undefined;

function shouldUseAzure(): boolean {
  if (process.env.STORAGE_DRIVER === "local") {
    return false;
  }

  if (process.env.STORAGE_DRIVER === "azure") {
    return true;
  }

  return (
    process.env.NODE_ENV === "production" &&
    Boolean(
      process.env.AZURE_STORAGE_CONNECTION_STRING ||
      (
        process.env.AZURE_STORAGE_ACCOUNT_NAME &&
        process.env.AZURE_STORAGE_ACCOUNT_KEY
      )
    )
  );
}

export function getStorageService(): StorageService {
  if (instance) {
    return instance;
  }

  if (shouldUseAzure()) {
    instance = new AzureBlobStorageService();
  } else {
    instance = new LocalStorageService();
  }

  return instance;
}

export function resetStorageService(): void {
  instance = undefined;
}

export const storageService = {
  get instance(): StorageService {
    return getStorageService();
  },
};

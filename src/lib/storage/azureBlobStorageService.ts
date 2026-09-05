import {
  BlobServiceClient,
} from "@azure/storage-blob";

import type {
  StorageService,
  StoredFile,
  UploadOptions,
} from "./types";

function getClient(): BlobServiceClient {
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    return BlobServiceClient.fromConnectionString(
      connectionString
    );
  }

  const accountName =
    process.env.AZURE_STORAGE_ACCOUNT_NAME;

  const accountKey =
    process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName || !accountKey) {
    throw new Error(
      "Azure Storage is not configured. " +
      "Set AZURE_STORAGE_CONNECTION_STRING or " +
      "AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY."
    );
  }

  return BlobServiceClient.fromConnectionString(
    `DefaultEndpointsProtocol=https;` +
    `AccountName=${accountName};` +
    `AccountKey=${accountKey};` +
    `EndpointSuffix=core.windows.net`
  );
}

function getContainerName(): string {
  return (
    process.env.AZURE_STORAGE_CONTAINER ||
    "memolib"
  );
}

export class AzureBlobStorageService
  implements StorageService
{
  private container() {
    return getClient().getContainerClient(
      getContainerName()
    );
  }

  async upload(
    key: string,
    data: Buffer,
    options: UploadOptions = {}
  ): Promise<StoredFile> {
    const container = this.container();

    await container.createIfNotExists();

    const blob = container.getBlockBlobClient(key);

    await blob.uploadData(data, {
      blobHTTPHeaders: {
        blobContentType:
          options.contentType ||
          "application/octet-stream",
      },
      metadata: options.metadata,
    });

    return {
      id: key,
      name: key.split("/").pop() || key,
      path: key,
      size: data.length,
      contentType:
        options.contentType ||
        "application/octet-stream",
      createdAt: new Date(),
      metadata: options.metadata,
    };
  }

  async download(key: string): Promise<Buffer> {
    const blob = this
      .container()
      .getBlockBlobClient(key);

    return blob.downloadToBuffer();
  }

  async delete(key: string): Promise<void> {
    await this
      .container()
      .deleteBlob(key);
  }

  async exists(key: string): Promise<boolean> {
    return this
      .container()
      .getBlockBlobClient(key)
      .exists();
  }

  async list(prefix = ""): Promise<StoredFile[]> {
    const results: StoredFile[] = [];

    for await (
      const item of this
        .container()
        .listBlobsFlat({ prefix })
    ) {
      results.push({
        id: item.name,
        name:
          item.name.split("/").pop() ||
          item.name,
        path: item.name,
        size:
          item.properties.contentLength || 0,
        contentType:
          item.properties.contentType ||
          "application/octet-stream",
        createdAt:
          item.properties.createdOn ||
          new Date(),
      });
    }

    return results;
  }
}

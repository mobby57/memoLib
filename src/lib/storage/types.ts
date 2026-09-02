export interface StoredFile {
  id: string;
  name: string;
  path: string;
  size: number;
  contentType: string;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageService {
  upload(
    key: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<StoredFile>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  list(prefix?: string): Promise<StoredFile[]>;
}

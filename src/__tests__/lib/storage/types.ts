export interface StoredFile {
  key: string;
  size: number;
  contentType: string;
  etag?: string;
  createdAt?: Date;
}

export interface StorageService {
  upload(
    key: string,
    data: Buffer,
    contentType: string
  ): Promise<StoredFile>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  getUrl(key: string): Promise<string>;
}
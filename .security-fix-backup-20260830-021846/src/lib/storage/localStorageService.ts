import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import type {
  StorageService,
  StoredFile,
  UploadOptions,
} from "./types";

function getRoot(): string {
  return path.resolve(
    process.env.VAULT_STORAGE_ROOT || ".vault"
  );
}

function safeKey(key: string): string {
  const normalized = key.replace(/\\/g, "/");

  if (
    normalized.startsWith("/") ||
    normalized.includes("../") ||
    normalized.includes("..\\")
  ) {
    throw new Error("Invalid storage key");
  }

  return normalized;
}

function filePath(key: string): string {
  return path.join(getRoot(), safeKey(key));
}

function metadataPath(key: string): string {
  return `${filePath(key)}.meta.json`;
}

async function ensureParent(key: string): Promise<void> {
  await fs.mkdir(
    path.dirname(filePath(key)),
    { recursive: true }
  );
}

export class LocalStorageService implements StorageService {
  async upload(
    key: string,
    data: Buffer,
    options: UploadOptions = {}
  ): Promise<StoredFile> {
    key = safeKey(key);

    await ensureParent(key);

    await fs.writeFile(filePath(key), data);

    const now = new Date();

    const metadata = {
      id: crypto.randomUUID(),
      name: path.basename(key),
      path: key,
      size: data.length,
      contentType:
        options.contentType ||
        "application/octet-stream",
      createdAt: now.toISOString(),
      metadata: options.metadata || {},
    };

    await fs.writeFile(
      metadataPath(key),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    return {
      ...metadata,
      createdAt: now,
    };
  }

  async download(key: string): Promise<Buffer> {
    return fs.readFile(filePath(safeKey(key)));
  }

  async delete(key: string): Promise<void> {
    key = safeKey(key);

    await fs.rm(filePath(key), {
      force: true,
    });

    await fs.rm(metadataPath(key), {
      force: true,
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(filePath(safeKey(key)));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix = ""): Promise<StoredFile[]> {
    const root = getRoot();
    const results: StoredFile[] = [];

    async function walk(dir: string): Promise<void> {
      let entries;

      try {
        entries = await fs.readdir(dir, {
          withFileTypes: true,
        });
      } catch {
        return;
      }

      for (const entry of entries) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }

        if (
          entry.name.endsWith(".meta.json")
        ) {
          continue;
        }

        const relative = path
          .relative(root, full)
          .replace(/\\/g, "/");

        if (
          prefix &&
          !relative.startsWith(prefix)
        ) {
          continue;
        }

        try {
          const raw = await fs.readFile(
            `${full}.meta.json`,
            "utf8"
          );

          const metadata = JSON.parse(raw);

          results.push({
            ...metadata,
            createdAt: new Date(metadata.createdAt),
          });
        } catch {
          const stat = await fs.stat(full);

          results.push({
            id: relative,
            name: path.basename(relative),
            path: relative,
            size: stat.size,
            contentType:
              "application/octet-stream",
            createdAt: stat.birthtime,
          });
        }
      }
    }

    await walk(root);

    return results;
  }
}

import { describe, expect, it, beforeEach } from "vitest";
import fs from "node:fs/promises";

import {
  getStorageService,
  resetStorageService,
} from "./index";

describe("StorageService", () => {
  beforeEach(async () => {
    process.env.STORAGE_DRIVER = "local";
    process.env.VAULT_STORAGE_ROOT = ".vault-test";

    resetStorageService();

    await fs.rm(".vault-test", {
      recursive: true,
      force: true,
    });
  });

  it("uploads, reads, lists and deletes a file", async () => {
    const storage = getStorageService();

    const data = Buffer.from(
      "MemoLib storage smoke test"
    );

    const uploaded = await storage.upload(
      "clients/test/document.txt",
      data,
      {
        contentType: "text/plain",
      }
    );

    expect(uploaded.path).toBe(
      "clients/test/document.txt"
    );

    expect(
      await storage.exists(
        "clients/test/document.txt"
      )
    ).toBe(true);

    const downloaded =
      await storage.download(
        "clients/test/document.txt"
      );

    expect(
      downloaded.toString()
    ).toBe(data.toString());

    const files = await storage.list(
      "clients/test"
    );

    expect(files).toHaveLength(1);

    await storage.delete(
      "clients/test/document.txt"
    );

    expect(
      await storage.exists(
        "clients/test/document.txt"
      )
    ).toBe(false);
  });
});

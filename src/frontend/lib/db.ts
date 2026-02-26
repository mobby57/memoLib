/**
 * In-Memory Database (pour validation du Adapter Pattern sans dépendre de PostgreSQL)
 * Permet de tester le webhook sans problèmes d'authentification DB
 */

// Simple in-memory store
const messageStore: Map<
  string,
  {
    id: number;
    channel: string;
    external_id: string | null;
    checksum: string;
    sender_email?: string;
    sender_phone?: string;
    subject?: string;
    body?: string;
    created_at: Date;
  }
> = new Map();

let messageIdCounter = 1;

export async function queryDb<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] } | null> {
  console.log('[DB-MOCK] Query:', sql.substring(0, 50));
  return { rows: [] };
}

export async function storeChannelMessage(data: {
  channel: string;
  external_id?: string | null;
  checksum: string;
  sender_email?: string;
  sender_phone?: string;
  subject?: string;
  body?: string;
}): Promise<number | null> {
  const id = messageIdCounter++;
  const timestamp = new Date();

  messageStore.set(data.checksum, {
    id,
    channel: data.channel,
    external_id: data.external_id || null,
    checksum: data.checksum,
    sender_email: data.sender_email,
    sender_phone: data.sender_phone,
    subject: data.subject,
    body: data.body,
    created_at: timestamp,
  });

  console.log('[DB-MOCK] ✅ Message stored with id:', id);
  return id;
}

export async function checkDuplicate(checksum: string): Promise<boolean> {
  const isDuplicate = messageStore.has(checksum);
  if (isDuplicate) {
    console.log('[DB-MOCK] ⚠️ Duplicate detected:', checksum);
  }
  return isDuplicate;
}

// Legacy exports
export async function initDb() {
  console.log('[DB-MOCK] Using in-memory store (PostgreSQL connection unavailable)');
  return { connected: true };
}

export async function closePool(): Promise<void> {
  messageStore.clear();
  console.log('[DB-MOCK] Store cleared');
}

// Export for testing
export function getStoreStats() {
  return {
    messageCount: messageStore.size,
    messages: Array.from(messageStore.values()),
  };
}

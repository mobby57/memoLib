-- Création de la table channel_messages pour le pattern Adapter
CREATE TABLE IF NOT EXISTS channel_messages (
  id SERIAL PRIMARY KEY,
  channel VARCHAR(50),
  external_id TEXT UNIQUE,
  checksum TEXT UNIQUE NOT NULL,
  sender_email VARCHAR(255),
  sender_phone VARCHAR(20),
  sender_name VARCHAR(255),
  body TEXT NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channel);
CREATE INDEX IF NOT EXISTS idx_channel_messages_external_id ON channel_messages(external_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_checksum ON channel_messages(checksum);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at ON channel_messages(created_at DESC);

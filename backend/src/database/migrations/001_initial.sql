-- Initial schema for YesApp WhatsApp API
-- Version: 1.0.0
-- Created: 2025-11-14

-- Sessions table: stores WhatsApp session information
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'connected', 'disconnected')),
    phone_number TEXT,
    qr_code TEXT,
    webhook_url TEXT,
    created_at INTEGER NOT NULL,
    last_activity INTEGER NOT NULL,
    settings TEXT DEFAULT '{}'
);

-- Messages table: stores sent and received messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    content TEXT,
    media_type TEXT CHECK(media_type IN ('image', 'video', 'document', 'audio') OR media_type IS NULL),
    media_url TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    timestamp INTEGER NOT NULL,
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Webhook logs table: stores webhook delivery attempts
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_id TEXT,
    webhook_url TEXT NOT NULL,
    status_code INTEGER,
    attempts INTEGER DEFAULT 1,
    success INTEGER DEFAULT 0 CHECK(success IN (0, 1)),
    error TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- API keys table: stores authentication keys
CREATE TABLE IF NOT EXISTS api_keys (
    key_hash TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT '["read", "write"]',
    created_at INTEGER NOT NULL,
    expires_at INTEGER
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_session ON webhook_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp DESC);

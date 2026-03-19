-- Script d'optimisation des performances
-- Ajouter indexes manquants sur colonnes fréquemment requêtées

-- Index sur Cases
CREATE INDEX IF NOT EXISTS IX_Cases_UserId_Status ON Cases(UserId, Status);
CREATE INDEX IF NOT EXISTS IX_Cases_UserId_CreatedAt ON Cases(UserId, CreatedAt DESC);
CREATE INDEX IF NOT EXISTS IX_Cases_ClientId ON Cases(ClientId);

-- Index sur Events
CREATE INDEX IF NOT EXISTS IX_Events_UserId_CreatedAt ON Events(UserId, CreatedAt DESC);
CREATE INDEX IF NOT EXISTS IX_Events_CaseId ON Events(CaseId);

-- Index sur Clients
CREATE INDEX IF NOT EXISTS IX_Clients_UserId_Email ON Clients(UserId, Email);

-- Index sur AuditLog
CREATE INDEX IF NOT EXISTS IX_AuditLog_UserId_Timestamp ON AuditLog(UserId, Timestamp DESC);

-- Index sur Notifications
CREATE INDEX IF NOT EXISTS IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
CREATE INDEX IF NOT EXISTS IX_Notifications_CreatedAt ON Notifications(CreatedAt DESC);

-- Index sur Attachments
CREATE INDEX IF NOT EXISTS IX_Attachments_EventId ON Attachments(EventId);

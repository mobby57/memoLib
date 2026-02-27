-- Migration SQL pour ajouter RoleNotification

CREATE TABLE RoleNotifications (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    Title TEXT NOT NULL,
    Message TEXT NOT NULL,
    Type TEXT NOT NULL,
    CaseId INTEGER NULL,
    Severity TEXT NOT NULL DEFAULT 'LOW',
    IsRead INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL,
    ReadAt TEXT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (CaseId) REFERENCES Cases(Id)
);

CREATE INDEX IX_RoleNotifications_UserId_IsRead_CreatedAt 
ON RoleNotifications(UserId, IsRead, CreatedAt);

-- Seed utilisateur par défaut
INSERT INTO "User" (email, password, "emailVerified", "createdAt", "updatedAt")
VALUES ('avocat@test.com', '$2b$12$qzHIW6p3.C6L6UxcLGCmSuF7lPBUlvFAs9h/eo7q0YyJKknnNbvwm', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    "updatedAt" = NOW();

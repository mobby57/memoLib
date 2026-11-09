INSERT INTO "Plan" (id, name, "displayName", "priceMonthly", "priceYearly", currency, "maxWorkspaces", "maxDossiers", "maxClients", "maxStorageGb", "maxUsers", "isActive", "updatedAt")
VALUES 
('plan-solo', 'SOLO', 'Essentiel', 89, 890, 'EUR', 1, 50, 20, 5, 1, true, NOW()),
('plan-cabinet', 'CABINET', 'Cabinet', 69, 690, 'EUR', 5, 200, 100, 20, 10, true, NOW()),
('plan-enterprise', 'ENTERPRISE', 'Premium', 149, 1490, 'EUR', 20, -1, -1, 100, 50, true, NOW()),
('plan-pilot', 'PILOT', 'Essai Pilote', 0, 0, 'EUR', 1, 10, 5, 2, 1, true, NOW())
ON CONFLICT (id) DO NOTHING;

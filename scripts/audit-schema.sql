-- audit-schema.sql
-- Vérifie la présence de données dans toutes les tables principales

SELECT '✅ Plan' AS entity, COUNT(*) AS count FROM "Plan"
UNION ALL
SELECT '✅ Tenant', COUNT(*) FROM "Tenant"
UNION ALL
SELECT '✅ User', COUNT(*) FROM "User"
UNION ALL
SELECT '✅ Client', COUNT(*) FROM "Client"
UNION ALL
SELECT '✅ Dossier', COUNT(*) FROM "Dossier"
UNION ALL
SELECT '✅ Facture', COUNT(*) FROM "Facture"
UNION ALL
SELECT '✅ LigneFacture', COUNT(*) FROM "LigneFacture"
UNION ALL
SELECT '✅ LegalDeadline', COUNT(*) FROM "LegalDeadline"
UNION ALL
SELECT '✅ Document', COUNT(*) FROM "Document"
UNION ALL
SELECT '✅ Proof', COUNT(*) FROM "Proof"
UNION ALL
SELECT '✅ Email', COUNT(*) FROM "Email"
UNION ALL
SELECT '✅ ActionProposal', COUNT(*) FROM "ActionProposal"
UNION ALL
SELECT '✅ Report', COUNT(*) FROM "Report"
UNION ALL
SELECT '✅ AuditLog', COUNT(*) FROM "AuditLog"
UNION ALL
SELECT '✅ Team', COUNT(*) FROM "Team"
UNION ALL
SELECT '✅ TeamMember', COUNT(*) FROM "TeamMember"
UNION ALL
SELECT '✅ DossierMember', COUNT(*) FROM "DossierMember"
UNION ALL
SELECT '✅ WorkflowExecution', COUNT(*) FROM "WorkflowExecution"
UNION ALL
SELECT '✅ CalendarEvent', COUNT(*) FROM "CalendarEvent"
UNION ALL
SELECT '✅ ChannelMessage', COUNT(*) FROM "ChannelMessage"
UNION ALL
SELECT '✅ RGPDConsent', COUNT(*) FROM "RGPDConsent"
UNION ALL
SELECT '✅ CompteComptable', COUNT(*) FROM "CompteComptable"
UNION ALL
SELECT '✅ Ecriture', COUNT(*) FROM "Ecriture"
UNION ALL
SELECT '✅ MouvementCARPA', COUNT(*) FROM "MouvementCARPA"
UNION ALL
SELECT '✅ Subscription', COUNT(*) FROM "Subscription"
UNION ALL
SELECT '✅ TenantSettings', COUNT(*) FROM "TenantSettings"
UNION ALL
SELECT '✅ UsageRecord', COUNT(*) FROM "UsageRecord"
UNION ALL
SELECT '✅ QuotaEvent', COUNT(*) FROM "QuotaEvent"
UNION ALL
SELECT '✅ AIUsageLog', COUNT(*) FROM "AIUsageLog"
UNION ALL
SELECT '✅ ArchivePolicy', COUNT(*) FROM "ArchivePolicy"
UNION ALL
SELECT '✅ Jurisprudence', COUNT(*) FROM "Jurisprudence"
ORDER BY entity;
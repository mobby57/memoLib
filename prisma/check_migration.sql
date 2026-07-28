SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'LegalDeadline'
  AND column_name IN ('acknowledgedBy','acknowledgedAt','suspendedReason','suspendedAt','suspendedBy','escalatedAt','escalatedTo','alertSmsSent')
ORDER BY column_name;

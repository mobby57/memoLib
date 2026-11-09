# Technical Requirements Document (TRD) - MemoLib
## Stack Technique
- Frontend : Next.js 14 (App Router), React, Tailwind CSS
- Backend : API Routes Next.js, Prisma ORM
- Base de données : PostgreSQL (Neon)
- Authentification : Clerk
- Paiements : Stripe
- Déploiement : Vercel
## Sécurité
- Chiffrement des données sensibles (AES-256).
- Row Level Security (RLS) sur PostgreSQL.
- Journalisation des accès (Audit Trail avec chaînage de hash).

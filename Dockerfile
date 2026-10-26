# ═══════════════════════════════════════════════════════════
# Dockerfile MemoLib - Production ready
# ═══════════════════════════════════════════════════════════
FROM node:24-alpine AS base

# ─── Dépendances système ───
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

# ═══════════════════════════════════════════════════════════
# Stage 1 : Install + Prisma generate
# ═══════════════════════════════════════════════════════════
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps --ignore-scripts
RUN npx prisma generate

# ═══════════════════════════════════════════════════════════
# Stage 2 : Build Next.js
# ═══════════════════════════════════════════════════════════
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Mémoire étendue pour Next.js build (250+ routes)
ENV NODE_OPTIONS="--max-old-space-size=6144"
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Build args pour les NEXT_PUBLIC_* (nécessaires au build)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 3 : Runtime (image finale légère)
# ═══════════════════════════════════════════════════════════
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Utilisateur non-root
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copier les artefacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./

USER nextjs
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Migrations Prisma + start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

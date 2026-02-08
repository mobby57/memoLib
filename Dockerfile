FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
# Install Python, build tools for native modules (better-sqlite3), and OpenSSL for Prisma
RUN apk add --no-cache python3 make g++ openssl
COPY package*.json ./
# Copy Prisma schema before npm install (needed for postinstall hook)
COPY prisma ./prisma
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
# Install Python, build tools for native modules (better-sqlite3), and OpenSSL for Prisma
RUN apk add --no-cache python3 make g++ openssl
COPY package*.json ./
# Copy Prisma schema before npm install (needed for postinstall hook)
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
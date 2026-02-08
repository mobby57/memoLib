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

# Copy all necessary files from builder (using default mode instead of standalone)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Use next start instead of node server.js (for default output mode)
CMD ["npx", "next", "start"]
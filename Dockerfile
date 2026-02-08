FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
# Install Python and build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++
COPY package*.json ./
# Copy Prisma schema before npm install (needed for postinstall hook)
COPY prisma ./prisma
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
# Install Python and build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++
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
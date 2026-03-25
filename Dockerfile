# ─── Stage 1: Install dependencies ─────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts --legacy-peer-deps

# Generate Prisma client with linux-musl target
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
RUN npx prisma generate

# ─── Stage 2: Build application ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Provide dummy DATABASE_URL for build (Prisma needs it at build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm run build

# ─── Stage 3: Production runner ───────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma generated client (custom output path)
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

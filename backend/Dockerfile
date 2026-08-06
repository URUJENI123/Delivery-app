# ─── Build stage 1: install dependencies ───────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --omit=dev || npm install --omit=dev

# ─── Build stage 2: generate Prisma client + compile TypeScript ────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate must run before tsc — the emitted JS imports the client types
RUN npx prisma generate
RUN npm run build

# ─── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3001

# Single-process entry (default). For multi-process: CMD ["node", "dist/cluster.js"]
CMD ["node", "dist/index.js"]

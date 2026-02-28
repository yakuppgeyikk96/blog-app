FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# --- Dependencies ---
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/typescript-config/node_modules ./packages/typescript-config/node_modules 2>/dev/null || true

COPY apps/api ./apps/api
COPY packages/typescript-config ./packages/typescript-config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

RUN pnpm --filter @blog-app/api run build

# --- Production ---
FROM base AS production

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "node_modules/.bin/fastify", "start", "-l", "info", "-a", "0.0.0.0", "dist/app.js"]

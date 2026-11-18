# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild @prisma/engines
COPY prisma ./prisma
RUN npm run prisma:generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm rebuild @prisma/engines && npm cache clean --force
COPY prisma ./prisma
RUN npm run prisma:generate

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL="file:/app/data/orion.db" \
    CHECKPOINT_DISABLE=1
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/index.js"]



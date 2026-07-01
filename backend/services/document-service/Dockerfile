FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/services/document-service/package.json ./backend/services/document-service/
RUN npm ci --ignore-scripts

COPY backend/shared ./backend/shared
COPY backend/services/document-service ./backend/services/document-service
RUN npm run build -w @procurement/types  && npm run build -w @procurement/common  && npm run build -w @procurement/utils  && npm run build -w @procurement/middleware  && npm run build -w @procurement/document-service

FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/services/document-service/package.json ./backend/services/document-service/
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine

RUN apk upgrade --no-cache \
    && apk add --no-cache openssl \
    && addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production
ENV PORT=5004

WORKDIR /app
COPY --chown=app:app --from=prod-deps /app/node_modules ./node_modules
COPY --chown=app:app --from=builder /app/package.json ./
COPY --chown=app:app --from=builder /app/backend/shared ./backend/shared
COPY --chown=app:app --from=builder /app/backend/services/document-service ./backend/services/document-service

RUN mkdir -p logs /data && chown app:app logs /data
EXPOSE 5004
USER app

CMD ["sh", "-c", "node_modules/.bin/prisma db push --schema=backend/services/document-service/prisma/schema.prisma --skip-generate && node backend/services/document-service/dist/server.js"]

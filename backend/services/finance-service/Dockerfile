FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/services/finance-service/package.json ./backend/services/finance-service/
RUN npm ci --ignore-scripts

COPY backend/shared ./backend/shared
COPY backend/services/finance-service ./backend/services/finance-service
RUN npm run build -w @procurement/types  && npm run build -w @procurement/common  && npm run build -w @procurement/utils  && npm run build -w @procurement/middleware  && npm run build -w @procurement/finance-service

FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/services/finance-service/package.json ./backend/services/finance-service/
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine

RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates chromium freetype harfbuzz nss ttf-freefont openssl \
    && addgroup -S app && adduser -S app -G app

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV PORT=5002

WORKDIR /app
COPY --chown=app:app --from=prod-deps /app/node_modules ./node_modules
COPY --chown=app:app --from=builder /app/package.json ./
COPY --chown=app:app --from=builder /app/backend/shared ./backend/shared
COPY --chown=app:app --from=builder /app/backend/services/finance-service ./backend/services/finance-service

RUN mkdir -p logs && chown app:app logs
EXPOSE 5002
USER app

CMD ["sh", "-c", "node_modules/.bin/prisma db push --schema=backend/services/finance-service/prisma/schema.prisma --skip-generate && node backend/services/finance-service/dist/server.js"]

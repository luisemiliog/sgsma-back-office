FROM node:22-alpine AS builder

WORKDIR /app

# Build backend
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Build frontend (vite build corre en mode production por defecto)
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci
COPY client ./client
RUN cd client && npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist       ./dist
COPY --from=builder /app/client/dist ./client/dist

RUN mkdir -p /app/uploads

EXPOSE 3002

CMD ["node", "dist/app.js"]

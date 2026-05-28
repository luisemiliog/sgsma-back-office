FROM node:22-alpine AS builder

WORKDIR /app

# Build backend
COPY package.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Build frontend
COPY client/package.json ./client/
RUN cd client && npm ci
COPY client ./client
RUN cd client && npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3002

CMD ["node", "dist/app.js"]

# Etapa 1 — Build
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2 — Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# O Cloud Run injeta a variável PORT automaticamente
ENV PORT=8080

# Copia apenas o necessário para runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/main.js"]



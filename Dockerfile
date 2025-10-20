# deps
FROM node:22.1.0-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates python3 make g++ pkg-config && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

# build
FROM node:22.1.0-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_REDIS=1
# ensure Prisma Client is generated for glibc
RUN npx -y prisma@6 generate
# build your Next app (assumes output: "standalone" in next.config)
RUN npm run build

# run
FROM node:22.1.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=staging
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*
# include prisma schema (so migrate works inside container)
COPY --from=builder /app/prisma ./prisma
# include the Next standalone output + assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["sh","-lc","npx -y prisma@6 migrate deploy --schema=/app/prisma/schema.prisma && node server.js"]

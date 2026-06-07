FROM node:24

WORKDIR /

ENV CI=true

RUN corepack enable
RUN corepack prepare pnpm@10.33.0 --activate

# Copy and build the shared package first
COPY shared /shared
WORKDIR /shared
RUN pnpm install
RUN pnpm run build

# Set up the backend
WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./

RUN pnpm install

COPY backend/ .

EXPOSE 4000

CMD ["sh", "-c", "pnpm install --no-frozen-lockfile && pnpm exec tsc --project /shared/tsconfig.json && pnpm run start:dev"]

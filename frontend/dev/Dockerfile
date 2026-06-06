FROM oven/bun:1.3.0

WORKDIR /

# Copy and build the shared package first
COPY shared /shared
WORKDIR /shared
RUN bun install
RUN bun run build

# Set up the frontend
WORKDIR /app

COPY frontend/package.json ./
COPY frontend/bun.lock ./

RUN bun install

COPY frontend/ .

EXPOSE 3000

CMD ["sh", "-c", "bun install && bun run dev"]

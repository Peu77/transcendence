FROM oven/bun:1.3.0

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

RUN bun install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "bun install && bun run dev"]

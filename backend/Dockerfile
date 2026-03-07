FROM node:24

WORKDIR /app

ENV CI=true

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY package*.json ./

RUN pnpm install


COPY . .

EXPOSE 4000

CMD ["pnpm", "run", "start:dev"]
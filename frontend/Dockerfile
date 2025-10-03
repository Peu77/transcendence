FROM node:20-alpine

WORKDIR /app

COPY ./refreshjs /refreshjs
WORKDIR /refreshjs
RUN npm install && npm run build

WORKDIR /app

COPY ./frontend/package*.json ./

RUN npm install

COPY ./frontend .

EXPOSE 5173

CMD ["sh", "-c", "npm install && npm run dev -- --host"]

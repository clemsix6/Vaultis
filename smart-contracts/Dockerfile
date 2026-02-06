FROM node:22-alpine

RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx hardhat compile

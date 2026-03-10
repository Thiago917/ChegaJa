FROM node:22

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000
CMD ['npm', 'run dev']

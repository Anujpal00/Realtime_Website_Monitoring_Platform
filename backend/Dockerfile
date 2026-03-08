FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY src ./src
COPY .env.example ./
EXPOSE 4000
CMD ["npm","start"]

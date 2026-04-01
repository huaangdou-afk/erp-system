FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/client/package*.json ./src/client/
RUN cd src/client && npm install
COPY src/client/ ./src/client/
RUN npm run build
COPY src/server/ ./src/server/
EXPOSE 3001
CMD ["node", "src/server/index.js"]

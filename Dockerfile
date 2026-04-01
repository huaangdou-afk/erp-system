FROM node:20-slim

WORKDIR /app

# Install all deps (root + client + server)
COPY package*.json ./
RUN npm install

COPY src/client/package*.json ./src/client/
RUN cd src/client && npm install

# Build frontend
COPY src/client/ ./src/client/
RUN npm run build

# Server deps (already installed via root npm install)
COPY src/server/ ./src/server/

# Expose port
EXPOSE 3001

# Start backend (serves API + static frontend from src/client/dist)
CMD ["node", "src/server/index.js"]

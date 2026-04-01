FROM node:20
WORKDIR /app
COPY . .
RUN npm install && cd src/client && npm install && npm run build
EXPOSE 3001
CMD ["node", "src/server/index.js"]

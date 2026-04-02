FROM node:22-slim
WORKDIR /app
COPY server.js package.json ./
RUN npm install ws
EXPOSE 8080
CMD ["node", "server.js"]

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY monitor.js ./
USER node
CMD ["node", "monitor.js"]

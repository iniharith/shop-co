FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY monitor.js designer-report.js shopco-client.js shopco-session.js assistant.js image-match.js image-index.js build-image-index.js station-client.js model-bridge.js update-checkpoint.js ./
USER node
CMD ["node", "monitor.js"]

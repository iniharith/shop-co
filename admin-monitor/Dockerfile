FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY chat-operations.js monitor.js shopco-client.js shopco-session.js assistant.js image-match.js image-index.js build-image-index.js station-client.js model-bridge.js update-checkpoint.js ./
CMD ["sh", "-c", "mkdir -p /data && chown node:node /data && exec su-exec node node monitor.js"]

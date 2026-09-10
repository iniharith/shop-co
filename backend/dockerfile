# MongoDB Database Tools publishes Debian packages used by the protected
# database-backup download endpoint.
FROM node:22-bookworm-slim

ARG MONGODB_DATABASE_TOOLS_VERSION=100.12.2

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl --fail --location --output /tmp/mongodb-database-tools.deb \
      "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-${MONGODB_DATABASE_TOOLS_VERSION}.deb" \
    && apt-get install -y --no-install-recommends /tmp/mongodb-database-tools.deb \
    && mongodump --version \
    && rm -f /tmp/mongodb-database-tools.deb \
    && apt-get purge -y --auto-remove curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy only package.json and package-lock.json first for better caching
COPY package*.json ./

# Install the exact locked dependency graph, including build tooling.
RUN npm ci

# Copy the rest of the app files
COPY . .

# Build the TypeScript project
RUN npm run build

# Runtime image does not need TypeScript or other development tooling.
RUN npm prune --omit=dev

# Expose the port your app uses
EXPOSE 8000

# Run the compiled JavaScript
CMD ["npm", "start"]

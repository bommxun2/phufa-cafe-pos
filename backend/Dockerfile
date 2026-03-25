# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: Runner
FROM node:22-alpine AS runner

# Set environment to production
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy dependencies and package files from the builder stage
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/package*.json ./

# Copy the application source code
COPY --chown=node:node src/ ./src/

# Switch to the non-root 'node' user for security
USER node

# Expose the application port
EXPOSE 5000

# Start the application directly with node
CMD ["node", "src/server.js"]
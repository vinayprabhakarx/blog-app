# Use lightweight Node.js 20 Alpine Linux image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install exact production dependencies cleanly
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Create necessary runtime folders and set ownership
RUN mkdir -p uploads logs && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose backend port
EXPOSE 5000

# Configure Docker Healthcheck using lightweight wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Node.js Express server
CMD ["node", "server.js"]

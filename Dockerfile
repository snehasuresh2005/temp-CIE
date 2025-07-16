# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Install necessary packages for Prisma, health checks, and tsx
RUN apk add --no-cache \
  openssl \
  netcat-openbsd \
  python3 \
  make \
  g++ \
  && npm install -g tsx

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /app/start.sh && \
    echo 'while ! nc -z postgres 5432; do' >> /app/start.sh && \
    echo '  sleep 1' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "Database is ready!"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'pnpm prisma migrate deploy' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Seeding database..."' >> /app/start.sh && \
    echo 'pnpm exec tsx prisma/seed.ts' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'pnpm start' >> /app/start.sh

# Make the script executable
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["/app/start.sh"]

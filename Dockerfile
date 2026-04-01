# Multi-stage build for optimal size
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

# Production nginx image
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist ./usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

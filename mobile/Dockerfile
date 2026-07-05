# Build Stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source files and build for web
COPY . .
# Setting EXPO_PUBLIC_* variables here if they are needed during build time
RUN bun run build:web

# Serve Stage
FROM nginx:alpine
# Copy static web export from the builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add SPA routing configuration
RUN echo "server { listen 80; root /usr/share/nginx/html; location / { try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

# Expose standard nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

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

# Static-export routing (plan §30): per-route .html files, dynamic-prefix rewrites
# to their templates (client resolves id/slug), real 404s for unknown paths,
# immutable caching for hashed Expo assets. Expo emits +not-found.html (not 404.html).
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location /_expo/ {\n    add_header Cache-Control "public, max-age=31536000, immutable";\n    access_log off;\n    try_files $uri =404;\n  }\n  location ~* \\.(ico|css|js|gif|jpe?g|png|webp|svg|woff2?|ttf|eot)$ {\n    add_header Cache-Control "public, max-age=31536000, immutable";\n    access_log off;\n    try_files $uri =404;\n  }\n  location / {\n    try_files $uri $uri.html $uri/ @dynamic;\n  }\n  location @dynamic {\n    rewrite ^/product/.+ /product/[id].html last;\n    rewrite ^/mall/.+ /mall/[id].html last;\n    rewrite ^/category/.+ /category/[slug].html last;\n    rewrite ^/order/.+ /order/[id].html last;\n    rewrite ^/track-order/.+ /track-order/[id].html last;\n    return 404;\n  }\n  error_page 404 /+not-found.html;\n}\n' > /etc/nginx/conf.d/default.conf

# Expose standard nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

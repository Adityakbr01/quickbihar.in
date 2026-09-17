# 1. Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# 2. Build the static SPA
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set relative paths so the frontend automatically uses the current IP/domain.
# Vite inlines VITE_* vars into the JS bundle at build time.
ARG VITE_API_URL=/api/v1
ARG VITE_SOCKET_URL=/
ARG VITE_GOOGLE_CLIENT_ID=183149129805-vf8pkq6h066lcapjanjv1271g36jvij4.apps.googleusercontent.com

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# 3. Production image — serve dist/ with nginx + SPA fallback
FROM nginx:alpine AS runner

# ngx_brotli is not compiled into nginx:alpine — install it from Alpine
# repos so the `brotli_*` directives in nginx.conf don't crash startup.
# The official image includes /etc/nginx/modules/*.conf at main context,
# which is the only place `load_module` is allowed.
RUN apk add --no-cache nginx-mod-http-brotli && \
    printf 'load_module modules/ngx_http_brotli_filter_module.so;\nload_module modules/ngx_http_brotli_static_module.so;\n' \
      > /etc/nginx/modules/10-brotli.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

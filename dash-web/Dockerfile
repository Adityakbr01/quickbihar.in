# Dashboard (dash-web) image — static Vite SPA served by container nginx,
# same pattern as mobile-web. Built by CI (.github/workflows/docker-ci-cd.yml
# matrix entry "web-dash") and run as service `web-dash` on 127.0.0.1:3002.

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

# 3. Production image — plain nginx:alpine serving dist/ with SPA fallback.
# NOTE: no brotli module here on purpose. nginx:alpine pins nginx 1.31.x
# while Alpine's nginx-mod-http-brotli lags (1.30.x) and apk refuses the
# mix, which broke CI. Dynamic gzip is on below; the host nginx also
# gzips, so nothing is served uncompressed.
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

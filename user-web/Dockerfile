# Customer app (user-web) image — static Vite SPA + prerendered SEO pages,
# served by container nginx. Same pattern as web-dash.
# Built by CI (.github/workflows/docker-ci-cd.yml matrix entry "user-web")
# and run as service `user-web` on 127.0.0.1:7001 (replaces mobile-web/Expo).

# 1. Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# 2. Build the static SPA + prerender
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite inlines VITE_* vars into the JS bundle at build time.
# API_ORIGIN must be the absolute origin — axios appends /api/v1 and
# socket.io connects to it directly (unlike dash-web which uses /api/v1).
ARG VITE_API_ORIGIN=https://quickbihar.in
ARG VITE_GOOGLE_WEB_CLIENT_ID=183149129805-vf8pkq6h066lcapjanjv1271g36jvij4.apps.googleusercontent.com
ARG VITE_GOOGLE_IOS_CLIENT_ID=
ARG VITE_GOOGLE_ANDROID_CLIENT_ID=

ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
ENV VITE_GOOGLE_WEB_CLIENT_ID=$VITE_GOOGLE_WEB_CLIENT_ID
ENV VITE_GOOGLE_IOS_CLIENT_ID=$VITE_GOOGLE_IOS_CLIENT_ID
ENV VITE_GOOGLE_ANDROID_CLIENT_ID=$VITE_GOOGLE_ANDROID_CLIENT_ID

# `npm run build` first refreshes src/data/*-static.json from the live API
# (all CATALOG_VERTICALS) so every active product/mall gets a prerendered page.
# Builders without API access fall back to the committed JSON (see script).
RUN npm run build

# 3. Production image — plain nginx:alpine serving dist/ with prerender-aware fallback.
# NOTE: no brotli module here on purpose (same reason as dash-web). Dynamic gzip
# is on below; precompressed .gz from `vite-plugin-compression` is served via
# gzip_static. The .br files are ignored without the brotli module — harmless.
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Build Stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source files and build for web
COPY . .
# Build-time API origin (CI has no .env — .env is gitignored). Defaults to the
# production origin so prerender fetches and inlined config never bake "undefined".
ARG EXPO_PUBLIC_API_ORIGIN=https://quickbihar.in
ENV EXPO_PUBLIC_API_ORIGIN=${EXPO_PUBLIC_API_ORIGIN}
RUN bun run build:web

# Serve Stage
FROM nginx:alpine
# Copy static web export from the builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx static SEO + SPA fallback configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

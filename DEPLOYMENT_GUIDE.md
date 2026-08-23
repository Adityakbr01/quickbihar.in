# QuickBihar Production VPS Setup & Deployment Guide

This guide details the complete production setup for **QuickBihar** on your Oracle Cloud VPS, fully aligned with your existing multi-tenant architecture standard (VoiceAct).

---

## 1. Production Architecture Overview

```
[ Oracle Cloud VPS (Ubuntu 24.04 LTS) ]
  ├── Ports Exposed: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  │
  ├── Global Host Nginx (/etc/nginx/)
  │    ├── sites-available/voiceact.conf  -> 127.0.0.1:3001 (Web), 127.0.0.1:5001 (Backend)
  │    └── sites-available/quickbihar.conf -> 127.0.0.1:3002 (Web & Landing), 127.0.0.1:5002 (Backend API & Sockets)
  │
  ├── Docker Engine (Isolated Localhost Containers)
  │    ├── VoiceAct App Network (voiceact-network)
  │    └── QuickBihar App Network (quickbihar-network)
  │         ├── quickbihar-server     (127.0.0.1:5002 -> 8000)
  │         ├── quickbihar-web        (127.0.0.1:3002 -> 3000) [Landing Page + Dashboards]
  │         └── quickbihar-redis      (redis:6379)
  │
  └── GitHub Self-Hosted Runners
       ├── ~/runners/voiceact-web/ (VoiceAct pipeline)
       └── ~/runners/quickbihar/   (QuickBihar pipeline)
```

---

## 2. Port Allocation & Resource Matrix

| Project | Service | Container Name | Localhost Port | Internal Port | Docker Network |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VoiceAct** | Frontend Web | `voiceact-web` | `127.0.0.1:3001` | `3000` | `voiceact-network` |
| **VoiceAct** | Backend API | `voiceact-backend` | `127.0.0.1:5001` | `5000` | `voiceact-network` |
| **QuickBihar** | Backend API & Sockets | `quickbihar-server` | `127.0.0.1:5002` | `8000` | `quickbihar-network` |
| **QuickBihar** | Next.js Landing & Portals | `quickbihar-web` | `127.0.0.1:3002` | `3000` | `quickbihar-network` |
| **QuickBihar** | Redis Queues & Cache | `quickbihar-redis` | Internal | `6379` | `quickbihar-network` |

> [!NOTE]
> No container port is exposed publicly to the internet. Only `127.0.0.1` binding is used, preventing public access bypasses around Nginx.

---

## 3. Repository Folder Structure

```
quickbihar.in/
├── .github/
│   └── workflows/
│       └── docker-ci-cd.yml    # GitHub Actions workflow targeting ~/runners/quickbihar
├── vps-nginx/
│   └── quickbihar.conf         # Host Nginx configuration template
├── server/                      # Bun / Express API backend
│   ├── Dockerfile
│   └── src/
├── web/                         # Next.js Dashboard (Admin/Seller/Delivery)
│   ├── Dockerfile
│   └── src/
├── mobile/                      # Expo Mobile / Web storefront
│   ├── Dockerfile
│   └── src/
├── docker-compose.yml           # Production Compose spec (no proxy service)
├── DEPLOYMENT_GUIDE.md          # Step-by-step setup documentation
└── README.md
```

---

## 4. Step-by-Step VPS Setup Instructions

Follow these exact steps on your Oracle Cloud VPS to complete the setup.

### Step 4.1: Create Application Directory
SSH into your VPS and create the deployment directory:

```bash
mkdir -p ~/apps/quickbihar
```

### Step 4.2: Setup Dedicated GitHub Self-Hosted Runner
Create a dedicated runner folder separate from VoiceAct:

```bash
mkdir -p ~/runners/quickbihar && cd ~/runners/quickbihar
```

Download and configure the GitHub runner package (Get your runner token from GitHub Repo → **Settings** → **Actions** → **Runners** → **New self-hosted runner**):

```bash
# Download latest runner package
curl -o actions-runner-linux-x64-2.317.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-x64-2.317.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.317.0.tar.gz

# Configure runner (use default name e.g. quickbihar-runner)
./config.sh --url https://github.com/YOUR_GITHUB_USERNAME/quickbihar.in --token YOUR_RUNNER_TOKEN --work ~/apps/quickbihar

# Install & start service
sudo ./svc.sh install
sudo ./svc.sh start
```

### Step 4.3: Configure Host Nginx Site
Copy the Nginx site configuration to `/etc/nginx/sites-available/quickbihar.conf`:

```bash
# Option A: Copy directly from repo or create the file manually
sudo nano /etc/nginx/sites-available/quickbihar.conf
```

Paste the contents of `vps-nginx/quickbihar.conf`:

```nginx
upstream quickbihar_backend {
    server 127.0.0.1:5002;
    keepalive 32;
}

upstream quickbihar_web {
    server 127.0.0.1:3002;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;

    server_name quickbihar.in www.quickbihar.in _;

    client_max_body_size 50m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    gzip on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # 1. REST API Endpoints
    location /api/ {
        proxy_pass http://quickbihar_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    # 2. Realtime WebSockets
    location /socket.io/ {
        proxy_pass http://quickbihar_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # 3. Next.js Static Assets
    location ^~ /_next/ {
        proxy_pass http://quickbihar_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 4. Landing Page and All Portal Routes (/admin, /seller, /delivery, etc.)
    location / {
        proxy_pass http://quickbihar_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the Nginx site configuration via symlink:

```bash
sudo ln -sf /etc/nginx/sites-available/quickbihar.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4.4: Add Domain & Certbot SSL (When Domain is Ready)
Once your DNS `A` records point to your VPS IP:

```bash
# Update server_name in /etc/nginx/sites-available/quickbihar.conf:
# server_name quickbihar.in www.quickbihar.in;

# Obtain SSL Certificate
sudo certbot --nginx -d quickbihar.in -d www.quickbihar.in
```

Certbot will automatically generate SSL certificates and update the `/etc/nginx/sites-available/quickbihar.conf` file with HTTPS redirects.

---

## 5. GitHub Repository Secrets Setup

Configure the following secrets in GitHub Repository → **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Value Description | Example |
| :--- | :--- | :--- |
| `DOCKER_USER` | Your Docker Hub Username | `adityakbr` |
| `DOCKER_PASS` | Your Docker Hub Personal Access Token | `dckr_pat_xxxx...` |
| `SERVER_ENV` | Full contents of `server/.env` | `PORT=8000\nMONGODB_URI=...` |
| `WEB_ENV` | Full contents of `web/.env` | `NEXT_PUBLIC_API_URL=/api/v1` |
| `MOBILE_ENV` | Full contents of `mobile/.env` (optional) | `EXPO_PUBLIC_API_URL=/api/v1` |

---

## 6. Migration & Verification Checklist

### Migration Tasks Completed
- [x] Removed Docker Nginx proxy (`proxy:` container, `nginx/`, `deploy/`).
- [x] Updated `docker-compose.yml` to bind services strictly to `127.0.0.1:5002`, `127.0.0.1:3002`, `127.0.0.1:7001`.
- [x] Configured isolated Docker bridge network `quickbihar-network`.
- [x] Created GitHub Actions workflow targeting dedicated self-hosted runner.
- [x] Prepared host VPS Nginx site configuration (`vps-nginx/quickbihar.conf`).

### Post-Deployment Verification Commands (Run on VPS)

1. **Verify Docker Container Status**:
   ```bash
   docker compose -f ~/apps/quickbihar/docker-compose.yml ps
   ```
   *Expected output*: `quickbihar-server`, `quickbihar-web`, `quickbihar-mobile-web` all showing status `healthy` or `running`.

2. **Verify Localhost Port Binding**:
   ```bash
   curl -I http://127.0.0.1:5002/api/v1/health
   curl -I http://127.0.0.1:3002
   curl -I http://127.0.0.1:7001
   ```

3. **Verify Host Nginx Routing**:
   ```bash
   curl -I http://localhost/
   curl -I http://localhost/api/
   curl -I http://localhost/_next/
   ```

4. **Verify VoiceAct Coexistence**:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Ports}}"
   ```
   *Expected output*: VoiceAct containers on 3001/5001 and QuickBihar containers on 5002/3002/7001, operating completely independently without network or port conflicts.

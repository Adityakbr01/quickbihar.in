# QuickBihar Production VPS Setup & Deployment Guide

This guide details the complete production setup for **QuickBihar** on your Oracle Cloud VPS, fully aligned with your existing multi-tenant architecture standard (VoiceAct).

---

## 1. Production Architecture Overview

```
[ Oracle Cloud VPS (Ubuntu 24.04 LTS) ]
  ├── Ports Exposed: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  │
  ├── Global Host Nginx (/etc/nginx/)
  │    ├── sites-available/voiceact.conf   -> 127.0.0.1:3001 (Web), 127.0.0.1:5001 (Backend)
  │    └── sites-available/quickbihar.conf -> 
  │         ├── quickbihar.in            -> 127.0.0.1:7001 (Expo Web Customer App)
  │         ├── dashboard.quickbihar.in  -> 127.0.0.1:3002 (Partner Next.js Portals)
  │         └── /api/ & /socket.io/      -> 127.0.0.1:5002 (Backend API & Sockets)
  │
  ├── Docker Engine (Isolated Localhost Containers)
  │    ├── VoiceAct App Network (voiceact-network)
  │    └── QuickBihar App Network (quickbihar-network)
  │         ├── quickbihar-server     (127.0.0.1:5002 -> 8000)
  │         ├── quickbihar-web        (127.0.0.1:3002 -> 3000) [Admin/Seller/Delivery Portals]
  │         ├── quickbihar-mobile-web (127.0.0.1:7001 -> 80)   [Customer Storefront SPA]
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
| **QuickBihar** | Partner Next.js Portals | `quickbihar-web` | `127.0.0.1:3002` | `3000` | `quickbihar-network` |
| **QuickBihar** | Customer Storefront Web | `quickbihar-mobile-web` | `127.0.0.1:7001` | `80` | `quickbihar-network` |
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
Copy the tracked Nginx configuration from `vps-nginx/quickbihar.conf` directly to `/etc/nginx/sites-available/quickbihar.conf`:

```bash
sudo cp ~/apps/quickbihar/vps-nginx/quickbihar.conf /etc/nginx/sites-available/quickbihar.conf
sudo ln -sf /etc/nginx/sites-available/quickbihar.conf /etc/nginx/sites-enabled/
```

### Step 4.4: Configure Hostinger DNS & Provision SSL with Certbot

1. **Configure DNS in Hostinger DNS Zone Editor**:
   Add or update these records for `quickbihar.in`:
   
   | Record Type | Name / Host | Target / Points to | TTL | Purpose |
   | :--- | :--- | :--- | :--- | :--- |
   | **A** | `@` | `<YOUR_VPS_PUBLIC_IP>` | 300 | Routes `quickbihar.in` (Customer App) |
   | **CNAME** | `www` | `quickbihar.in` | 300 | 301 redirects to apex domain |
   | **CNAME** (or **A**) | `dashboard` | `quickbihar.in` | 300 | Routes `dashboard.quickbihar.in` (Partner App) |

2. **Issue Multi-Domain SSL Certificate with Certbot**:
   Once DNS records propagate to your VPS IP:
   ```bash
   sudo certbot --nginx -d quickbihar.in -d www.quickbihar.in -d dashboard.quickbihar.in
   ```
   Certbot will validate all three hostnames via ACME challenge and install the unified certificate at `/etc/letsencrypt/live/quickbihar.in/`.

3. **Verify and Reload Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

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

2. **Verify Localhost Port Bindings**:
   ```bash
   curl -I http://127.0.0.1:5002/api/v1/health   # Backend API
   curl -I http://127.0.0.1:3002                  # Partner Dashboard (Next.js)
   curl -I http://127.0.0.1:7001                  # Customer App (Expo Web)
   ```

3. **Verify Public Endpoints (via Nginx & SSL)**:
   ```bash
   # Customer App (Expo Web)
   curl -IL https://quickbihar.in
   curl -IL https://www.quickbihar.in             # Should 301 redirect to https://quickbihar.in

   # Partner Dashboard (Admin, Seller, Delivery)
   curl -IL https://dashboard.quickbihar.in

   # API & WebSocket Health
   curl -IL https://quickbihar.in/api/v1/health
   curl -IL https://dashboard.quickbihar.in/api/v1/health
   ```

4. **Verify VoiceAct Coexistence**:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Ports}}"
   ```
   *Expected output*: VoiceAct containers on 3001/5001 and QuickBihar containers on 5002/3002/7001, operating completely independently without network or port conflicts.

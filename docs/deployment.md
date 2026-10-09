# BloodLink — Deployment Guide

This guide details how to deploy **BloodLink (Emergency Blood Requirement Matching Network)** to production.

---

## Architecture Overview

- **Database:** Hosted on **Neon PostgreSQL** (Cloud Serverless PostgreSQL).
- **Backend:** Java 21 + Spring Boot Web Application (Port 8080 or dynamic `$PORT`).
- **Frontend:** React + Vite Single Page Application (Served via Vercel / Nginx).
- **Real-Time:** Spring WebSocket / STOMP protocol over SockJS.

> **Security Note:** All database credentials, JWT secrets, and API keys must be stored in your cloud host's environment variable manager. Never commit credentials to source code or documentation.

---

## Option 1: Cloud Deployment (Recommended — Free Tier Friendly)

The recommended deployment path:

1. **Database:** Neon PostgreSQL (already cloud-hosted).
2. **Backend:** Deploy on **Render.com** (or **Railway.app**).
3. **Frontend:** Deploy on **Vercel** (or **Netlify**).

---

### Step 0: Rotate Neon Password Before Deployment

Before any deployment, rotate the Neon database password:

1. Go to [Neon Console](https://console.neon.tech/) → your project → **Settings → Roles**.
2. Reset the password for your database role.
3. Copy the new JDBC connection string (with `?sslmode=require`).
4. Use those new credentials when setting environment variables in Render. Do not write them in this file.

---

### Step 1: Push to GitHub

1. Ensure your repository root is at `BloodLink/` (not just the `bloodlink-backend` subfolder).
2. Verify `.env` is in `.gitignore` and not tracked.
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete BloodLink deployment-ready build"
   git remote add origin https://github.com/<your-username>/bloodlink.git
   git push -u origin main
   ```

---

### Step 2: Deploy Backend on Render.com

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New → Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `bloodlink-backend`
   - **Root Directory:** `bloodlink-backend`
   - **Runtime:** `Docker` (Render detects the `Dockerfile` automatically)
4. Under **Environment Variables**, add (values from your Neon dashboard and your own secrets — do not share them):

   | Variable | Description |
   |---|---|
   | `SPRING_DATASOURCE_URL` | Your Neon JDBC URL: `jdbc:postgresql://<host>/<db>?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | Your Neon database username |
   | `SPRING_DATASOURCE_PASSWORD` | Your (rotated) Neon database password |
   | `JWT_SECRET` | A 64-character random hex string (generate: `openssl rand -hex 64`) |
   | `JWT_EXPIRATION` | `86400000` (24 hours in ms) |
   | `CORS_ORIGINS` | `https://your-bloodlink.vercel.app` (add after Vercel deployment) |
   | `MATCHING_RADIUS_KM` | `50.0` |
   | `SEED_DEMO_DATA` | `true` for first run; consider `false` after demo accounts are seeded |

5. Click **Create Web Service**.
6. Monitor build logs. First build takes ~5 minutes (Maven compiles in Docker).
7. Note your Render URL: `https://bloodlink-backend-xxxx.onrender.com`

---

### Step 3: Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com/) → **Add New → Project** → import your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset auto-detects **Vite**.
4. Under **Environment Variables**, add:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-render-service.onrender.com/api` |
   | `VITE_WS_URL` | `https://your-render-service.onrender.com/ws` |

   > Note: `VITE_WS_URL` uses `https://` because the frontend uses SockJS, which connects via HTTP/HTTPS (not `wss://`). SockJS upgrades to WebSocket internally.

5. Click **Deploy**.
6. After Vercel deploys, copy your Vercel domain and update `CORS_ORIGINS` in Render to include it.
7. Redeploy the Render backend after updating CORS.

---

### Step 4: Configure vercel.json for SPA Routing

Create a `frontend/vercel.json` to ensure React Router deep links work:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Option 2: Docker Compose (Self-Hosted / VPS)

1. Clone the repository on your Linux VPS.
2. Create a `.env` file at the project root:
   ```bash
   cp .env.example .env
   # Edit .env and fill in all values
   nano .env
   ```
3. Start services:
   ```bash
   docker compose up --build -d
   ```

- **Frontend:** `http://<your-server-ip>`
- **Backend:** `http://<your-server-ip>:8080`
- **Database:** Connects to Neon PostgreSQL over SSL.

---

## Pre-Deployment Verification Checklist

- [x] Java 21 configured in `pom.xml`.
- [x] Neon PostgreSQL JDBC URL with `sslmode=require`.
- [x] `server.port=${PORT:8080}` for cloud dynamic port binding.
- [x] Credentials loaded from environment variables only — no hardcoded fallbacks.
- [x] Frontend `VITE_API_BASE_URL` and `VITE_WS_URL` configured.
- [x] Production build verified (`npm run build` succeeds — 0 errors).
- [x] All 22 backend automated tests passing (`mvnw clean test`).
- [x] `SEED_DEMO_DATA` flag controls demo account creation.
- [x] Medical disclaimer present on all UI views and API payloads.
- [x] `vercel.json` rewrite rule for React Router SPA navigation.
- [ ] Neon database password rotated before production.
- [ ] CORS_ORIGINS set to exact Vercel domain (not `*`).

# QualityTrack — Production Deployment Guide for Render

This guide outlines how to deploy the entire **QualityTrack** platform to [Render](https://render.com).

QualityTrack consists of 4 components:
1. **Render PostgreSQL Database** (`qualitytrack-db`) — Persistent database for test cases, suites, executions, and bug reports.
2. **Core Backend Web Service** (`qualitytrack-backend`) — Express.js + Prisma REST API and test execution engine.
3. **Simulated Demo API Web Service** (`qualitytrack-demo-api`) — Isolated target microservice used for test runs.
4. **Frontend Static Site** (`qualitytrack-frontend`) — React + Vite SPA dashboard with client-side routing.

---

## Method 1: Automated Blueprint Deployment (Recommended)

Render Blueprints allow you to provision all 4 services automatically from the included `render.yaml` file.

### Steps:
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your GitHub repository: `https://github.com/rishiraj9701/QualityTrack`.
5. Render will automatically detect `render.yaml` and display the blueprint plan:
   - `qualitytrack-db` (PostgreSQL)
   - `qualitytrack-backend` (Node Web Service)
   - `qualitytrack-demo-api` (Node Web Service)
   - `qualitytrack-frontend` (Static Site)
6. Click **Apply**.
7. Render will provision the database, build each service, run Prisma migrations, seed the initial test suite, and launch the frontend.

---

## Method 2: Manual Dashboard Deployment

If you prefer to configure each service manually in the Render UI, follow these steps:

### Step 1: Create PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Set:
   - **Name:** `qualitytrack-db`
   - **Database:** `qualitytrack`
   - **User:** `qualitytrack_user`
   - **Region:** Any (e.g. Oregon)
   - **Plan:** Free
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g. `postgresql://qualitytrack_user:...@dpg-...-a/qualitytrack`).

---

### Step 2: Create Core Backend Web Service
1. Click **New +** → **Web Service**.
2. Connect your repository (`QualityTrack`).
3. Set the following fields:
   - **Name:** `qualitytrack-backend`
   - **Region:** Same region as your database
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build && npm run db:deploy && npm run seed`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Under **Advanced** → **Health Check Path**, enter: `/health`.
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Paste the Internal Database URL from Step 1)*
   - `JWT_SECRET`: *(Enter a secure random 32+ character string)*
   - `FRONTEND_URL`: `https://qualitytrack-frontend.onrender.com` *(or leave blank)*
6. Click **Create Web Service**.
7. Note down the deployed service URL (e.g. `https://qualitytrack-backend.onrender.com`).

---

### Step 3: Create Demo API Web Service
1. Click **New +** → **Web Service**.
2. Connect your repository (`QualityTrack`).
3. Set the following fields:
   - **Name:** `qualitytrack-demo-api`
   - **Region:** Same region
   - **Root Directory:** `demo-api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Under **Advanced** → **Health Check Path**, enter: `/health`.
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
6. Click **Create Web Service**.
7. Note down the deployed demo service URL (e.g. `https://qualitytrack-demo-api.onrender.com`).

---

### Step 4: Create Frontend Static Site
1. Click **New +** → **Static Site**.
2. Connect your repository (`QualityTrack`).
3. Set the following fields:
   - **Name:** `qualitytrack-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Under **Redirects / Rewrites**, ensure SPA routing rewrite rule is configured:
   - **Type:** `Rewrite`
   - **Source:** `/*`
   - **Destination:** `/index.html`
   *(Note: The repository also includes a `public/_redirects` file that Render automatically recognizes).*
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://qualitytrack-backend.onrender.com/api` *(Your backend URL from Step 2 with /api)*
   - `VITE_DEMO_API_URL`: `https://qualitytrack-demo-api.onrender.com` *(Your demo API URL from Step 3)*
6. Click **Create Static Site**.

---

## Verifying Deployment Readiness

### 1. Backend Health Check
Visit:
```
https://<your-backend-url>/health
```
Expected JSON response:
```json
{
  "status": "UP",
  "platform": "QualityTrack Core Backend",
  "timestamp": "2026-11-19T...",
  "uptimeSeconds": 42,
  "database": "Connected"
}
```

### 2. Demo API Health Check
Visit:
```
https://<your-demo-api-url>/health
```
Expected JSON response:
```json
{
  "status": "UP",
  "service": "QualityTrack Demo API",
  "timestamp": "2026-11-19T...",
  "uptimeSeconds": 42
}
```

### 3. Frontend Dashboard & Test Execution
1. Open your frontend URL in the browser.
2. The Top Navigation bar will show a green **System Active** indicator confirming connection to the backend.
3. Navigate to **Test Suites** → **Run Suite** to execute positive and negative test cases against the live demo service.
4. Navigate to **Settings** → **Reset Demo Target Data** to verify proxy execution.

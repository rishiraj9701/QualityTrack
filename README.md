# QualityTrack – API Testing & Quality Assurance Platform

<div align="center">

![QualityTrack Banner](https://img.shields.io/badge/QualityTrack-QA%20Automation%20Platform-0d9488?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20MVP-success?style=for-the-badge)
![Category](https://img.shields.io/badge/Category-API%20Testing%20%26%20QA%20Platform-blue?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-27%2F27%20Passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**A professional, full-stack API testing, automated assertion validation, test suite execution, defect tracking, and QA telemetry platform.**

*QualityTrack is an independent API Testing and Quality Assurance Platform that enables developers and QA engineers to create test cases, execute API tests, validate responses, track bugs, and analyze testing results through a centralized dashboard.*

</div>

---

## 📑 Table of Contents
1. [Project Overview](#-1-project-overview)
2. [Key Features & Capabilities](#-2-key-features--capabilities)
3. [Technology Stack](#-3-technology-stack)
4. [Project Architecture](#-4-project-architecture)
5. [Folder Structure](#-5-folder-structure)
6. [Available Application URLs & Ports](#-6-available-application-urls--ports)
7. [Installation & Setup](#-7-installation--setup)
8. [Environment Variable Setup](#-8-environment-variable-setup)
9. [Database Setup & Migrations](#-9-database-setup--migrations)
10. [Database Seed Instructions](#-10-database-seed-instructions)
11. [Running the Application](#-11-running-the-application)
12. [Executing Automated Tests](#-12-executing-automated-tests)
13. [Security Considerations & SSRF Protection](#-13-security-considerations--ssrf-protection)
14. [Simulated Demo API Testbed](#-14-simulated-demo-api-testbed)
15. [Technical Demonstration Walkthrough](#-15-technical-demonstration-walkthrough)
16. [Screenshots](#-16-screenshots)
17. [License](#-17-license)

---

## 🎯 1. Project Overview

**QualityTrack** bridges the gap between ad-hoc HTTP exploration tools, structured test management systems, and bug tracking systems. Rather than presenting a static dashboard with mock numbers, QualityTrack is a living platform featuring:

- A **real-time HTTP proxy engine** with microsecond-level timing and payload measurement.
- An **assertion evaluation engine** verifying status codes, dot-notation JSON property values, schema data types, response times, and not-null constraints.
- A **multi-tier environment manager** supporting variable interpolation (e.g. `{{baseUrl}}`, `{{apiKey}}`) with secret masking.
- **Automated batch execution** for test suites and entire projects with database persistence.
- **1-Click Defect Logging**: Automatically parses failed assertions into prefilled bug reports with steps to reproduce and expected vs actual values.
- **Reporting & Telemetry**: Dynamic pass/fail charts, endpoint flakiness leaderboards, and instant CSV export.

---

## 🚀 2. Key Features & Capabilities

### Dashboard & QA Telemetry
- Real-time aggregated statistics calculated directly from database records:
  - Total Projects, Endpoints, Test Cases, and Executions.
  - Overall Pass Rate %, passed/failed/error/skipped counts.
  - Test execution history & assertion trend area chart (Recharts).
  - Pass vs fail distribution donut chart (Recharts).
  - Recent test runs with one-click drill-down.
  - Recently reported defects and flakiness leaderboard.

### Project & Environment Management
- Full CRUD for QA projects with custom base URLs and environment tiers (`Development`, `Staging`, `Production`).
- Environment variable key-value registry supporting `{{variable}}` interpolation in URLs, headers, and request bodies.
- Security-first variable management: Toggleable secret masking prevents credentials from leaking to browser logs or exports.

### Postman-Style API Request Builder
- Interactive HTTP request interface supporting `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Key-value editors for Query Parameters and Request Headers.
- Request body editor with JSON syntax validation and auto-formatter.
- Authentication configurations: `No Auth`, `Bearer Token`, `Basic Auth`, and `API Key` (Header or Query Param).
- Rich response inspector displaying status badge, duration in milliseconds, payload size in KB, formatted JSON response, raw text, and HTTP response headers.
- One-click **"Save Request to Project"** feature.

### Test Case Repository & Scenarios
- Pre-seeded and user-configurable test cases across 6 distinct QA categories:
  - **Positive Testing** (Happy-path validation, schema checks)
  - **Negative Testing** (400 Bad Request, 404 Not Found, 409 Conflict)
  - **Boundary Testing** (String length limits, numeric boundaries, empty payloads)
  - **Edge Case Testing** (Special characters, unhandled types)
  - **Functional Testing** (End-to-end user deletion and state transitions)
  - **Integration Testing** (Multi-step verification)
- Priorities: `Low`, `Medium`, `High`, `Critical`.
- Duplicate test case action with automatic naming and assertion cloning.
- Quick single-test execution directly from the repository table.

### Automated Assertion Engine
Evaluates multiple assertions per request in parallel:
- `STATUS_CODE`: Equality and inequality checks.
- `PROPERTY_EQUALS`: Deep dot-notation path resolution (e.g., `user.profile.email`, `users[0].id`).
- `PROPERTY_TYPE`: Validates primitive and complex types (`string`, `number`, `boolean`, `array`, `object`).
- `RESPONSE_TIME`: Enforces performance SLA thresholds (e.g. `< 800ms`).
- `BODY_CONTAINS`: Substring discovery within response text.
- `NOT_NULL`: Verifies mandatory payload attributes exist and are non-null.

### Defect & Bug Tracking System
- Dedicated QA bug management board with statuses: `Open`, `In Progress`, `Resolved`, `Closed`.
- Severities: `Critical`, `High`, `Medium`, `Low`.
- Direct 1-Click Bug Creation from failed test runs: Auto-fills Bug Title, Project, Endpoint, Test Case, Steps to Reproduce, Expected vs Actual Result.
- Prevents redundant bug duplication and tracks defect lifecycle.

### QA Analytics & Reports
- Executive Quality Assurance report with date filters.
- Breakdown of test pass rates by QA category.
- Defect distribution by severity.
- Endpoint flakiness leaderboard highlighting unstable routes.
- **Export to CSV**: Generates RFC-compliant CSV files containing execution IDs, timestamps, projects, test cases, HTTP status codes, durations, and error logs.

---

## 🛠 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6 |
| **Backend** | Node.js, Express.js, TypeScript, Axios, Helmet, CORS, jsonwebtoken, bcryptjs |
| **Database & ORM** | Prisma ORM, SQLite (`dev.db` for instant local zero-config), PostgreSQL (`schema.postgresql.prisma` ready) |
| **Testing Target** | Dedicated Simulated User Management REST API (Port 5001) |
| **Test Automation** | Jest, Supertest, ts-jest |

---

## 🏗 4. Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 QualityTrack Frontend (Vite)                │
│       React 18 • TypeScript • Tailwind CSS • Recharts       │
│  Pages: Dashboard, RequestBuilder, TestCases, BugTracker... │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 QualityTrack Core Backend                   │
│              Express.js • Node.js • TypeScript              │
│                                                             │
│  ┌────────────────────┐   ┌──────────────────────────────┐  │
│  │   Auth & Projects  │   │     SSRF Guard & Proxy       │  │
│  └────────────────────┘   └──────────────┬───────────────┘  │
│  ┌────────────────────┐                  │                  │
│  │  Assertion Engine  │                  │ Safe HTTP Proxy  │
│  └────────────────────┘                  ▼                  │
│  ┌────────────────────┐       ┌──────────────────────┐      │
│  │    Bug Tracking    │       │   Target Demo API    │      │
│  └────────────────────┘       │ (User Mgmt Port 5001)│      │
│  ┌────────────────────┐       └──────────────────────┘      │
│  │  Reporting & CSV   │                                     │
│  └────────────────────┘                                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Persistence                      │
│      SQLite (Local dev.db) / PostgreSQL (schema included)   │
│   Entities: Project, Environment, Endpoint, TestCase...     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 5. Folder Structure

```
QualityTrack/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Local SQLite database schema
│   │   └── schema.postgresql.prisma   # PostgreSQL production schema
│   ├── src/
│   │   ├── middleware/auth.ts         # JWT authentication & session context
│   │   ├── prisma/
│   │   │   ├── client.ts              # PrismaClient singleton
│   │   │   └── seed.ts                # Seeding script for demo accounts & test cases
│   │   ├── routes/
│   │   │   ├── authRoutes.ts          # /api/auth routes
│   │   │   ├── projectRoutes.ts       # /api/projects routes
│   │   │   ├── endpointRoutes.ts      # /api/endpoints routes
│   │   │   ├── testSuiteRoutes.ts     # /api/test-suites routes
│   │   │   ├── testCaseRoutes.ts      # /api/test-cases routes
│   │   │   ├── executionRoutes.ts     # /api/executions routes
│   │   │   ├── proxyRoutes.ts         # /api/proxy live request execution
│   │   │   ├── bugRoutes.ts           # /api/bugs defect tracking
│   │   │   ├── reportRoutes.ts        # /api/reports analytics & CSV export
│   │   │   └── dashboardRoutes.ts     # /api/dashboard statistics
│   │   ├── services/
│   │   │   ├── assertionEvaluator.ts  # Deep assertion evaluation engine
│   │   │   ├── proxyService.ts        # HTTP proxy client with timing
│   │   │   └── executionEngine.ts     # Batch runner & variable interpolator
│   │   ├── utils/ssrfGuard.ts         # SSRF protection and URL policy validator
│   │   └── server.ts                  # Main Express backend server
│   ├── tests/
│   │   ├── assertions.test.ts         # Assertion evaluator unit tests
│   │   ├── ssrfGuard.test.ts          # SSRF guard security tests
│   │   └── api.test.ts                # Supertest integration tests
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── demo-api/
│   ├── src/
│   │   ├── store.ts                   # In-memory target state & reset method
│   │   ├── routes.ts                  # Simulated User Management REST endpoints
│   │   └── server.ts                  # Demo API server on Port 5001
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                # Badge, Modal, Skeleton, EmptyState
│   │   │   └── layout/                # AppLayout, Sidebar, TopNav
│   │   ├── context/
│   │   │   ├── ThemeContext.tsx       # Dark/Light theme toggle
│   │   │   ├── ToastContext.tsx       # Global toast notification provider
│   │   │   └── ProjectContext.tsx     # Active project & variable interpolation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Real-time metrics & Recharts graphs
│   │   │   ├── Projects.tsx           # Project cards & environment variable editor
│   │   │   ├── RequestBuilder.tsx     # Postman-style HTTP runner
│   │   │   ├── TestSuites.tsx         # Test suites manager
│   │   │   ├── TestCases.tsx          # Test case repository with filters
│   │   │   ├── TestRuns.tsx           # Test execution audit log
│   │   │   ├── TestRunDetail.tsx      # Run inspector with 1-click Log Bug
│   │   │   ├── BugReports.tsx         # Defect tracker & triage workflow
│   │   │   ├── Reports.tsx            # Executive QA reports & CSV export
│   │   │   └── Settings.tsx           # Target API reset & infrastructure info
│   │   ├── services/api.ts            # Centralized API service layer
│   │   ├── types/index.ts             # TypeScript definitions
│   │   ├── App.tsx                    # Routes configuration
│   │   ├── index.css                  # Tailwind styles
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── PROJECT_PROGRESS.md
├── README.md
├── .gitignore
└── package.json                       # Root script orchestrator
```

---

## 🌐 6. Available Application URLs & Ports

| Service | Port | Local URL | Description |
|---|---|---|---|
| **Frontend UI** | `3000` | `http://localhost:3000` | React + Vite Single Page Application |
| **Backend REST API** | `5000` | `http://localhost:5000` | Core QualityTrack API & Execution Engine |
| **Demo Target API** | `5001` | `http://localhost:5001` | Simulated User Management testing target |

---

## ⚡ 7. Installation & Setup

### Prerequisites
- **Node.js**: v18 or higher (v24 tested)
- **npm**: v9 or higher
- **Git**

### Installation Steps
From the project root:
```bash
# 1. Install dependencies across root, backend, demo-api, and frontend
npm run install:all
```

---

## 🔑 8. Environment Variable Setup

QualityTrack comes pre-configured with safe local development defaults. To customize:

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```bash
# SQLite (default for instant local development)
DATABASE_URL="file:./dev.db"

# PostgreSQL (for production)
# DATABASE_URL="postgresql://user:password@localhost:5432/qualitytrack?schema=public"

PORT=5000
JWT_SECRET="qualitytrack-dev-jwt-secret-key-2024"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Demo API (`demo-api/.env`)
Copy `demo-api/.env.example` to `demo-api/.env`:
```bash
PORT=5001
NODE_ENV=development
```

---

## 🗄 9. Database Setup & Migrations

### Local Zero-Config Setup (SQLite)
By default, QualityTrack uses a portable SQLite database located at `backend/prisma/dev.db`.
To generate the Prisma Client and push the database schema:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Production Setup (PostgreSQL)
To run against PostgreSQL:
1. Update `DATABASE_URL` in `backend/.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/qualitytrack?schema=public"
   ```
2. Replace `backend/prisma/schema.prisma` with `backend/prisma/schema.postgresql.prisma`.
3. Run `npx prisma db push` or `npx prisma migrate dev --name init`.

---

## 🌱 10. Database Seed Instructions

To populate the database with initial demo data (a default project, environments, endpoints, test suites, and 10 realistic test cases TC001–TC010):

```bash
npm run seed
```

Default seeded credentials:
- **Email:** `demo@qualitytrack.local`
- **Password:** `Password123!`

*(The seed script is fully idempotent and safe to run multiple times).*

---

## 💻 11. Running the Application

Start all services (Frontend, Backend, and Demo API) simultaneously with a single command:

```bash
npm run dev
```

Alternatively, run each service in separate terminals:
- **Backend:** `cd backend && npm run dev`
- **Demo API:** `cd demo-api && npm run dev`
- **Frontend:** `cd frontend && npm run dev`

Open your browser at **`http://localhost:3000`**.

---

## 🔬 12. Executing Automated Tests

QualityTrack features a comprehensive test suite using **Jest** and **Supertest** covering:
- Assertion evaluation logic (Status codes, property equality, data types, latency thresholds)
- SSRF guard security rules (IP blacklisting, protocol validation, loopback restriction)
- Full REST API integration tests (Auth, Projects, Endpoints, Test Cases, Executions, Bug Reports, Reports)

To execute the tests:
```bash
npm test
```

### Test Results
```
PASS tests/api.test.ts (15 tests)
PASS tests/ssrfGuard.test.ts (5 tests)
PASS tests/assertions.test.ts (7 tests)

Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total (100% Success)
```

---

## 🔒 13. Security Considerations & SSRF Protection

Because QualityTrack acts as an HTTP testing client that dispatches requests on behalf of users, robust **Server-Side Request Forgery (SSRF)** protections are built into `backend/src/utils/ssrfGuard.ts`:

1. **Protocol Enforcement**: Only `http:` and `https:` protocols are permitted (`file://`, `ftp://`, `gopher://` are strictly rejected).
2. **Cloud Metadata Shield**: Unconditional blocking of AWS/GCP/Azure link-local metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
3. **Loopback Guarding**: Loopback and private subnets (`127.0.0.1`, `localhost`) are only permitted on designated, whitelisted testing ports (e.g. `5001` for the Demo API).
4. **Buffer & Timeout Constraints**: Requests enforce strict 10s timeouts and a 5 MB maximum payload ceiling to eliminate memory-exhaustion denial of service attacks.
5. **Credential Masking**: Sensitive variables marked `isSecret` are obscured in the UI.

---

## 🧪 14. Simulated Demo API Testbed

To ensure test cases validate actual server responses, an independent simulated REST API is included in `demo-api/` (Port 5001).

### Supported Endpoints:
- `GET /api/health` – Target health probe
- `GET /api/users` – Paginated user catalog with search filter
- `GET /api/users/:id` – User lookup (handles 400 invalid ID, 404 not found)
- `POST /api/users` – Registration:
  - 201 Created on valid input
  - 400 Bad Request if email format is invalid (`EMAIL_REGEX`)
  - 400 Bad Request if name is missing, &lt; 2 chars, or &gt; 100 chars (boundary)
  - 400 Bad Request if password &lt; 8 chars (boundary)
  - 400 Bad Request if body payload is empty `{}` (edge case)
  - 409 Conflict if email is already registered (duplicate detection)
- `PUT /api/users/:id` – Full update
- `PATCH /api/users/:id` – Partial update
- `DELETE /api/users/:id` – User deletion
- `POST /api/users/reset` – Restores demo database back to clean initial state

---

## 💼 15. Technical Demonstration Walkthrough

When presenting or demonstrating QualityTrack:

1. **Dashboard (30 seconds)**:
   - Point out real calculated metrics: Total Executions, Pass Rate %, and assertion trends.
   - Show that zero metrics are hardcoded.

2. **API Request Builder (1 minute)**:
   - Navigate to **API Testing**.
   - Show the pre-filled URL: `{{baseUrl}}/api/users`.
   - Click **Send**: Show the live 200 OK response with latency in milliseconds, payload size, and formatted JSON.
   - Change method to `POST`, modify the body with an invalid email (`invalid-email-format`), click **Send**, and show the real 400 Validation Error returned by the target API.

3. **Test Case Repository & Assertions (1.5 minutes)**:
   - Navigate to **Test Cases**.
   - Show the 10 pre-configured test cases categorized into Positive, Negative, and Boundary testing.
   - Click **Run** on **TC001 (Valid User Registration)**: Watch the real-time execution result return **PASSED**.
   - Filter by **Boundary Testing**: Show TC008 (&gt;100 char name) and TC005 (Empty Body `{}`).

4. **Test Suites & Batch Execution (1 minute)**:
   - Navigate to **Test Suites**.
   - Click **Run Test Suite** on the **Negative & Error Handling Suite**.
   - Watch the platform execute all negative tests sequentially and navigate to the live **Test Run Inspector**.

5. **Defect Tracking & 1-Click Bug Creation (1 minute)**:
   - On a failed test result in the Test Run Inspector, click **Log Bug**.
   - Show how the platform automatically pre-fills the bug title, steps to reproduce, expected result, and actual error payload.
   - Click **Log Bug Report** and navigate to **Bug Reports** to demonstrate the defect triage lifecycle (`Open` -> `In Progress` -> `Resolved`).

6. **Reports & CSV Export (30 seconds)**:
   - Navigate to **Reports**.
   - Show the category pass rate breakdown and frequently failing endpoints.
   - Click **Export Report (CSV)** to show the generated audit spreadsheet.

---

## 📸 16. Screenshots

*(Screenshots will be captured and added to `docs/screenshots/`)*

| Screen | Preview Placeholder |
|---|---|
| **Dashboard & QA Telemetry** | ![Dashboard Placeholder](https://via.placeholder.com/800x450/0f172a/0d9488?text=QualityTrack+Dashboard) |
| **API Request Builder** | ![Request Builder Placeholder](https://via.placeholder.com/800x450/0f172a/0d9488?text=Postman-Style+Request+Builder) |
| **Test Case Repository** | ![Test Cases Placeholder](https://via.placeholder.com/800x450/0f172a/0d9488?text=Test+Case+Management) |
| **Test Run Inspector** | ![Run Detail Placeholder](https://via.placeholder.com/800x450/0f172a/0d9488?text=Test+Run+Inspector+%26+Assertions) |
| **Defect Tracking Board** | ![Bug Reports Placeholder](https://via.placeholder.com/800x450/0f172a/0d9488?text=Bug+Tracking+System) |
| **Executive Reports & CSV** | ![Reports Placeholder](https://via.placeholder.com/800x450/0f172a/0d9488?text=QA+Analytics+%26+Reports) |

---

## 📜 17. License

Open source under the [MIT License](LICENSE).

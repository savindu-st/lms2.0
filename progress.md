# Project Progress & Roadmap Tracker 📈

> **Notice for Agents:** This file tracks ongoing project milestones, completed features, and architectural state. **Agents must automatically update this file** whenever a milestone, major task, feature, or architectural change is completed or initiated.

---

## 📊 Overall System Health Matrix

| Component | Architecture / Technology | Port / URL | Status | Last Verified |
| :--- | :--- | :--- | :--- | :--- |
| **Edge Gateway** | .NET 8 / YARP 2.1 Reverse Proxy | `:5000` | 🟢 Active | 2026-09-22 |
| **Backend API** | ASP.NET Core 8 Clean Architecture | `:5001` (Internal) | 🟢 Active | 2026-09-22 |
| **Frontend SPA** | Angular 22 / Reactive Signals / NGINX | `:4200` | 🟢 Active | 2026-09-22 |
| **Database** | Supabase PostgreSQL (Cloud Session Pooler) | Pooler `:5432` | 🟢 Clean Slate | 2026-09-22 |
| **Docker Stack** | Docker Compose (3 Services + Persistent Vol) | Multi-container | 🟢 Verified | 2026-09-22 |

---

## ✅ Completed Milestones

### 1. Backend Core & Clean Architecture (.NET 8)
- [x] Layered separation: `Lms.Core` (zero dependencies), `Lms.Infrastructure` (EF Core + Npgsql), `Lms.Api` (Controllers).
- [x] Domain entities: `User`, `Course`, `CourseModule`, `Lesson`, `Enrollment`, `Payment`, `Invoice`, `QuizQuestion`, `QuizAttempt`, `Assignment`, `AssignmentSubmission`.
- [x] Business services implemented: `AuthService`, `CourseService`, `EnrollmentService`, `PaymentService`, `AssessmentService`, `FileStorageService`, `TokenService`.
- [x] Automated test suite in `Lms.Tests` (7 unit tests covering assessments, enrollments, and payments with InMemory database).

### 2. YARP API Gateway & Perimeter Security
- [x] Dedicated edge reverse proxy project created (`Lms.Gateway`) listening on port `5000`.
- [x] Internal API shifted to port `5001` with `UseForwardedHeaders` support.
- [x] Edge JWT Bearer validation at the gateway perimeter before requests hit internal API.
- [x] Tiered IP rate limiting:
  - Strict policy on `/api/auth/**` (10 req/min per IP) to prevent brute-force attacks.
  - Relaxed policy on general API endpoints (120 req/min per IP).
- [x] Centralized CORS handling for `http://localhost:4200` at the gateway.
- [x] Resiliency: 100MB body size for file uploads, 60s timeout, and clean JSON `502/503` failover responses.

### 3. Cloud Database Integration (Supabase)
- [x] Successfully connected backend to cloud Supabase PostgreSQL instance via session pooler (`aws-0-ap-south-1.pooler.supabase.com:5432`).
- [x] Updated `DbInitializer.cs` to dynamically create missing tables using `IRelationalDatabaseCreator.CreateTablesAsync()` in pre-existing databases.
- [x] Connected to Supabase with SSL require and verified query execution.

### 4. Full-Stack Dockerization
- [x] Created `backend/Dockerfile.api` (multi-stage .NET 8 Alpine build).
- [x] Created `backend/Dockerfile.gateway` (multi-stage .NET 8 Alpine build).
- [x] Created `frontend/Dockerfile` (multi-stage build: Node.js 22 compile ➔ NGINX Alpine runtime).
- [x] Created `frontend/nginx.conf` with SPA routing fallback (`try_files $uri $uri/ /index.html`) and gzip compression.
- [x] Orchestrated full stack in `docker-compose.yml` with bridge network `lms-network`.
- [x] Created persistent Docker volume `lms_uploads` mapped to `/app/wwwroot/uploads`.
- [x] Created `.env.example` and `.env` for secure credential loading.

### 5. Documentation & Repository Security
- [x] Added comprehensive project root `README.md` with system architecture diagrams, getting started steps, and credentials.
- [x] Hardened `.gitignore` to prevent leaking `.env`, Supabase passwords, binaries (`bin/`, `obj/`), or user uploads.
- [x] Created `.agents/rules/git-workflow.md` and `AGENTS.md` enforcing strict non-autonomous commit policy.

### 6. Mock Data Purge & Production Hardening
- [x] Completely removed synthetic courses, demo students, and fake payments from `DbInitializer.cs`.
- [x] Created `wipe_and_reset_database.sql` and `wipe_database.sh` to purge all pre-existing demo records in Supabase PostgreSQL via `TRUNCATE TABLE ... CASCADE`.
- [x] Replaced hardcoded teacher initialization with `.env` provisioning (`TEACHER_EMAIL`, `TEACHER_PASSWORD`, `TEACHER_FULL_NAME`) with startup password synchronization.
- [x] Enforced strict role security: `/register` only registers Students, and forbids using the reserved teacher email.
- [x] Created `/api/system/branding` endpoint delivering dynamic `academyName`, `instructorName`, and instructor `bankDetails`.
- [x] Removed 1-click demo login buttons on `/login`, demo switch pills from Navbar, and `quickLoginAs()` from `AuthService`.
- [x] **Completely purged simulated instant credit card checkout**:
  - Removed fake credit card checkout tab and dummy card inputs from `checkout-modal.ts`.
  - Removed `POST /api/student/checkout/instant` endpoint from `StudentPortalController.cs`.
  - Removed `ProcessInstantCheckoutAsync` from `IPaymentService` and `PaymentService.cs`.
  - Removed `InstantCheckoutDto` and associated mock test from `PaymentServiceTests.cs`.
  - Converted enrollment checkout exclusively to the genuine Bank Wire & Slip Upload workflow with instructor verification.
- [x] Purged all remaining legacy demo branding ("Vance Academy", "Prof. Vance", "Alex Reynolds") across `index.html`, `player.ts`, `invoices.ts`, `login.ts`, `my-courses.ts`, `navbar.ts`, and `styles.css`.
- [x] Standardized hero headline and catalog copy to professional "Master Accounting & Finance with Expert-Led Courses".
- [x] Verified full stack compiles cleanly (`dotnet build`, `dotnet test`, `npm run build`).

---

## 🚧 Current In-Progress / Next Focus

- [ ] **External Cloud File Storage (S3 / Supabase Storage / Cloudflare R2):**
  - Migrate from local disk storage (`wwwroot/uploads`) to cloud bucket storage for payment slips and course materials.
- [ ] **Email Notifications & Alerts:**
  - Send email confirmation when student enrolls or when teacher verifies/rejects bank transfer slips.
- [ ] **CI/CD GitHub Actions Workflow:**
  - Automated build and test pipeline on pull requests.

---

## 📋 Feature Backlog & Roadmap

### High Priority
- [ ] Stripe / Payment gateway live integration (alongside existing bank slip verification).
- [ ] Live student assignment grading dashboard enhancements.
- [ ] Real-time lesson progress sync with WebSockets / SignalR.

### Medium Priority
- [ ] Exportable Gradebook reports in CSV/Excel format.
- [ ] Video lesson resume playback (remember last timestamp watched).
- [ ] Multi-currency support for international course enrollments.

### Low Priority / Enhancements
- [ ] Dark/Light mode toggle in Angular UI.
- [ ] Certificate generation on course completion (PDF downloadable).

---

## 📝 Activity & Agent Update Log

| Date | Contributor / Agent | Action & Summary | Status |
| :--- | :--- | :--- | :--- |
| **2026-09-22** | Agent | Completely purged simulated instant card checkout from frontend & backend, eliminated all legacy demo texts ('Vance', 'Alex Reynolds'), streamlined checkout to exclusive bank wire verification. | Completed |
| **2026-09-21** | Agent | Completed mock data removal, wiped demo records from Supabase, hardened teacher auth & branding. | Completed |
| **2026-09-21** | Agent | Added progress.md to .gitignore and untracked from Git cache for quiet local updates. | Completed |
| **2026-09-21** | Agent | Fixed Mermaid diagram syntax error in README.md (quoted labels containing `/` and `()`). | Completed |
| **2026-09-21** | Agent | Initialized `progress.md` tracker and documented full system architecture state. | Completed |
| **2026-09-21** | Agent | Added agent rules (`.agents/rules/git-workflow.md` & `AGENTS.md`) prohibiting autonomous commits. | Completed |
| **2026-09-21** | Agent | Added root `README.md` and committed initial full-stack implementation to GitHub. | Completed |
| **2026-09-21** | Agent | Dockerized entire stack (`docker-compose.yml`, Dockerfiles, NGINX SPA setup, persistent volumes). | Completed |
| **2026-09-21** | Agent | Connected backend to live Supabase PostgreSQL instance with automatic DDL creation & seeding. | Completed |
| **2026-09-21** | Agent | Built and verified YARP API Gateway (`Lms.Gateway`) with edge JWT auth, rate limiting, and CORS. | Completed |

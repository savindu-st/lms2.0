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

### 7. Frontend Clean SaaS Aesthetics Redesign
- [x] Implemented modern, minimalist SaaS design language conforming to the `saas-ui-ux-designer` design system:
  - **Design Foundation (`styles.css`):** Slate/Zinc neutral color distribution (`#fafafa` canvas, `#ffffff` surfaces, `#e4e4e7` subtle borders, `#18181b` dark primary, `#059669` emerald accents), `Plus Jakarta Sans` typography, `JetBrains Mono` for financial metrics, 8pt spacing rhythm, `focus-visible:ring-2` accessible focus rings, and high-density SaaS tables.
  - **Global Sticky Navbar (`navbar.ts`):** 64px height with `backdrop-blur-md`, minimalist academy brand pill, clean navigation links, and student/teacher user avatar badge with role indicator.
  - **Course Catalog & Hero (`catalog.ts`):** Distraction-free SaaS hero section, cohort segmented control pills, instant search input, clean course card grid with tabular pricing, syllabus drawer, and bank wire enrollment trigger.
  - **Auth Surfaces (`login.ts` & `register.ts`):** Centered SaaS auth cards, crisp form controls with active focus rings, clear error callouts, and clean submission states.
  - **Student Dashboard (`my-courses.ts`):** Minimalist classroom with pending bank verification status banner, clean course cards, progress bars, and validity countdown badges.
  - **Distraction-Free Video Player (`player.ts`):** Clean 16:9 player stage, collapsible curriculum navigation sidebar with progress checks, and assessment tab panels.
  - **Student Invoices (`invoices.ts`):** High-density financial ledger with monospace transaction IDs, tabular currency amounts, status badges, and tax invoice printable dialog.
  - **Teacher Management Studio (`teacher-courses.ts`):** 4 executive metric stat cards (Active Courses, Total Students, Course Modules, Total Content Items), high-density course table with cohort badges, and curriculum editor modal.
  - **Bank Slip Verification Desk (`bank-verification.ts`):** Review queue with receipt preview dialog, 1-click verification, and clean rejection reason modal.
  - **Student Roster & Gradebook (`student-roster.ts` & `gradebook.ts`):** Tabular student records, access extension modal with quick-add pills (+7d, +14d, +30d, +60d), and submission evaluation desk.
  - **Checkout Modal (`checkout-modal.ts`):** Minimalist bank wire modal with clear copy coordinates, deposit slip dropzone, and reference input.
### 8. Enterprise BFF Pattern & Perimeter Anti-CSRF Hardening
- [x] **Backend Refresh Token Infrastructure (.NET 8):**
  - Created `RefreshToken` entity in `Lms.Core` and registered in `AppDbContext` with dynamic DDL auto-provisioning in `DbInitializer.cs`.
  - Configured 15-minute Access JWT + 7-day sliding Refresh Token generation in `TokenService.cs`.
  - Implemented token rotation on every refresh in `AuthService.cs` with a **30-second rotation grace period** against parallel request collisions.
  - Implemented compromise detection (replayed tokens outside grace period invalidate all active sessions for the user).
  - Added unit test suite in `AuthServiceTests.cs` (11 backend tests passing 100%).
  - Added `POST /api/auth/refresh` and `POST /api/auth/revoke` to `AuthController.cs`.
- [x] **YARP Gateway BFF Layer (`Lms.Gateway`):**
  - Configured ASP.NET Core Data Protection with encryption keys persisted to `/app/keys` (mounted to named volume `lms_keys` in Docker).
  - Implemented `TokenEncryptionService.cs` to securely encrypt `{ AccessToken, RefreshToken }` into `lms_session` cookie (`HttpOnly; SameSite=Lax; Path=/`).
  - Implemented `TokenRefreshCoordinator.cs` with in-memory `SemaphoreSlim` deduplication per session.
  - Implemented `BffTokenInjectionMiddleware.cs` for proactive background refresh (< 2 min remaining) and transparent `Authorization: Bearer` injection into reverse-proxied downstream requests.
  - Implemented `CsrfMiddleware.cs` with Double-Submit Cookie pattern (`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header), auto-seeding cookies on safe `GET` requests.
  - Exposed dedicated Minimal API endpoints (`/api/auth/login`, `/register`, `/logout`) returning clean `{ user }` payloads with stripped tokens.
- [x] **Frontend SPA Security & Session Bootstrapping (Angular 22):**
  - Configured `withXsrfConfiguration` in `provideHttpClient` to automatically read `XSRF-TOKEN` cookie and attach `X-XSRF-TOKEN` header on mutating requests.
  - Implemented `provideAppInitializer(() => inject(AuthService).initSession())` to verify `GET /api/auth/me` on startup before route guards evaluate (zero UI flicker or stale `localStorage` states).
  - Configured `auth.interceptor.ts` with `withCredentials: true` for cross-origin cookie attachment and automatic 401 redirect handling.
  - Fully eliminated all `lms_token` references and client-side token storage.
  - Verified with Angular Vitest unit tests (100% pass) and Docker multi-container redeployment.

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
| **2026-09-22** | Agent | Completed Milestone 8: Enterprise BFF Pattern with HttpOnly encrypted session cookies, 15m/7d refresh token rotation with 30s grace period, YARP gateway token injection & deduplication, Double-Submit Anti-CSRF protection, and Angular APP_INITIALIZER session bootstrapping. | Completed |
| **2026-09-22** | Agent | Removed top-of-page topic badges with bullet points throughout the frontend (`login.ts`, `register.ts`, `my-courses.ts`, `invoices.ts`, `bank-verification.ts`, `gradebook.ts`, `student-roster.ts`), verified clean build and unit tests, and updated Docker frontend image. | Completed |
| **2026-09-22** | Agent | Removed homepage header pill badge ('Official Online Academy • Academy Instructor'), disabled build-time font inlining in `angular.json` for resilient offline compilation, rebuilt and deployed Docker frontend. | Completed |
| **2026-09-22** | Agent | Completed Milestone 7: Frontend Clean SaaS Aesthetics Redesign across 12 core components, styles.css design system, unit tests, and Docker container deployment. | Completed |
| **2026-09-22** | Agent | Added `saas-ui-ux-designer` agent skill (global and workspace) for senior UI/UX design, React/Next.js/Tailwind/shadcn standards, 60-30-10 palette, and micro-interactions. | Completed |
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

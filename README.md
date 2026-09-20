# Accounting LMS 2.0 🎓📊

A modern, high-performance **Accounting Learning Management System** built with **Angular 22**, **.NET 8 Web API**, **YARP (Yet Another Reverse Proxy)**, and **Supabase PostgreSQL**.

---

## 🏗️ System Architecture

The backend implements **Clean Architecture (Ports and Adapters)** fronted by a dedicated **YARP Edge API Gateway**.

```mermaid
graph TD
    Client[Browser / Angular Frontend :4200] -->|HTTP / CORS| Gateway[Lms.Gateway :5000]

    subgraph GatewayEdge ["Lms.Gateway (:5000 - YARP)"]
        CORS[Centralized CORS]
        RL[Tiered Rate Limiter: Auth vs API]
        JWT[Edge JWT Token Validation]
        Limits[100MB Upload Limits & 60s Timeout]
        YarpProxy[YARP Reverse Proxy Engine]
    end

    Gateway --> CORS
    CORS --> RL
    RL --> JWT
    JWT --> Limits
    Limits --> YarpProxy

    subgraph InternalServices ["Internal Docker Network"]
        YarpProxy -->|Forward /api/** & /swagger/**| ApiService[Lms.Api :5001]
        YarpProxy -->|Forward /uploads/**| StaticFiles[Lms.Api :5001 (/uploads)]
        Volume[("Named Volume: lms_uploads")]
        ApiService --> Volume
    end

    ApiService -->|SSL / Session Pooler| Supabase[("Supabase PostgreSQL (Cloud)")]
```

---

## ✨ Key Features

### 👨‍🎓 Student Portal
- **Course Catalog & Filtering:** Search and browse accounting courses by month, difficulty, and curriculum.
- **Interactive Player:** Video lessons, downloadable PDF course materials, and progress tracking.
- **Quizzes & Self-Assessment:** Timed multiple-choice quizzes with instant grading, score percentages, and answer reviews.
- **Assignment Submissions:** Upload homework, spreadsheets, and case studies with notes.
- **Dual Payment Options:**
  - **Instant Checkout:** Card-based simulation with instant enrollment activation.
  - **Bank Transfer Verification:** Upload bank transfer slips for teacher verification.
- **Invoice & Financial History:** Automated PDF/printable accounting invoices with tax breakdown and transaction references.

### 👩‍🏫 Teacher & Administration
- **Curriculum Builder:** Create courses, organize modules, and attach video links and resources.
- **Payment Verification:** Review uploaded bank transfer slips, approve/reject payments, and activate enrollments.
- **Gradebook & Assignment Submissions:** Review submitted student files, assign scores, and provide written feedback.
- **Student Roster:** Track active vs. expired enrollments and manual access extensions.
- **Analytics Dashboard:** Revenue trends, active student counts, course completion rates, and pending queues.

### 🛡️ Edge Security & Gateway Policies
- **Edge JWT Bearer Validation:** Cryptographically checks tokens at the gateway perimeter before requests hit internal services.
- **Tiered Rate Limiting:**
  - `auth-policy`: 10 req/min per IP on `/api/auth/**` to mitigate brute-force and credential stuffing.
  - `general-policy`: 120 req/min per IP on standard API operations.
- **Centralized CORS:** Preflight `OPTIONS` requests from `http://localhost:4200` are handled exclusively at the gateway.
- **Resiliency & Upload Handling:** 100MB max request body limit for slips and course materials, 60s timeout, and clean JSON `502/503` failover responses.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 22, TypeScript, Standalone Components, Reactive Signals, CSS3 Design System |
| **Edge Gateway** | .NET 8, YARP (Yet Another Reverse Proxy) 2.1 |
| **Backend API** | ASP.NET Core 8 Web API, C# 12 |
| **Data Access & ORM** | Entity Framework Core 8, Npgsql (PostgreSQL Provider) |
| **Database** | Supabase PostgreSQL (Cloud Session Pooler) |
| **Authentication** | Stateless JWT (JSON Web Tokens) with BCrypt password hashing |
| **Containerization** | Docker, Docker Compose, Multi-stage Alpine & NGINX images |
| **Testing** | xUnit, Microsoft.EntityFrameworkCore.InMemory |

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/)
*OR*
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) and [Node.js 22+](https://nodejs.org/)

---

### Option A: Run via Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/savindu-st/lms2.0.git
   cd lms2.0
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(Update `DATABASE_CONNECTION_STRING` with your Supabase database password).*

3. **Start the Stack:**
   ```bash
   docker compose up -d
   ```

4. **Access Applications:**
   - **Frontend App:** [http://localhost:4200](http://localhost:4200)
   - **YARP API Gateway:** [http://localhost:5000](http://localhost:5000)
   - **Swagger UI:** [http://localhost:5000/swagger](http://localhost:5000/swagger)

---

### Option B: Run Locally (Native CLI)

1. **Backend & Gateway:**
   ```bash
   cd backend
   ./run-all.sh
   ```
   *This starts `Lms.Api` on port `5001` and `Lms.Gateway` on port `5000` concurrently.*

2. **Frontend:**
   In a separate terminal:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   *Navigate to [http://localhost:4200](http://localhost:4200).*

---

## 🔑 Demo Seed Accounts

The database auto-seeds sample accounting courses and starter accounts upon first connection:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Teacher / Admin** | `teacher@accountingacademy.com` | `Teacher@123` |
| **Student** | `student@accountingacademy.com` | `Student@123` |

---

## 📂 Project Structure

```
lms 2.0/
├── docker-compose.yml              # Multi-container full-stack configuration
├── .env.example                    # Sample environment variables
├── .gitignore                      # Security-audited git exclusions
├── README.md                       # Project documentation
│
├── backend/                        # .NET 8 Backend Solution
│   ├── Lms.sln
│   ├── run-all.sh                  # Development runner script
│   ├── Dockerfile.api              # Multi-stage Dockerfile for Lms.Api
│   ├── Dockerfile.gateway          # Multi-stage Dockerfile for Lms.Gateway
│   │
│   ├── Lms.Core/                   # Domain entities, DTOs, interfaces (No dependencies)
│   ├── Lms.Infrastructure/         # EF Core, AppDbContext, DbInitializer, Services
│   ├── Lms.Api/                    # ASP.NET Core Web API Controllers & Endpoints (:5001)
│   ├── Lms.Gateway/                # YARP Edge Reverse Proxy (:5000)
│   └── Lms.Tests/                  # xUnit test suite
│
└── frontend/                       # Angular 22 Single Page Application
    ├── Dockerfile                  # Multi-stage build (Node -> Nginx production)
    ├── nginx.conf                  # SPA routing & compression configuration
    ├── src/
    │   ├── app/
    │   │   ├── core/               # Interceptors, guards, models, services
    │   │   ├── features/           # Auth, catalog, student portal, teacher management
    │   │   └── shared/             # Reusable UI components & modals
    │   └── styles.css              # Custom CSS design system tokens
    └── angular.json
```

---

## 🧪 Testing

To run backend unit and integration tests:

```bash
cd backend
dotnet test Lms.Tests/Lms.Tests.csproj
```

---

## 📄 License

This project is licensed under the MIT License.

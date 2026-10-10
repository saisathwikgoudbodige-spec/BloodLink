# BLOODLINK — Emergency Blood Requirement Matching Network

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-blue.svg)](https://neon.tech/)
[![React Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)
[![WebSocket](https://img.shields.io/badge/Real--Time-Spring%20WebSocket%20%2B%20STOMP-red.svg)](https://docs.spring.io/spring-framework/reference/web/websocket.html)

**Formal Project Title:** Emergency Blood Requirement Matching Network  
**Degree / Specialization:** B.Tech Individual Java Full Stack Capstone Project  
**Architecture:** Clean Modular Monolith with Single-Login Dual-Dashboard Workflow & Real-Time STOMP Notifications

---

## ⚠️ Critical Medical Limitation Notice

> **IMPORTANT MEDICAL NOTICE:** BloodLink is **strictly an emergency volunteer communication and coordination platform**. The system does NOT guarantee blood availability, medical donor eligibility, biological safety, or compatibility. The platform does NOT diagnose, treat, or authorize blood transfusions.
> 
> All blood transfusions require mandatory biological typing, serological cross-matching, and clinical authorization conducted by authorized healthcare professionals at certified medical institutions.

---

## 1. Project Purpose & Highlights

In critical medical emergencies, surgeries, and trauma situations, connecting patients with compatible donors quickly is vital. Traditional broadcast messages on social media cause delays, lack geographic proximity awareness, and lead to chaotic coordination.

**BloodLink** solves this coordination challenge through a responsive web platform featuring:
* **Single Login with Dual Dashboards:** Every ordinary registered user has one account and one login session, granting instant access to both the **Requester Dashboard** and **Donor Dashboard**.
* **Admin Review & Approval Workflow:** New registrations are set to `PENDING_APPROVAL` and require administrator approval before accessing protected features.
* **Progressive Donor Participation:** Any approved member can create and manage their donor profile (blood group, location, availability) directly within their account without creating a second account.
* **Intelligent ABO/Rh Compatibility Engine:** Implements standard biological blood compatibility rules combined with Haversine spherical distance calculations (default 50 km radius).
* **Secure Real-Time WebSocket Alerts:** Targeted, recipient-specific STOMP notifications deliver potential blood-match alerts to donors and live response updates to requesters without public broadcast leakage.
* **Comprehensive Administrative Controls:** Full oversight over registrations, pending approvals, all blood requests, duplicate detection, and audit logs.

---

## 2. Technology Stack

- **Backend:** Java 21, Spring Boot 4.1.1, Spring MVC, Spring Data JPA / Hibernate, Spring Security, JWT (JJWT 0.12.6), Jakarta Bean Validation, Spring WebSocket & STOMP, Maven Wrapper.
- **Database:** Neon PostgreSQL (Cloud Serverless PostgreSQL), safe `update` JPA DDL strategy. Local development supports in-memory H2.
- **Frontend:** React, Vite, JavaScript, Axios (Bearer Token Interceptors), React Router, Lucide Icons, STOMP.js + SockJS, Vanilla CSS Healthcare Design System.
- **Testing:** JUnit 5, Mockito, Spring Boot Test (39 automated unit & integration tests).
- **Deployment:** Render (Backend Docker container) and Vercel (Frontend Single Page Application).

---

## 3. Architecture & Core Workflows

### A. One User Login, Two Portals
Ordinary users do not have separate "donor" or "requester" logins:
1. A user registers once (`name`, `email`, `password`, optional phone).
2. The account is set to `PENDING_APPROVAL`, notifying administrators.
3. Once approved by an administrator, the user logs in once and receives a single JWT token.
4. The navigation bar features a **Portal Switcher** pill:
   `[ 🩸 Requester Portal | ❤️ Donor Portal ]`
5. The user can switch seamlessly between creating blood requests and managing their volunteer donor profile without re-authenticating or refreshing tokens.

```
+---------------------------------------------------------------+
|                    Single Registered User                     |
|                   (Role: USER / MEMBER)                       |
+-------------------------------+-------------------------------+
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
    +----------------------+          +----------------------+
    |  Requester Portal    |          |     Donor Portal     |
    | - Create Requests    |          | - Donor Profile      |
    | - Track Status       |          | - Availability Toggle|
    | - Live Updates       |          | - Match Alerts       |
    +----------------------+          +----------------------+
```

### B. Admin Approval Workflow
1. **Registration:** Account saved with `approvalStatus = PENDING_APPROVAL`. Public self-assignment of `ROLE_ADMIN` is prohibited.
2. **Access Guard:** Login attempts by pending or rejected accounts are blocked on the server with clear status messages.
3. **Admin Review:** Administrators review applicants via the **Users & Approvals Directory** (`/admin/users`) or the **Admin Dashboard** cards, approving or rejecting with an optional reason.
4. **Audit Trail:** Approver ID, decision timestamp, and audit log entries are persisted automatically.

### C. Secure WebSocket Notification Flow
- **STOMP Authentication:** STOMP client sends `Authorization: Bearer <token>` on connect; the channel interceptor validates the token.
- **Recipient Channel Isolation:** Private notifications are pushed to `/topic/user.{userId}.notifications`. Subscriptions enforce that the user ID matches the authenticated principal.
- **Admin Channel Protection:** Administrative alerts (new registrations, new requests) stream to `/topic/admin.notifications`, strictly restricted to users with `ROLE_ADMIN`.

---

## 4. Directory Structure

```
BLOODLINK/
├── bloodlink-backend/         # Spring Boot Java 21 Application
│   ├── src/main/java/com/bloodlink/bloodlinkbackend/
│   │   ├── config/            # SecurityConfig, WebSocketConfig, DataInitializer
│   │   ├── controller/        # Auth, BloodRequest, Donor, Match, Admin, Dashboard
│   │   ├── service/           # Matching, Compatibility, Transition, Admin, AuthService
│   │   ├── entity/            # User, DonorProfile, BloodRequest, Match, AdminAuditLog
│   │   ├── repository/        # Spring Data JPA Repositories
│   │   ├── dto/               # Unified API request & response DTOs
│   │   ├── enums/             # Role, ApprovalStatus, BloodGroup, Urgency, MatchStatus
│   │   ├── mapper/            # Entity-to-DTO conversion mappers
│   │   └── security/          # JwtService, CustomUserDetailsService, JwtAuthFilter
│   ├── src/main/resources/
│   │   ├── application.properties        # Production Neon PostgreSQL config
│   │   └── application-local.properties  # Local offline H2 development profile
│   └── src/test/java/         # Automated Test Suites (39 passing tests)
│
├── frontend/                  # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/        # Navbar (Portal Switcher), Badges, Footer, Layout
│   │   ├── pages/
│   │   │   ├── requester/     # RequesterDashboard, CreateBloodRequestPage, Requests
│   │   │   ├── donor/         # DonorDashboard, DonorProfilePage, DonorMatchesPage
│   │   │   ├── admin/         # AdminDashboard, AdminUsersPage, AdminRequestsPage
│   │   │   └── LoginPage.jsx, RegisterPage.jsx, LandingPage.jsx, AboutPage.jsx
│   │   ├── context/           # AuthContext, WebSocketContext
│   │   ├── services/          # api.js, authService, requestService, adminService
│   │   └── styles/            # CSS Design System Tokens
│   ├── package.json
│   └── vite.config.js
│
├── docs/                      # Architectural & API Specifications
│   ├── architecture.md
│   ├── api.md
│   └── demo.md
│
├── .env.example               # Sanitized environment template
├── .gitignore                 # Configured with *.class and build ignores
└── README.md
```

---

## 5. Setup & Running the Application

### A. Environment Configuration
Copy `.env.example` to `.env` in the root and configure your credentials:
```bash
# Neon PostgreSQL Database Credentials
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<neon-database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-username>
SPRING_DATASOURCE_PASSWORD=<neon-password>

# JWT Security
JWT_SECRET=<generate-a-random-64-character-hex-string>
JWT_EXPIRATION=86400000

# Client Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Demo Data Seeding (false for production)
SEED_DEMO_DATA=false
```

### B. Running Backend Tests & Server

```powershell
cd bloodlink-backend

# 1. Run all 39 unit and integration tests (isolated in-memory H2 test DB)
.\mvnw.cmd test

# 2. Run backend in local development mode (offline H2 profile)
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local

# 3. Or run with production/Neon configuration
.\mvnw.cmd spring-boot:run
```

Backend will be available on `http://localhost:8080`.

### C. Running Frontend Development Server

```powershell
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will be available on `http://localhost:5173`.

---

## 6. Pre-Seeded Demo Accounts (Local Dev Mode)

When running locally with `SEED_DEMO_DATA=true` (or via `application-local.properties`), the following demo accounts are available with 1-click login buttons on `/login`:

| Role | Email | Password | Access & Capabilities |
|---|---|---|---|
| **System Admin** | `admin@bloodlink.local` | `Admin123!` | System Administration, User Approvals, All Requests, Audit Logs |
| **Member (Requester Focus)** | `requester@bloodlink.local` | `Requester123!` | Unified Member: Can create emergency requests and switch to donor portal |
| **Member (Donor Focus)** | `donor@bloodlink.local` | `Donor123!` | Unified Member: Configured donor (**O+**, Hyderabad, **AVAILABLE**), can also switch to requester portal |

---

## 7. Primary Live Demo Scenario

1. **Browser 1 (Emergency Request):**
   - Sign in as `requester@bloodlink.local`.
   - In the **Requester Portal**, click **Create Blood Request**.
   - Click **⚡ Load Demo Scenario** (`O+`, 2 Units, Demo Emergency Hospital, Hyderabad, `CRITICAL`, 2 hours) and submit.
2. **Backend Processing:**
   - Persists request, notifies administrators via `/topic/admin.notifications`, evaluates compatibility, and identifies eligible donors within radius.
3. **Browser 2 (Donor Alert):**
   - Sign in as `donor@bloodlink.local`.
   - In the **Donor Portal**, an instant toast alert appears: *"Potential Match: O+ Request at Demo Emergency Hospital"*.
   - Click **Accept & Share Contact**.
4. **Browser 1 (Instant Requester Feedback):**
   - The requester dashboard updates automatically: status changes to `RESPONDED` and the donor's contact phone number is revealed.
5. **Admin Portal:**
   - Sign in as `admin@bloodlink.local` to inspect user approval queues, system-wide requests, and audit logs.

---

## 8. License & Academic Attribution

Developed as an Individual B.Tech Java Full Stack Capstone Project under university mentor guidelines.
All rights reserved &copy; BloodLink Team.

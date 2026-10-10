# BLOODLINK — Emergency Blood Requirement Matching Network

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-blue.svg)](https://neon.tech/)
[![React Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)
[![WebSocket](https://img.shields.io/badge/Real--Time-Spring%20WebSocket%20%2B%20STOMP-red.svg)](https://docs.spring.io/spring-framework/reference/web/websocket.html)

**Formal Project Title:** Emergency Blood Requirement Matching Network  
**Degree / Specialization:** B.Tech Individual Java Full Stack Capstone Project  
**Architecture:** Clean Modular Monolith

---

## ⚠️ Critical Medical Limitation Notice

> **IMPORTANT MEDICAL NOTICE:** BloodLink is **strictly an emergency volunteer communication and coordination platform**. The system does NOT guarantee blood availability, medical donor eligibility, biological safety, or compatibility. The platform does NOT diagnose, treat, or authorize blood transfusions.
> 
> All blood transfusions require mandatory biological typing, serological cross-matching, and clinical authorization conducted by authorized healthcare professionals at certified medical institutions.

---

## 1. Project Purpose & Summary

In critical medical emergencies, surgeries, and trauma situations, finding compatible blood donors quickly is vital. Traditional broadcast messages on social media are prone to delays, lack geographic proximity awareness, and cause duplicate efforts.

**BloodLink** solves this coordination challenge through a responsive web platform where:
1. An **Emergency Requester** submits patient requirement details (blood group, units, hospital, GPS coordinates, urgency, expiry).
2. The **Matching Engine** runs ABO/Rh compatibility rules and calculates approximate Haversine distance.
3. Matching available **Volunteer Donors** receive instantaneous WebSocket alerts.
4. When a donor accepts, the requester immediately sees their response and hospital contact details in real-time without page refresh.

---

## 2. Technology Stack

- **Backend:** Java 21, Spring Boot, Spring MVC, Spring Data JPA / Hibernate, Spring Security, JWT (JJWT 0.12.6), Jakarta Bean Validation, Spring WebSocket & STOMP, Maven.
- **Database:** Neon PostgreSQL (Cloud Serverless PostgreSQL), safe `update` JPA DDL strategy.
- **Frontend:** React, Vite, JavaScript, Axios (Bearer Token Interceptors), React Router, Lucide Icons, STOMP.js + SockJS, Vanilla CSS Design System.
- **Testing:** JUnit 5, Mockito, Spring Boot Test.

---

## 3. Directory Structure

```
BLOODLINK/
├── backend/                  # Spring Boot 3 Java 21 Application
│   ├── src/main/java/com/bloodlink/bloodlinkbackend/
│   │   ├── config/           # Security, WebSocket, DataInitializer
│   │   ├── controller/       # Auth, Request, Donor, Match, Admin, Dashboard
│   │   ├── service/          # Matching, Compatibility, Transition, Duplicate
│   │   ├── entity/           # User, DonorProfile, BloodRequest, Match, etc.
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   ├── dto/              # Unified API request & response models
│   │   └── security/         # JwtService, CustomUserDetailsService, Filters
│   └── src/test/java/        # Comprehensive JUnit & Mockito Test Suite
│
├── frontend/                 # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # Badges, Navbar, Footer, DisclaimerBanner
│   │   ├── pages/            # Requester, Donor, Admin, Auth, Landing pages
│   │   ├── context/          # AuthContext, WebSocketContext
│   │   ├── services/         # Axios API clients
│   │   └── styles/           # Modern Healthcare Design Tokens
│   └── package.json
│
├── database/
│   └── seed.sql              # Neon PostgreSQL DDL and Reference Inserts
│
├── docs/
│   ├── architecture.md       # Architecture diagrams, state machines, rules
│   ├── api.md                # Complete REST API & WebSocket specifications
│   └── demo.md               # Primary Demo Scenario walkthrough
│
├── .env.example              # Environment variables template
├── .gitignore
└── README.md
```

---

## 4. Setup & Running the Application

### A. Environment Configuration
Copy `.env.example` to `.env` in the root and configure your Neon PostgreSQL credentials:
```bash
# Neon PostgreSQL Database Credentials
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>:5432/<database-name>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-username>
SPRING_DATASOURCE_PASSWORD=<neon-password>

# JWT Security
JWT_SECRET=<generate-a-random-64-character-hex-string-for-production>
JWT_EXPIRATION=86400000

# Client Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production Demo Data Seeding (false for production)
SEED_DEMO_DATA=false
```

### B. Running the Backend (Spring Boot)
```bash
cd bloodlink-backend
# Run tests
.\mvnw.cmd test

# Start the Spring Boot backend server on port 8080
.\mvnw.cmd spring-boot:run
```
*Note: If `DATABASE_URL` is omitted, the backend will default to localhost or H2 test mode for local testing.*

### C. Running the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## 5. Pre-Seeded Demo Accounts

The application automatically seeds the required demo accounts with 1-click login buttons on `/login`:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@bloodlink.local` | `Admin123!` | System Administrator, Full Monitoring |
| **Requester** | `requester@bloodlink.local` | `Requester123!` | Emergency Requester |
| **Donor** | `donor@bloodlink.local` | `Donor123!` | Volunteer Donor: **O+**, Hyderabad, **AVAILABLE** |

---

## 6. Primary Live Demo Scenario

1. **Browser 1 (Requester):** Sign in as `requester@bloodlink.local`. Click **Create Blood Request**, click **⚡ Load Demo Scenario** (O+, 2 Units, Demo Emergency Hospital, Hyderabad, CRITICAL, 2 hours), and submit.
2. **Backend:** Saves to database, evaluates compatibility rules, computes distance, saves notification, and dispatches WebSocket event.
3. **Browser 2 (Donor):** Sign in as `donor@bloodlink.local`. Instant toast notification pops up without page refresh: *"Potential Match: O+ Request at Demo Emergency Hospital"*.
4. **Browser 2 (Donor):** Clicks **Accept & Share Contact**.
5. **Browser 1 (Requester):** Immediately updates in real-time: shows *"Donor Responded: ACCEPTED"*, donor contact phone is revealed, request status changes from `MATCHING` to `RESPONDED`.
6. **Admin:** Log in as `admin@bloodlink.local` to verify the request monitor, duplicate detection screening, and audit logs.

For complete step-by-step screenshots and notes, see [docs/demo.md](docs/demo.md).

---

## 7. License & Academic Attribution
Developed as an Individual B.Tech Java Full Stack Capstone Project under university mentor guidelines. All rights reserved.

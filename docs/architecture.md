# BloodLink Architecture & Engineering Specifications

**Formal Project Title:** Emergency Blood Requirement Matching Network  
**Project Type:** Individual B.Tech Java Full Stack Capstone Project  
**Core Technologies:** Java 21, Spring Boot 3, Spring Security, JWT, Spring WebSocket/STOMP, Hibernate/JPA, Neon PostgreSQL, React, Vite, Axios.

---

## 1. Architectural Overview

BloodLink is engineered as a **Clean Modular Monolith**. It avoids unnecessary microservice and message broker complexity while achieving real-time responsiveness and transactional integrity.

```
                     +---------------------------------------+
                     |         BLOODLINK APPLICATION         |
                     +---------------------------------------+
                                         |
                +------------------------+------------------------+
                |                                                 |
         [ REQUESTER ]                                      [ DONOR ]
                |                                                 |
                +------------------------+------------------------+
                                         |
                           +---------------------------+
                           |       REACT + VITE        |
                           |   Single Page Application |
                           +---------------------------+
                                         |
                           (Axios + Bearer JWT Token)
                                         |
                           +---------------------------+
                           |  SPRING BOOT REST LAYER   |
                           |        Controllers        |
                           +---------------------------+
                                         |
                           +---------------------------+
                           |      SERVICE LAYER        |
                           |  - AuthService            |
                           |  - BloodRequestService    |
                           |  - MatchingService        |
                           |  - BloodCompatibility     |
                           |  - DuplicateDetection     |
                           |  - NotificationService    |
                           +---------------------------+
                                    /         \
                                   /           \
               +----------------------+     +----------------------+
               |  HIBERNATE / JPA     |     |   SPRING WEBSOCKET   |
               |  PostgreSQL Dialect  |     |   STOMP Message      |
               |  Repository Layer    |     |   Broker (/topic)    |
               +----------------------+     +----------------------+
                          |                            |
               +----------------------+                |
               |   NEON POSTGRESQL    |                |
               |   Serverless Cloud DB|                v
               +----------------------+        [ Real-time Push to Clients ]
```

---

## 2. Blood Compatibility Matching Rules

Blood compatibility rules are strictly centralized inside `BloodCompatibilityService.java` to prevent business logic fragmentation.

### Red Blood Cell (RBC) Compatibility Matrix

| Recipient Blood Group | Compatible Donor Blood Groups | Universal Characterization |
|---|---|---|
| **O-** | O- | Can only receive O- |
| **O+** | O-, O+ | Universal red cell recipient for O types |
| **A-** | O-, A- | Rh negative restricted |
| **A+** | O-, O+, A-, A+ | Standard A group |
| **B-** | O-, B- | Rh negative restricted |
| **B+** | O-, O+, B-, B+ | Standard B group |
| **AB-** | O-, A-, B-, AB- | Universal recipient for Rh negative blood |
| **AB+** | O-, O+, A-, A+, B-, B+, AB-, AB+ | **Universal Recipient** (All groups) |

> **Universal Donor Rule:** O Negative (`O_NEGATIVE`) is eligible as a potential donor for every recipient group.

---

## 3. Geographic Proximity & Ranking Engine

The matching engine ranks candidate donors using four deterministic application criteria:
1. **Rule-Based Compatibility:** Candidate donor must belong to the compatible blood group set.
2. **Availability Status:** Donor `availability_status` must equal `AVAILABLE`.
3. **Account Status:** Donor account must be `active == true`.
4. **Geographic Proximity:** Distance calculated using the spherical **Haversine formula** (`LocationUtil.java`):

$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

Where:
- $R = 6371.0\text{ km}$ (Earth mean radius)
- $\phi_1, \phi_2$ = latitudes in radians
- $\Delta \phi, \Delta \lambda$ = differences in latitude and longitude

### Candidate Sorting Priority:
1. Exact blood group match prioritized over cross-compatible groups.
2. Closest approximate distance in kilometers (ascending order).
3. Critical urgency bypasses maximum matching radius limit (default 50 km).

---

## 4. State Machine & Status Transitions

Blood requests follow a validated state machine enforced by `RequestStatusTransitionService.java`:

```
 [ OPEN ] ──────────────────> [ MATCHING ]
    |                              |
    |                              +───> [ RESPONDED ] ───> [ FULFILLED ] ───> [ CLOSED ]
    |                              |           |
    v                              v           v
[ CANCELLED ]                 [ EXPIRED ]  [ CANCELLED ]
```

- Arbitrary or backward status transitions (e.g. `EXPIRED` to `OPEN`) are rejected with `400 Bad Request`.
- Status changes automatically append an immutable audit log entry in `request_histories`.

---

## 5. Potential Duplicate Screening

Admin triage aid implemented in `DuplicateDetectionService.java` screens recent submissions within a rolling 48-hour window for:
- Same requester and same blood group.
- Same hospital name and same blood group.
- Same city, blood group, and created within 24 hours.

Flagged records are labeled `POTENTIAL_DUPLICATE` to alert coordinators.

---

## 6. Real-Time WebSocket / STOMP Protocol

Spring WebSocket is configured with a simple broker in `WebSocketConfig.java`:
- **Endpoint:** `/ws` with SockJS fallback.
- **Broker Destinations:** `/topic`, `/queue`, `/user`.
- **Application Prefix:** `/app`.

### Real-Time Topics:
- `/topic/user.{userId}.notifications`: Dispatches user-specific events (`NEW_MATCH`, `DONOR_ACCEPTED`, `DONOR_DECLINED`, `REQUEST_FULFILLED`).
- `/topic/requests.{requestId}.matches`: Dispatches live match status updates to the requester details page without page reload.
- `/topic/requests`: Broadcasts new emergency blood requirements.
- `/topic/notifications`: Broadcasts global coordination notices.

---

## 7. Critical Medical Limitation Notice

BloodLink is **strictly an emergency volunteer communication and coordination network**. The platform:
- Does NOT guarantee blood availability or medical donor eligibility.
- Does NOT diagnose, prescribe, or authorize transfusions.
- Does NOT replace hospitals, certified blood banks, or clinical decision-making.
- All blood transfusions require mandatory biological blood typing and clinical laboratory cross-matching at an authorized healthcare facility prior to administration.

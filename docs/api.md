# BloodLink REST API & WebSocket Specifications

All API endpoints follow standard REST principles and return unified JSON envelopes.

---

## 1. Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Human readable error description",
  "errors": ["Specific validation error 1", "..."]
}
```

---

## 2. Authentication APIs (`/api/auth`)

### 1. Register User / Donor
- **Method:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Kiran Kumar",
  "email": "donor@bloodlink.local",
  "password": "Donor123!",
  "phone": "+91-9876543212",
  "role": "DONOR",
  "bloodGroup": "O_POSITIVE",
  "city": "Hyderabad",
  "latitude": 17.3850,
  "longitude": 78.4867
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "type": "Bearer",
    "user": {
      "id": 3,
      "name": "Kiran Kumar",
      "email": "donor@bloodlink.local",
      "role": "DONOR",
      "active": true
    }
  }
}
```

### 2. Login
- **Method:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "requester@bloodlink.local",
  "password": "Requester123!"
}
```

### 3. Get Current User Session
- **Method:** `GET /api/auth/me`
- **Access:** Authenticated (Bearer Token)

---

## 3. Blood Request APIs (`/api/requests`)

### 1. Create Blood Requirement
- **Method:** `POST /api/requests`
- **Access:** `REQUESTER` or `ADMIN`
- **Request Body:**
```json
{
  "bloodGroup": "O_POSITIVE",
  "unitsRequired": 2,
  "hospitalName": "Demo Emergency Hospital",
  "city": "Hyderabad",
  "latitude": 17.3850,
  "longitude": 78.4867,
  "urgency": "CRITICAL",
  "expiresInHours": 2
}
```

### 2. Get All Requests
- **Method:** `GET /api/requests?activeOnly={boolean}`
- **Access:** Authenticated

### 3. Get My Requests
- **Method:** `GET /api/requests/my`
- **Access:** `REQUESTER` or `ADMIN`

### 4. Get Request by ID
- **Method:** `GET /api/requests/{id}`
- **Access:** Authenticated

### 5. Update Request
- **Method:** `PUT /api/requests/{id}`
- **Access:** Request Owner or `ADMIN`

### 6. Update Status
- **Method:** `PATCH /api/requests/{id}/status`
- **Access:** Request Owner or `ADMIN`
- **Request Body:**
```json
{
  "status": "FULFILLED",
  "reason": "Blood arranged and verified at hospital"
}
```

### 7. Delete / Cancel Request
- **Method:** `DELETE /api/requests/{id}`
- **Access:** Request Owner or `ADMIN`

### 8. Get Matches for Request
- **Method:** `GET /api/requests/{id}/matches`
- **Access:** Request Owner or `ADMIN`

---

## 4. Match & Response APIs (`/api/matches`)

### 1. Get Donor's Assigned Matches
- **Method:** `GET /api/matches/my`
- **Access:** `DONOR`

### 2. Respond to Match (Accept / Decline)
- **Method:** `PATCH /api/matches/{id}/respond`
- **Access:** Assigned Donor only
- **Request Body:**
```json
{
  "response": "ACCEPTED"
}
```

---

## 5. Donor Management APIs (`/api/donors`)

### 1. Get Donor Profile
- **Method:** `GET /api/donors/profile`
- **Access:** `DONOR` or `ADMIN`

### 2. Update Donor Profile
- **Method:** `PUT /api/donors/profile`
- **Access:** `DONOR`

### 3. Update Availability Status
- **Method:** `PATCH /api/donors/availability`
- **Access:** `DONOR`
- **Request Body:**
```json
{
  "availabilityStatus": "AVAILABLE"
}
```

---

## 6. Notification APIs (`/api/notifications`)

- `GET /api/notifications`: Get all user notifications.
- `GET /api/notifications/unread-count`: Get unread alerts counter.
- `PATCH /api/notifications/{id}/read`: Mark specific notification as read.
- `POST /api/notifications/read-all`: Mark all notifications as read.

---

## 7. Dashboard APIs (`/api/dashboard`)

- `GET /api/dashboard/requester`: Requester summary metrics & recent submissions.
- `GET /api/dashboard/donor`: Donor summary metrics & urgent match alerts.
- `GET /api/dashboard/admin`: System-wide metrics, active requests, and duplicate counts.

---

## 8. Admin APIs (`/api/admin`)

- `GET /api/admin/users`: List all registered users.
- `PATCH /api/admin/users/{id}/status?active={boolean}`: Activate / deactivate user account.
- `GET /api/admin/requests`: System-wide requests monitor.
- `GET /api/admin/requests/{id}/duplicates`: Screen potential duplicate requests.
- `GET /api/admin/audit-logs`: Immutable audit trails.

---

## 9. Real-Time WebSocket Topics

- `/ws`: STOMP connection endpoint (SockJS enabled).
- `/topic/user.{userId}.notifications`: User-specific real-time notifications.
- `/topic/requests.{requestId}.matches`: Live match updates for a request.
- `/topic/requests`: System-wide new request events.
- `/topic/notifications`: Global announcements.

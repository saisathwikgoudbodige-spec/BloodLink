# BloodLink End-to-End Primary Demo Guide

This document details the exact execution steps for the **Primary Live Demo Scenario** verifying end-to-end functionality across Requester, Matching Engine, Neon PostgreSQL, WebSocket alerts, Donor response, and Administrative monitoring.

---

## Pre-Requisites & Demo Accounts

All demo accounts are pre-seeded automatically by `DataInitializer.java`:

| Role | Email | Password | Details |
|---|---|---|---|
| **Requester** | `requester@bloodlink.local` | `Requester123!` | Registered Emergency Requester in Hyderabad |
| **Donor** | `donor@bloodlink.local` | `Donor123!` | Registered Donor: **O+**, Hyderabad (`17.3850, 78.4867`), **AVAILABLE** |
| **Admin** | `admin@bloodlink.local` | `Admin123!` | System Administrator with full oversight access |

---

## Primary Scenario Walkthrough

### Step 1: Open Two Separate Browser Windows
- **Window 1 (Requester):** Open `http://localhost:5173/login` in your primary browser window.
- **Window 2 (Donor):** Open `http://localhost:5173/login` in an **Incognito / Private** window or secondary browser.

---

### Step 2: Sign In as Requester (Window 1)
1. On Window 1, click the quick **Requester** demo button (or enter `requester@bloodlink.local` / `Requester123!`).
2. Click **Sign In**.
3. You are redirected to `/requester/dashboard`.
4. Click **Create Blood Request** (or navigate to `/requester/create-request`).

---

### Step 3: Create the Emergency Request (Window 1)
1. Click the **⚡ Load Demo Scenario** button (or manually fill):
   - **Blood Group:** `O_POSITIVE` (O+)
   - **Units Required:** `2`
   - **Hospital Name:** `Demo Emergency Hospital`
   - **City:** `Hyderabad`
   - **Hospital Latitude:** `17.3850`
   - **Hospital Longitude:** `78.4867`
   - **Urgency:** `CRITICAL`
   - **Active Window:** `2` hours
2. Click **Find Potential Donors**.
3. The request is submitted to the backend:
   - Validated by Jakarta Bean Validation.
   - Saved in PostgreSQL.
   - Initial status recorded as `OPEN` then advanced to `MATCHING`.
   - Matching engine evaluates compatible donors (O+ recipient can accept O- and O+ donors).
   - Distance to Kiran Kumar (`donor@bloodlink.local`) is computed as `0.0 km` (identical location) or approx vicinity.
   - Match record is created (`MatchStatus.NOTIFIED`).
   - Notification is saved in database.
   - WebSocket message dispatched to `/topic/user.{donorId}.notifications`.
4. Window 1 automatically redirects to `/requester/requests/{id}`. Notice the **Potential Donor Matches** section shows `Kiran Kumar` with status **⏳ NOTIFIED**.

---

### Step 4: Donor Receives Real-Time Alert (Window 2)
1. In Window 2 (Incognito), sign in as the donor:
   - Click quick **Donor (O+)** button (or enter `donor@bloodlink.local` / `Donor123!`).
   - Click **Sign In**.
2. **Without refreshing the page:**
   - A real-time toast alert slides in on the top right: *"Potential Match: O+ Request — A patient at Demo Emergency Hospital in Hyderabad requires 2 unit(s)..."*
   - The notification bell counter automatically increments.
   - The **Urgent Potential Matches** card list displays Request #{id} for Demo Emergency Hospital with **Accept & Share Contact** and **Decline** buttons!

---

### Step 5: Donor Accepts Request (Window 2)
1. In Window 2, click **Accept & Share Contact**.
2. The match status on Window 2 updates immediately to **✓ ACCEPTED**.
3. Backend:
   - Updates match response to `ACCEPTED`.
   - Advances request status from `MATCHING` to `RESPONDED`.
   - Dispatches WebSocket update to `/topic/requests.{id}.matches` and notification to requester.

---

### Step 6: Requester Receives Instant Update (Window 1)
1. In Window 1 (Requester):
   - **Without refreshing the page:**
   - A real-time toast alert pops up: *"Donor Response: Potential Match Accepted — Potential donor Kiran Kumar has ACCEPTED your blood request..."*
   - The top banner flashes: *"1 Potential Donor(s) Have Accepted!"*
   - The match table row updates from `⏳ NOTIFIED` to `✓ ACCEPTED` in green.
   - Donor contact details (`+91-9876543212`) are revealed to coordinate with the hospital.
   - The request status badge changes from `MATCHING` to `RESPONDED`.

---

### Step 7: Admin Verification (Window 3 or Sign in as Admin)
1. Sign in as `admin@bloodlink.local` / `Admin123!`.
2. Visit `/admin/dashboard`:
   - Active requests metric reflects current network status.
   - Request #{id} appears in the Recent Requests table with status `RESPONDED`.
3. Visit `/admin/duplicates`:
   - Screen Request #{id} to verify triage duplicate screening.

---

## Result
✅ The primary emergency requirement coordination journey is complete, fully integrated with database persistence, rule-based compatibility matching, and zero-delay WebSocket synchronization.

-- ============================================================
-- BLOODLINK: EMERGENCY BLOOD REQUIREMENT MATCHING NETWORK
-- PostgreSQL Database Seed & Schema Reference
-- Compatible with Neon PostgreSQL (PostgreSQL 15+)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DONOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS donor_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BLOOD REQUESTS TABLE
CREATE TABLE IF NOT EXISTS blood_requests (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(20) NOT NULL,
    units_required INTEGER NOT NULL CHECK (units_required > 0),
    hospital_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    urgency VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id BIGINT NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION,
    response_status VARCHAR(50) NOT NULL DEFAULT 'NOTIFIED',
    notified_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_request_donor UNIQUE (request_id, donor_id)
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id BIGINT REFERENCES blood_requests(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. REQUEST HISTORY TABLE
CREATE TABLE IF NOT EXISTS request_histories (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- 7. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id BIGINT,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index creation for fast proximity, status and user queries
CREATE INDEX IF NOT EXISTS idx_donor_availability ON donor_profiles (availability_status, blood_group);
CREATE INDEX IF NOT EXISTS idx_request_status ON blood_requests (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_matches_request ON matches (request_id);
CREATE INDEX IF NOT EXISTS idx_matches_donor ON matches (donor_id);

-- ============================================================
-- DEMO SEED DATA (Passwords hashed with BCrypt, cost factor 10)
-- Passwords:
-- Admin: Admin123!
-- Requester: Requester123!
-- Donor: Donor123!
-- ============================================================

-- BCrypt hashes:
-- $2a$10$wT0EmsnEw47Jz6Qe0f9GXeT5fCjW6t8.t.5K9QZkW8d8pQv6fB3XG (Admin123!)
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (Generic secret)

INSERT INTO users (id, name, email, password, phone, role, active, created_at, updated_at) VALUES
(1, 'System Admin', 'admin@bloodlink.local', '$2a$10$wT0EmsnEw47Jz6Qe0f9GXeT5fCjW6t8.t.5K9QZkW8d8pQv6fB3XG', '+91-9876543210', 'ADMIN', true, NOW() - INTERVAL '30 days', NOW()),
(2, 'Rajesh Sharma', 'requester@bloodlink.local', '$2a$10$wT0EmsnEw47Jz6Qe0f9GXeT5fCjW6t8.t.5K9QZkW8d8pQv6fB3XG', '+91-9876543211', 'REQUESTER', true, NOW() - INTERVAL '15 days', NOW()),
(3, 'Kiran Kumar', 'donor@bloodlink.local', '$2a$10$wT0EmsnEw47Jz6Qe0f9GXeT5fCjW6t8.t.5K9QZkW8d8pQv6fB3XG', '+91-9876543212', 'DONOR', true, NOW() - INTERVAL '20 days', NOW()),
(4, 'Rohit Verma', 'rohit.donor@bloodlink.local', '$2a$10$wT0EmsnEw47Jz6Qe0f9GXeT5fCjW6t8.t.5K9QZkW8d8pQv6fB3XG', '+91-9876543213', 'DONOR', true, NOW() - INTERVAL '20 days', NOW()),
(5, 'Priya Patel', 'priya.donor@bloodlink.local', '$2a$10$wT0EmsnEw47Jz6Qe0f9GXeT5fCjW6t8.t.5K9QZkW8d8pQv6fB3XG', '+91-9876543214', 'DONOR', true, NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO donor_profiles (id, user_id, blood_group, city, latitude, longitude, availability_status, created_at, updated_at) VALUES
(1, 3, 'O_POSITIVE', 'Hyderabad', 17.3850, 78.4867, 'AVAILABLE', NOW() - INTERVAL '20 days', NOW()),
(2, 4, 'O_NEGATIVE', 'Hyderabad', 17.4399, 78.4983, 'AVAILABLE', NOW() - INTERVAL '20 days', NOW()),
(3, 5, 'A_POSITIVE', 'Hyderabad', 17.4065, 78.4772, 'AVAILABLE', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('donor_profiles_id_seq', (SELECT MAX(id) FROM donor_profiles));

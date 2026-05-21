-- Fundraising System - PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('claimer', 'donor')),
    registration_date TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    claimer_name VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INTEGER CHECK (semester BETWEEN 1 AND 8),
    description TEXT NOT NULL,
    hod_file_name VARCHAR(255),
    hod_file_type VARCHAR(100),
    hod_file_data TEXT,
    hod_no VARCHAR(20),
    easypaisa_no VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    date_submitted TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
    donor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    donor_name VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'EasyPaisa',
    screenshot_data TEXT,
    screenshot_type VARCHAR(100),
    screenshot_name VARCHAR(255),
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(20) NOT NULL CHECK (recipient IN ('all', 'claimers', 'donors')),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date_sent TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hod_no VARCHAR(20) NOT NULL,
    clerk_no VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_payment_info (
    id SERIAL PRIMARY KEY,
    easypaisa_no VARCHAR(30),
    jazzcash_no  VARCHAR(30),
    bank_name    VARCHAR(100),
    bank_account VARCHAR(100),
    bank_title   VARCHAR(100),
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- Default admin (password: admin123)
INSERT INTO admins (name, email, password)
VALUES ('Admin', 'admin@fundraising.com', '$2b$10$XXrG1PqKEfMFIPWe5aZDCu/IxH5rZEUINrJtLaMeT8gAWUopgM8vi')
ON CONFLICT (email) DO UPDATE SET password = '$2b$10$XXrG1PqKEfMFIPWe5aZDCu/IxH5rZEUINrJtLaMeT8gAWUopgM8vi';

-- Default payment info
INSERT INTO admin_payment_info (easypaisa_no, jazzcash_no, bank_name, bank_account, bank_title)
VALUES ('03001234567', '03111234567', 'HBL', 'PK36HABB0000000000000000', 'Fundraising System')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_claim_id ON donations(claim_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

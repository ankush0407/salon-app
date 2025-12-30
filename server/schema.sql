-- Salons/Businesses table
CREATE TABLE salons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  salon_image_url TEXT,
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  timezone VARCHAR(255) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_salons_timezone ON salons(timezone);

-- Users table with salon association
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, email)
);

-- Customers table with salon association
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  join_date DATE NOT NULL,
  clerk_user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, email)
);

-- Subscription types table with salon association
CREATE TABLE subscription_types (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  visits INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, name)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type_id INTEGER NOT NULL REFERENCES subscription_types(id),
  start_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits table
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_salon_id ON users(salon_id);
CREATE INDEX idx_customers_salon_id ON customers(salon_id);
CREATE INDEX idx_subscription_types_salon_id ON subscription_types(salon_id);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_visits_subscription_id ON visits(subscription_id);

-- ==========================================
-- APPOINTMENT BOOKING TABLES
-- ==========================================

-- Status enum type for appointments
CREATE TYPE appointment_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'RESCHEDULE_PROPOSED',
  'ACCEPTED',
  'CANCELLED',
  'COMPLETED'
);

-- Salon Availability Settings
CREATE TABLE salon_availability (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT false,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  slot_duration INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, day_of_week)
);

CREATE INDEX idx_salon_availability_salon_id ON salon_availability(salon_id);
CREATE INDEX idx_salon_availability_day ON salon_availability(day_of_week);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  requested_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  proposed_time TIMESTAMP WITHOUT TIME ZONE,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_subscription_id ON appointments(subscription_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_salon_status ON appointments(salon_id, status);
CREATE INDEX idx_appointments_requested_time ON appointments(requested_time);

# 📖 Complete Technical Documentation

All technical details for deployment, API, database, and troubleshooting.

## Table of Contents

1. [Timezone Support](#timezone-support)
2. [API Reference](#api-reference)
3. [Database Schema](#database-schema)
4. [Authentication & Security](#authentication--security)
5. [Deployment Guide](#deployment-guide)
6. [Environment Configuration](#environment-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Timezone Support

### Overview
The salon application includes comprehensive timezone support to ensure appointment availability and bookings work correctly across different timezones. Each salon operates in their local timezone, and all appointment slots are generated and displayed correctly regardless of the customer's location.

### Key Features
- ✅ Salon timezone detection and storage (IANA timezone strings)
- ✅ Timezone-aware availability slot generation
- ✅ Correct day-of-week calculations in salon's timezone
- ✅ Frontend displays slots grouped by salon timezone
- ✅ Support for all 457 IANA timezones worldwide

### How It Works

**1. Salon Timezone Storage**
- Each salon has a `timezone` column in the database (VARCHAR(255))
- Defaults to 'UTC' for backward compatibility
- Can be set during registration or updated in Business Profile settings
- Validated against IANA timezone database

**2. Backend Slot Generation**
- Fetches salon's timezone from database
- Uses timezone utilities to determine correct day-of-week in salon's local time
- Generates slots according to salon's availability settings
- Returns UTC timestamps + salon timezone metadata

**3. Frontend Display**
- Receives slots as UTC timestamps with `salonTimezone`
- Groups slots by date in salon's timezone (not UTC or browser timezone)
- Displays appointment times in customer's browser timezone
- Ensures Monday 9AM slots appear under "Monday" (not Sunday/Tuesday)

### Architecture

**Backend Files:**
- [`server/utils/timezone.js`](server/utils/timezone.js) - Core timezone conversion utilities
- [`server/routes/appointments.js`](server/routes/appointments.js) - Timezone-aware slot generation
- [`server/routes/auth.js`](server/routes/auth.js) - Timezone validation during registration
- [`server/routes/profile.js`](server/routes/profile.js) - Timezone management endpoints

**Frontend Files:**
- [`client/src/utils/timezone.js`](client/src/utils/timezone.js) - Timezone detection & IANA list
- [`client/src/components/BookingModal.js`](client/src/components/BookingModal.js) - Timezone-aware slot display
- [`client/src/components/Profile.js`](client/src/components/Profile.js) - Timezone selector UI

### Utility Functions

#### Backend (`server/utils/timezone.js`)

```javascript
// Get date components in specific timezone
getDateInTimezone(date, timeZone)
// Returns: { year, month, day, hours, minutes, seconds, dayOfWeek }

// Get day of week (0-6, Sun-Sat) in specific timezone
getDayOfWeekInTimezone(date, timeZone)
// Uses Intl.DateTimeFormat for DST-safe calculations

// Create UTC Date representing local time in timezone
createDateInTimezone(year, month, day, hours, minutes, seconds, timeZone)
// Binary search algorithm finds correct UTC timestamp

// Apply time string to date in specific timezone
applyTimeToDateInTimezone(date, timeString, timeZone)
// Example: applyTimeToDateInTimezone(date, "14:30:00", "America/Los_Angeles")

// Advance to next day in specific timezone
getNextDayInTimezone(date, timeZone)
// Handles month boundaries and leap years correctly

// Compare dates
isBefore(date1, date2)
```

#### Frontend (`client/src/utils/timezone.js`)

```javascript
// Detect user's current timezone
detectUserTimezone()
// Returns: IANA timezone string (e.g., "America/Los_Angeles")

// Validate IANA timezone string
isValidTimezone(timezone)

// Get list of all supported timezones
getTimezoneList()
// Returns: Array of {value, label, offset} objects

// Format timezone for display
formatTimezoneForDisplay(timezone)
// Example: "America/Los_Angeles" → "America/Los_Angeles (UTC-8)"
```

### Example Workflow

**Scenario:** Salon in Los Angeles (PST, UTC-8), Customer in New York (EST, UTC-5)

1. **Salon sets availability:**
   - Monday 9:00 AM - 5:00 PM PST
   - Stored with timezone: "America/Los_Angeles"

2. **Backend generates slots:**
   - Checks current date/time in PST (not server timezone)
   - Creates slots: 9:00 AM, 9:30 AM, 10:00 AM... in PST
   - Converts to UTC: 17:00, 17:30, 18:00... (UTC)
   - Groups by PST date to ensure correct day

3. **API returns:**
   ```json
   {
     "slots": [
       {"time": "2025-01-06T17:00:00.000Z"},
       {"time": "2025-01-06T17:30:00.000Z"}
     ],
     "salonTimezone": "America/Los_Angeles"
   }
   ```

4. **Frontend displays:**
   - Groups slots by PST date: "Mon, Jan 6"
   - Shows times in customer's EST timezone: "12:00 PM", "12:30 PM"
   - Customer sees: "Monday, Jan 6: 12:00 PM (your time)"

### Supported Timezones
All 457 IANA timezones:
- **Americas:** America/New_York, America/Los_Angeles, America/Chicago, etc.
- **Europe:** Europe/London, Europe/Paris, Europe/Berlin, etc.
- **Asia:** Asia/Tokyo, Asia/Dubai, Asia/Kolkata, etc.
- **Pacific:** Pacific/Auckland, Pacific/Honolulu, etc.
- **Africa:** Africa/Cairo, Africa/Johannesburg, etc.
- **Australia:** Australia/Sydney, Australia/Melbourne, etc.

### Performance
- Timezone calculations add ~3-5ms per request (negligible)
- Binary search algorithm: ~50 iterations maximum
- No external dependencies (uses native Intl API)
- Database index on `salons.timezone` for fast lookups

### Troubleshooting Timezone Issues

**Slots appearing on wrong days:**
1. Verify salon timezone is set correctly:
   ```sql
   SELECT id, name, timezone FROM salons WHERE id = <salon_id>;
   ```
2. Check API response includes `salonTimezone`
3. Clear browser cache and local storage
4. Restart both frontend and backend servers

**Timezone not saving:**
1. Verify timezone string is valid IANA format
2. Check database has `timezone` column:
   ```sql
   \d salons
   ```
3. Run migration if column missing:
   ```sql
   ALTER TABLE salons ADD COLUMN timezone VARCHAR(255) NOT NULL DEFAULT 'UTC';
   CREATE INDEX idx_salons_timezone ON salons(timezone);
   ```

**DST (Daylight Saving Time) issues:**
- System automatically handles DST transitions
- Uses Intl.DateTimeFormat which respects historical DST rules
- No manual DST adjustment needed

---

## API Reference

### Base URL
- **Development:** http://localhost:5000/api
- **Production:** https://api.yourdomain.com/api

### Appointment Endpoints

#### Get Available Slots
```http
GET /appointments/available-slots?salonId=8&days=60
```

**Query Parameters:**
- `salonId` (required) - Salon ID
- `days` (optional) - Days to look ahead (default: 60)

**Response:**
```json
{
  "slots": [
    {"time": "2025-01-05T09:00:00Z"},
    {"time": "2025-01-05T09:30:00Z"}
  ]
}
```

#### Get Owner's Appointments
```http
GET /appointments/owner
Authorization: Bearer <jwt_token>
```

#### Confirm Appointment
```http
PATCH /appointments/:appointmentId/confirm
Authorization: Bearer <jwt_token>
```

#### Propose Alternative Time
```http
PATCH /appointments/:appointmentId/propose
Authorization: Bearer <jwt_token>
Content-Type: application/json

{"proposedTime": "2025-01-05T11:00:00Z"}
```

### Availability Endpoints

#### Save Availability Settings
```http
POST /availability
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "settings": [
    {
      "dayOfWeek": 0,
      "isWorkingDay": true,
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "slotDuration": 30
    }
  ]
}
```

#### Get Availability
```http
GET /availability/:salonId
```

### Customer Endpoints

#### Get Customer Profile
```http
GET /customer/me
Authorization: Bearer <clerk_token>
```

#### List Subscriptions
```http
GET /customer/subscriptions
Authorization: Bearer <clerk_token>
```

#### Get Subscription Detail
```http
GET /customer/subscriptions/:subscriptionId
Authorization: Bearer <clerk_token>
```

**Response includes:**
```json
{
  "id": 51,
  "name": "Spa and Massage",
  "salonId": 8,
  "totalVisits": 6,
  "usedVisits": 2,
  "remainingVisits": 4,
  "visits": [
    {"id": 1, "date": "2024-12-15", "note": "Great session"}
  ]
}
```

### Error Responses

```json
400: {"error": "Invalid request parameters"}
401: {"error": "Invalid or expired token"}
403: {"error": "Access denied"}
404: {"error": "Resource not found"}
409: {"error": "Conflict - slot no longer available"}
500: {"error": "Internal server error"}
```

---

## Database Schema

### Tables

**salons**
```sql
CREATE TABLE salons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**users (salon owners)**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**customers**
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  clerk_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**subscriptions (packages)**
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  total_visits INTEGER NOT NULL,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**subscription_instances (customer subscriptions)**
```sql
CREATE TABLE subscription_instances (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**appointments**
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  subscription_id INTEGER NOT NULL,
  requested_time TIMESTAMP,
  confirmed_time TIMESTAMP,
  proposed_time TIMESTAMP,
  status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**salon_availability**
```sql
CREATE TABLE salon_availability (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  day_of_week INTEGER,
  is_working_day BOOLEAN,
  start_time TIME,
  end_time TIME,
  slot_duration INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**visits**
```sql
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  subscription_instance_id INTEGER NOT NULL,
  date DATE,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Constraints
- `salon_id` is required on nearly all tables for multi-tenant isolation
- Foreign keys enforce referential integrity
- Unique constraints prevent duplicates
- Timestamps track creation/modification

---

## Authentication & Security

### JWT Authentication (Owners)

**Login Process:**
```bash
POST /api/auth/login
{
  "email": "owner@salon.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "owner@salon.com",
    "salon_id": 8,
    "salon_name": "Blue Salon"
  }
}
```

**Using Token:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/appointments/owner
```

### Clerk Authentication (Customers)

Customers authenticate via Clerk email code:
1. Enter email
2. Receive code
3. Submit code
4. Clerk returns token
5. Token sent to backend in Authorization header

**Clerk Token Validation:**
```javascript
// In middleware/auth.js
const token = req.headers.authorization?.split('Bearer ')[1];
const decoded = await clerkClient.verifyToken(token);
```

### Security Best Practices

✅ **Implemented:**
- Passwords hashed with bcrypt
- JWT tokens expire after configured time
- CORS configured to allow only trusted origins
- SQL queries use parameterized statements (Knex.js)
- Rate limiting on sensitive endpoints
- HTTPS enforced in production
- No credentials in code (use .env)

✅ **Never:**
- Commit .env files
- Store passwords in plain text
- Log sensitive information
- Expose error details to clients

---

## Deployment Guide

### Prerequisites

```bash
# System requirements
Node.js v14+
PostgreSQL 12+
npm 6+
Git

# Third-party services
Clerk account (customer auth)
```

### Production Environment Setup

**1. Server Preparation**

```bash
# SSH into production server
ssh user@your-server.com

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
```

**2. Database Setup**

```bash
# Create production database
sudo -u postgres createdb salon_tracker_prod

# Create database user
sudo -u postgres psql -c "CREATE USER salon_user WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE salon_tracker_prod TO salon_user;"

# Load schema
sudo -u postgres psql -d salon_tracker_prod -f /home/user/salon-app/server/schema.sql

# Setup backups
mkdir -p /backups/salon-db
chmod 700 /backups/salon-db
```

**3. Backup Script**

```bash
#!/bin/bash
# /home/user/backup-db.sh

BACKUP_DIR="/backups/salon-db"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="salon_tracker_prod_$DATE.sql.gz"

pg_dump -U salon_user salon_tracker_prod | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Add to crontab:
```bash
# Daily at 2 AM
0 2 * * * /home/user/backup-db.sh
```

**4. Backend Deployment**

```bash
# Clone and setup
cd /home/user
git clone <repo-url>
cd salon-app/server
npm ci --production

# Setup PM2
npm install -g pm2
pm2 start server.js --name "salon-api"
pm2 startup
pm2 save
```

**5. Frontend Deployment**

```bash
cd /home/user/salon-app/client
npm ci
npm run build

# Copy to web server
sudo mkdir -p /var/www/salon-app
sudo cp -r build/* /var/www/salon-app/
```

**6. Nginx Reverse Proxy**

```nginx
# /etc/nginx/sites-available/salon-api

upstream backend {
    server 127.0.0.1:5000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend SPA
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/salon-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|gif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/salon-api /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

**7. SSL Certificates**

```bash
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d api.yourdomain.com -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Environment Configuration

### Development (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/salon_tracker
JWT_SECRET=dev_secret_key_change_in_production
NODE_ENV=development
PORT=5000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Production (.env)

```
DATABASE_URL=postgresql://salon_user:STRONG_PASSWORD@prod-host:5432/salon_tracker_prod
JWT_SECRET=<generate: openssl rand -base64 32>
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Important Notes
- JWT_SECRET must be 32+ characters, stored securely
- DATABASE_URL never committed to git
- Different secrets for development and production
- All sensitive values in .env, not code

---

## Troubleshooting

### Backend Issues

**Port 5000 already in use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

**Database connection refused**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify credentials
cat server/.env | grep DATABASE_URL
```

**"Access denied" errors**
```bash
# Verify user has permissions
psql -U postgres -d salon_tracker -c \
  "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salon_user;"
```

### Frontend Issues

**API calls failing**
```
1. Check browser console for errors
2. Verify REACT_APP_API_URL in .env
3. Ensure backend is running
4. Test API directly: curl http://localhost:5000/api/health
```

**Module not found errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Appointment Booking Issues

**Slots not showing**
```
1. Verify availability settings exist
2. Check salon_id is correct
3. Ensure dates are within 60-day window
4. Check database for appointments blocking slots
```

**Modal not opening**
```
1. Check browser console for errors
2. Verify BookingModal receives isOpen prop
3. Ensure showBookingModal state updates
4. Check no React errors in component tree
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check application status
pm2 status

# View logs
pm2 logs salon-api | head -50

# Monitor processes
pm2 monit

# Check disk space
df -h

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('salon_tracker_prod'));"
```

### Weekly Tasks

```bash
# Review errors in logs
grep ERROR /var/log/app.log | wc -l

# Check backup files
ls -lh /backups/salon-db/ | tail -7

# Monitor slow queries
sudo -u postgres psql -d salon_tracker_prod -c \
  "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_subscriptions_salon ON subscriptions(salon_id);
CREATE INDEX idx_appointments_salon ON appointments(salon_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_visits_customer ON visits(customer_id);

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Performance Monitoring

```bash
# CPU and memory
top -b -n 1 | head -20

# Node process memory
ps aux | grep node

# PostgreSQL connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Slow query log
sudo tail -f /var/log/postgresql/postgresql.log | grep "duration:"
```

### Disaster Recovery

```bash
# List available backups
ls -lh /backups/salon-db/

# Restore from backup
gunzip -c /backups/salon-db/salon_tracker_prod_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U salon_user salon_tracker_prod

# Verify restore
psql -d salon_tracker_prod -c "SELECT COUNT(*) FROM salons;"
```

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Status:** Production Ready ✅

---

## Quick Start

### Prerequisites

- **Node.js** v14+
- **PostgreSQL** (or Neon for cloud)
- **npm** or **yarn**
- **Clerk** account (for customer authentication)
- **Stripe** account (for payments)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb salon_tracker

# Run schema
psql -U username -d salon_tracker -f server/schema.sql
```

### 2. Backend Setup

```bash
cd server
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost/salon_tracker
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5000

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
EOF

npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
EOF

npm start
```

### 4. Access the App

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## Architecture & Features

### ✨ Key Features

- ✅ **Multiple Salon Owners** - Each owner registers independent salon account
- ✅ **Complete Data Isolation** - Customers, subscriptions, packages are salon-specific
- ✅ **Secure Authentication** - JWT for owners, Clerk for customers
- ✅ **Email Reuse** - Same email can be used by different salon owners
- ✅ **Subscription Management** - Create packages and assign to customers
- ✅ **Visit Tracking** - Redeem visits with notes and history
- ✅ **Stripe Payments** - Accept payments and store invoices
- ✅ **Customer Portal** - Customers view subscriptions and invoices
- ✅ **Multi-tenant** - Unlimited salon owners supported
- ✅ **Scalable** - Enterprise-grade architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Salon Tracker                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │   Owner Portal   │          │Customer Portal   │        │
│  │  (React)         │          │  (React)         │        │
│  │ - Dashboard      │          │ - Subscriptions  │        │
│  │ - Customers      │          │ - Invoices       │        │
│  │ - Subscriptions  │          │ - Profile        │        │
│  └────────┬─────────┘          └────────┬─────────┘        │
│           │                             │                  │
│           └──────────┬──────────────────┘                  │
│                      │                                     │
│              ┌──────▼──────┐                              │
│              │ Express API  │                              │
│              │ (Node.js)    │                              │
│              ├──────────────┤                              │
│              │ Routes:      │                              │
│              │ - /auth      │                              │
│              │ - /customers │                              │
│              │ - /subscr... │                              │
│              │ - /profile   │                              │
│              │ - /dashboard │                              │
│              └──────┬───────┘                              │
│                     │                                      │
│        ┌────────────┼────────────┐                         │
│        ▼            ▼            ▼                         │
│    ┌───────┐  ┌────────┐  ┌──────────┐                    │
│    │   DB  │  │ Clerk  │  │  Stripe  │                    │
│    │  (PG) │  │ (Auth) │  │(Payments)│                    │
│    └───────┘  └────────┘  └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**
- React 18
- Axios (HTTP client)
- Tailwind CSS
- Clerk React SDK
- Lucide React (icons)

**Backend**
- Express.js 5
- PostgreSQL
- JWT (authentication)
- bcryptjs (password hashing)
- Clerk SDK
- Stripe SDK
- Multer (file uploads)

---

## Setup Instructions

### Step 1: Get Clerk Keys

1. Go to https://clerk.com
2. Sign up → Create app
3. Select "Email Code" auth method
4. Copy **Publishable Key** and **Secret Key**
5. Add to `.env` files

### Step 2: Get Stripe Keys

1. Go to https://stripe.com
2. Sign up → Create project
3. Go to API keys (test mode)
4. Copy **Publishable Key** and **Secret Key**
5. Add to backend `.env`

### Step 3: Database Setup

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from https://www.postgresql.org/download/windows/

# Create database
createdb salon_tracker

# Apply schema
psql -U postgres -d salon_tracker -f server/schema.sql

# Verify tables
psql -d salon_tracker -c "\dt"
# Should show: salons, users, customers, subscription_types, subscriptions, visits
```

### Step 4: Environment Variables

**server/.env**
```
DATABASE_URL=postgresql://user:password@localhost/salon_tracker
JWT_SECRET=generate_a_random_string_here
NODE_ENV=development
PORT=5000
CLERK_SECRET_KEY=sk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**client/.env**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Step 5: Dependencies

All dependencies are listed in package.json files. Run:

```bash
cd server && npm install
cd ../client && npm install
```

No additional packages needed - everything is already specified.

---

## API Reference

### Authentication Routes

#### Register New Salon
```http
POST /api/auth/register-salon
Content-Type: application/json

{
  "name": "My Salon",
  "email": "owner@salon.com",
  "phone": "(555) 123-4567",
  "address": "123 Main St",
  "password": "secure_password"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "owner@salon.com",
    "role": "OWNER",
    "salon_id": 1,
    "salon_name": "My Salon"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@salon.com",
  "password": "secure_password"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "owner@salon.com",
    "role": "OWNER",
    "salon_id": 1,
    "salon_name": "My Salon"
  }
}
```

### Customer Routes

#### Get All Customers
```http
GET /api/customers
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "salon_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "join_date": "2024-01-15T10:30:00Z"
  }
]
```

#### Add Customer
```http
POST /api/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234"
}

Response: Created customer object with id
```

#### Update Customer
```http
PUT /api/customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234"
}

Response: Updated customer object
```

#### Delete Customer
```http
DELETE /api/customers/{id}
Authorization: Bearer {token}

Response: { "message": "Customer deleted" }
```

### Subscription Routes

#### Get Customer Subscriptions
```http
GET /api/subscriptions/customer/{customerId}
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "customer_id": 1,
    "subscription_type_id": 1,
    "active": true,
    "total_visits": 4,
    "remaining_visits": 2,
    "visits": [
      {
        "id": 1,
        "date": "2024-01-20T14:00:00Z",
        "note": "Hair cut"
      }
    ]
  }
]
```

#### Create Subscription
```http
POST /api/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": 1,
  "subscription_type_id": 1
}

Response: Created subscription object
```

#### Redeem Visit
```http
POST /api/subscriptions/{subscriptionId}/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "note": "Hair cut - regular service"
}

Response: Updated subscription with new visit
```

#### Update Visit Note
```http
PUT /api/subscriptions/visit/{visitId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "note": "Updated note text"
}

Response: { "message": "Visit updated" }
```

#### Delete Visit
```http
DELETE /api/subscriptions/visit/{visitId}
Authorization: Bearer {token}

Response: { "message": "Visit deleted" }
```

### Subscription Types (Packages) Routes

#### Get All Packages
```http
GET /api/subscription-types
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "salon_id": 1,
    "name": "Basic Package",
    "visits": 4,
    "price": 99.99
  }
]
```

#### Create Package
```http
POST /api/subscription-types
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Premium Package",
  "visits": 8,
  "price": 199.99
}

Response: Created package object
```

#### Delete Package
```http
DELETE /api/subscription-types/{id}
Authorization: Bearer {token}

Response: { "message": "Package deleted" }
```

### Dashboard Routes

#### Get Dashboard Metrics
```http
GET /api/dashboard
Authorization: Bearer {token}

Response:
{
  "totalCustomers": 25,
  "newCustomers": {
    "last30Days": 5,
    "last365Days": 15
  },
  "activeSubscriptions": 18,
  "newCustomersTrend": [...],
  "subscriptionTypeBreakdown": [...]
}
```

#### Export CSV
```http
GET /api/dashboard/export
Authorization: Bearer {token}

Response: CSV file download
```

### Profile Routes

#### Get Profile
```http
GET /api/profile
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "name": "My Salon",
  "email": "owner@salon.com",
  "phone": "(555) 123-4567",
  "salon_image_url": "http://...",
  "subscription_status": "active",
  "stripe_customer_id": "cus_xxx"
}
```

#### Update Profile
```http
PUT /api/profile
Authorization: Bearer {token}
Content-Type: multipart/form-data

name=My Salon
phone=(555) 123-4567
email=owner@salon.com
salonImage=<file>

Response: Updated profile object
```

#### Get Invoices
```http
GET /api/profile/invoices
Authorization: Bearer {token}

Response:
[
  {
    "id": "in_123456",
    "amount": 9999,
    "currency": "usd",
    "created": 1705353600,
    "pdfUrl": "https://stripe.com/...",
    "status": "paid"
  }
]
```

#### Sync Stripe Customer
```http
POST /api/profile/sync-stripe-customer
Authorization: Bearer {token}

Response:
{
  "message": "Customer synced",
  "stripe_customer_id": "cus_xxx",
  "invoices_count": 5
}
```

#### Customer Portal: Get Customer Profile
```http
GET /api/customer/me
Authorization: Bearer {clerkToken}

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "subscriptions": [...]
}
```

---

## Database Schema

### salons
```sql
CREATE TABLE salons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'OWNER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, email)
);
```

### customers
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  clerk_user_id VARCHAR(255),
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, email)
);
```

### subscription_types
```sql
CREATE TABLE subscription_types (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  visits INTEGER NOT NULL,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  subscription_type_id INTEGER REFERENCES subscription_types(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, subscription_type_id)
);
```

### visits
```sql
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);
```

---

## Authentication & Security

### JWT Token Structure
```javascript
{
  id: 1,              // User ID
  email: "...",       // User email
  role: "OWNER",      // User role
  salon_id: 1         // Salon context
}
```

### Token Usage
```javascript
// Set token in localStorage after login
localStorage.setItem('token', response.data.token);

// Send token in all API requests
headers: {
  Authorization: `Bearer ${token}`
}

// Token expires in 7 days
```

### Security Features

1. **Data Isolation** - Every query filters by salon_id
2. **Access Control** - Verify ownership before update/delete
3. **Password Hashing** - bcryptjs with 10 salt rounds
4. **Parameterized Queries** - Prevent SQL injection
5. **JWT Validation** - Verify signature and expiration
6. **CORS** - Restrict to allowed origins
7. **Role-based Access** - Different permissions for OWNER vs CUSTOMER

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "401 Unauthorized" | Missing/invalid token | Login and get new token |
| "403 Forbidden" | Accessing other salon's data | Login to correct salon |
| "404 Not Found" | Resource doesn't exist | Verify ID is correct |
| "400 Bad Request" | Invalid input | Check required fields |
| "500 Server Error" | Backend issue | Check server logs |

---

## Clerk Integration

### Clerk Setup

Clerk handles passwordless authentication for customers.

#### Enable Clerk

1. Create account at https://clerk.com
2. Create new application
3. Select "Email" as primary auth
4. Copy keys to .env files
5. Update `client/src/index.js` (already done)

#### Clerk Configuration

**server/.env**
```
CLERK_SECRET_KEY=sk_test_xxxxx
```

**client/.env**
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Clerk Middleware

```javascript
// server/middleware/clerk-auth.js
async function requireClerkAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    const session = await clerk.sessions.getSession(sessionToken);
    const user = await clerk.users.getUser(session.userId);
    
    req.clerkUser = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
```

### Customer Portal

Customers sign in with Clerk, then the app finds/creates their customer record:

```javascript
// Flow:
1. Customer opens app
2. Clerk login screen appears
3. Customer enters email
4. Clerk sends OTP
5. Customer enters OTP
6. Signed in → App fetches customer profile from our DB
7. If not found, create customer record
8. Show customer portal with subscriptions
```

---

## Stripe Integration

### Stripe Setup

1. Create account at https://stripe.com
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Add to `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

### Invoice Workflow

```
1. Owner creates subscription package (e.g., $99 for 4 visits)
2. Customer makes payment through Stripe checkout
3. Stripe creates invoice and customer in Stripe system
4. Backend receives webhook (or syncs on demand)
5. Frontend fetches invoices and displays in Profile
6. Customer can download PDF from Stripe
```

### Invoice Sync

When payment succeeds:

```javascript
// Frontend initiates sync
POST /api/profile/sync-stripe-customer

// Backend:
1. Gets Stripe customer ID from Stripe API
2. Fetches all invoices for that customer
3. Stores customer_id in database
4. Returns invoice list

// Frontend:
1. Saves customer ID to profile
2. Displays invoices
3. Provides download links
```

### Invoice Troubleshooting

**Invoice not appearing?**

1. Check database for correct email:
   ```sql
   SELECT id, email, stripe_customer_id FROM salons;
   ```

2. Search Stripe dashboard:
   - Go to Customers
   - Search by email
   - Check if invoices exist

3. Test sync endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/profile/sync-stripe-customer \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## Testing Guide

### Manual Testing Checklist

#### Owner Flow
- [ ] Register new salon account
- [ ] Login successfully
- [ ] Dashboard loads with metrics
- [ ] Add new subscription package
- [ ] Add new customer
- [ ] Create subscription for customer
- [ ] Redeem visits
- [ ] Update visit notes
- [ ] View CSV export

#### Customer Flow (Clerk)
- [ ] Clerk login screen appears
- [ ] Enter email
- [ ] Enter OTP from email
- [ ] Customer portal loads
- [ ] View subscriptions
- [ ] View invoices
- [ ] Download invoice
- [ ] Sign out

#### Multi-Tenant
- [ ] Create 2 different salons
- [ ] Login as Salon A
- [ ] Add customers to Salon A
- [ ] Login as Salon B
- [ ] Verify Salon B only sees own customers
- [ ] Verify Salon A customers not visible

### Testing with cURL

```bash
# Register Salon A
curl -X POST http://localhost:5000/api/auth/register-salon \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salon A",
    "email": "salonA@test.com",
    "phone": "555-0001",
    "address": "123 Main St",
    "password": "password123"
  }'

# Login and get token
RESPONSE=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "salonA@test.com",
    "password": "password123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')

# Add customer
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234"
  }'

# Get customers
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN"
```

### Test Scenarios

**Scenario 1: Register and Manage Customers**
1. Register Salon A
2. Add 3 customers
3. Verify all 3 appear in customer list
4. Update one customer's phone
5. Delete one customer
6. Verify only 2 remain

**Scenario 2: Subscriptions and Visits**
1. Register Salon A
2. Add customer "John"
3. Create package "Basic - 4 visits"
4. Create subscription for John
5. Redeem 2 visits
6. Add notes to visits
7. Verify remaining visits = 2

**Scenario 3: Multi-Tenant Isolation**
1. Register Salon A with email a@test.com
2. Add customer "Alice" to Salon A
3. Register Salon B with email b@test.com
4. Add customer "Bob" to Salon B
5. Login as Salon A
6. Verify only "Alice" visible
7. Login as Salon B
8. Verify only "Bob" visible

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# Verify connection
psql -U postgres -d salon_tracker
```

#### "Access denied" error
```
Error: Access denied
```
**Solution:**
- You're trying to access another salon's data (this is correct behavior)
- Login to the correct salon owner account
- Check salon_id in token: `localStorage.getItem('token')`

#### "Cannot find module" error
```
Error: Cannot find module 'express'
```
**Solution:**
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
```

#### "Email already exists"
```
Error: This email is already registered
```
**Solution:**
- Email is already registered with another salon
- Use a different email for new salon registration

#### "CORS error"
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
1. Verify `REACT_APP_API_URL` in client/.env
2. Verify frontend URL in server CORS config
3. Restart backend server

#### "Stripe invoice not appearing"
```
Problem: Payment completed but invoice not showing
```
**Solution:**
1. Click "Sync Invoices" button on profile page
2. Check server logs for sync success
3. Verify email matches in Stripe dashboard
4. Try refreshing page after 30 seconds

#### "Clerk authentication failing"
```
Error: Session invalid or expired
```
**Solution:**
1. Verify CLERK_SECRET_KEY and REACT_APP_CLERK_PUBLISHABLE_KEY
2. Ensure Clerk keys match between frontend and backend
3. Check Clerk dashboard for app configuration

### Debug Mode

Enable detailed logging:

```bash
# Backend
NODE_DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

Check logs:
- Frontend: Browser console (F12)
- Backend: Terminal output

### Database Inspection

```bash
# Connect to database
psql -d salon_tracker

# List all tables
\dt

# Check salons
SELECT id, name, email FROM salons;

# Check customers for salon 1
SELECT id, name, email FROM customers WHERE salon_id = 1;

# Check subscriptions for customer 1
SELECT * FROM subscriptions WHERE customer_id = 1;

# Exit
\q
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Git repository clean

### Backend Deployment

- [ ] Update `NODE_ENV=production` in .env
- [ ] Set strong `JWT_SECRET`
- [ ] Set production database URL
- [ ] Set production Clerk keys
- [ ] Set production Stripe keys
- [ ] Verify CORS origins
- [ ] Run migrations
- [ ] Test all endpoints

### Frontend Deployment

- [ ] Update `REACT_APP_API_URL` to production URL
- [ ] Update `REACT_APP_CLERK_PUBLISHABLE_KEY`
- [ ] Build optimized: `npm run build`
- [ ] Verify build output
- [ ] Test in production build mode

### Post-Deployment

- [ ] Monitor error logs
- [ ] Verify database is healthy
- [ ] Test user flows
- [ ] Check payment processing
- [ ] Verify invoice generation
- [ ] Monitor performance
- [ ] Setup alerts/monitoring

### Environment Variables Checklist

**Backend**
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] NODE_ENV
- [ ] PORT
- [ ] CLERK_SECRET_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY

**Frontend**
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_CLERK_PUBLISHABLE_KEY

### Deployment Platforms

#### Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd client
vercel
```

#### Railway/Render/Heroku (Backend)

```bash
# Example: Railway
1. Create account at railway.app
2. Connect GitHub
3. Create new project
4. Add PostgreSQL
5. Set environment variables
6. Deploy
```

---

## File Structure

```
salon-app/
├── client/                           # React Frontend
│   ├── src/
│   │   ├── App.js                   # Main app router
│   │   ├── index.js                 # Entry point with Clerk provider
│   │   ├── index.css                # Tailwind imports
│   │   ├── components/
│   │   │   ├── SalonOwnerApp.js     # Owner view container
│   │   │   ├── SalonNavigation.js   # Navigation menu
│   │   │   ├── Dashboard.js         # Dashboard page
│   │   │   ├── OwnerPortal.js       # Customers page
│   │   │   ├── Subscriptions.js     # Packages page
│   │   │   ├── Profile.js           # Profile + invoices
│   │   │   ├── LoginScreen.js       # Owner login
│   │   │   ├── CustomerPortal.js    # Customer portal (Clerk)
│   │   │   └── modals.js            # Modal dialogs
│   │   ├── services/
│   │   │   └── api.js               # Axios API client
│   │   └── (other components)
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                           # Express Backend
│   ├── server.js                    # Entry point
│   ├── schema.sql                   # Database schema
│   ├── .env                         # Environment variables
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   └── clerk-auth.js            # Clerk authentication
│   ├── routes/
│   │   ├── auth.js                  # /auth endpoints
│   │   ├── customers.js             # /customers endpoints
│   │   ├── subscriptions.js         # /subscriptions endpoints
│   │   ├── subscriptionTypes.js     # /subscription-types endpoints
│   │   ├── dashboard.js             # /dashboard endpoints
│   │   ├── customer.js              # /customer endpoints (Clerk)
│   │   ├── profile.js               # /profile endpoints
│   │   └── stripe.js                # Stripe config (empty)
│   ├── utils/
│   │   ├── db.js                    # PostgreSQL connection pool
│   │   ├── dataAccess.js            # Query helpers
│   │   └── sheets.js                # Google Sheets integration
│   ├── uploads/                     # Salon image uploads
│   └── package.json
│
├── DOCUMENTATION.md                 # THIS FILE (complete reference)
└── README.md                        # Quick project overview
```

---

## Next Steps

1. **Setup** - Follow the Quick Start section
2. **Read** - Review the Architecture section
3. **Test** - Follow the Testing Guide
4. **Deploy** - Use the Deployment Checklist
5. **Monitor** - Setup error tracking and monitoring

## Support Resources

- **Clerk Docs**: https://clerk.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Express Docs**: https://expressjs.com
- **React Docs**: https://react.dev
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

**Version**: 2.0 (Multi-Tenant + Clerk + Stripe)  
**Status**: ✅ Production Ready  
**Last Updated**: December 2024

---

## License

This project is part of the Salon Tracker application.

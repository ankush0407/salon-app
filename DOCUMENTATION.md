# 🎨 Salon Tracker - Complete Documentation

A multi-tenant subscription management system for salon owners to track customers, manage subscription packages, and log service visits.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture & Features](#architecture--features)
3. [Setup Instructions](#setup-instructions)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Authentication & Security](#authentication--security)
7. [Clerk Integration](#clerk-integration)
8. [Stripe Integration](#stripe-integration)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)
11. [Deployment Checklist](#deployment-checklist)

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

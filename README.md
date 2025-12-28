# 🎨 MarkMyVisit - Salon Appointment & Subscription Management

Production-ready multi-tenant salon management system with appointment booking, subscription management, and owner/customer portals.

**Status:** ✅ Production Ready v1.0

## Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Appointment Booking System](#appointment-booking-system)
7. [API Quick Reference](#api-quick-reference)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

### 📅 Appointment Booking Module (NEW)
✅ **Soft Booking System** - Request-confirm workflow for appointments
✅ **Owner Availability Management** - Set working days, hours, and slot duration
✅ **Available Slots Calendar** - Customers see available times based on salon hours
✅ **Negotiation Workflow** - Owners can propose alternative times
✅ **Status Tracking** - PENDING → CONFIRMED, RESCHEDULE_PROPOSED workflows

### 💳 Subscription Management
✅ **Multiple Salon Owners** - Each owner manages their own salon
✅ **Subscription Packages** - Create custom subscription types
✅ **Visit Tracking** - Log and manage customer visits
✅ **Complete Data Isolation** - Secure multi-tenant architecture
✅ **Subscription Progress** - Visual progress tracking for customers

### 🔐 Security
✅ **JWT Authentication** - Secure owner authentication
✅ **Clerk Integration** - Customer sign-in via email codes
✅ **Role-Based Access** - Owner vs Customer permissions

## 🎯 New in v1.0: Appointment Booking

See [APPOINTMENT_BOOKING_IMPLEMENTATION.md](./APPOINTMENT_BOOKING_IMPLEMENTATION.md) for complete documentation.

### Quick Feature Overview

**For Salon Owners:**
- Configure working hours, days, and slot duration in "Availability Settings"
- View and manage appointment requests in "Appointments" manager
- Confirm bookings or propose alternative times
- Track appointment status changes

**For Customers:**
- Click "Book Visit" on any active subscription
- Browse available time slots in an interactive calendar
- Add optional notes to appointment requests
- Accept or decline proposed times
- View complete appointment history

## Quick Start

### Prerequisites

- **Node.js** v14+
- **PostgreSQL** (or Neon for cloud)
- **npm** or **yarn**
- **Clerk Account** (for customer authentication)

### 1. Setup Database

```bash
# Create PostgreSQL database
createdb salon_tracker

# Run schema (includes new appointment booking tables)
psql -U username -d salon_tracker -f server/schema.sql
```

### 2. Setup Backend

```bash
cd server
npm install

# Create .env file
echo "DATABASE_URL=postgresql://user:password@localhost/salon_tracker" > .env
echo "JWT_SECRET=your_secret_key_here" >> .env

# Start backend
npm start
# Backend runs on http://localhost:5000
```

### 3. Setup Frontend

```bash
cd client
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start frontend
npm start
# Frontend runs on http://localhost:3000
```

## 📚 Documentation

### New Documentation (Multi-Tenant)

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⭐ START HERE
   - What changed
   - Key endpoints
   - Common errors
   - Testing commands

2. **[MULTI_TENANT_IMPLEMENTATION.md](./MULTI_TENANT_IMPLEMENTATION.md)**
   - Technical architecture
   - Database schema details
   - All file changes
   - Security features

3. **[MULTI_TENANT_TESTING.md](./MULTI_TENANT_TESTING.md)**
   - 7 detailed test scenarios
   - Step-by-step instructions
   - Expected results
   - Troubleshooting guide

4. **[MULTI_TENANT_SUMMARY.md](./MULTI_TENANT_SUMMARY.md)**
   - Executive summary
   - Changes overview
   - Architecture diagram
   - Next steps

5. **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)**
   - Code implementation status
   - Testing checklist
   - Deployment checklist
   - Success indicators

## 🚀 Getting Started as a Salon Owner

### Register Your Salon

1. Visit http://localhost:3000
2. Click **"Don't have an account? Register"**
3. Fill in your salon details:
   - Salon Name
   - Phone
   - Address
   - Email (used for login)
   - Password
4. Click **"Create Account"**
5. You're logged in to your Owner Portal!

### Manage Your Business

**Owner Portal Features:**
- **Add Customers** - Register your clients
- **Manage Packages** - Create subscription types (e.g., "Basic - 4 visits")
- **Create Subscriptions** - Assign packages to customers
- **Redeem Visits** - Track when customers use their visits
- **Edit Notes** - Add details to each visit

## 🔐 Security

### Data Isolation
Every database query includes your salon's ID to prevent cross-salon access.

### Authentication
- JWT tokens include your salon context
- Invalid tokens are rejected
- Expired tokens require re-login
- Each salon owner has independent credentials

### Access Control
- Users can only access their own salon's data
- API returns 403 Forbidden for unauthorized access
- Update/delete operations verify ownership

## 📊 API Endpoints

### Authentication

```javascript
// Register new salon
POST /auth/register-salon
{
  "name": "My Salon",
  "email": "owner@salon.com",
  "phone": "(555) 123-4567",
  "address": "123 Main St",
  "password": "secure_password"
}

// Login
POST /auth/login
{
  "email": "owner@salon.com",
  "password": "secure_password"
}
```

### Customers

```javascript
GET    /customers              // Get all customers
POST   /customers              // Add new customer
PUT    /customers/:id          // Update customer
DELETE /customers/:id          // Delete customer
```

### Subscriptions

```javascript
GET    /subscriptions/customer/:customerId    // Get customer subscriptions
POST   /subscriptions                         // Create subscription
POST   /subscriptions/:id/redeem              // Redeem visit
PUT    /subscriptions/visit/:visitId          // Update visit note
DELETE /subscriptions/visit/:visitId          // Delete visit
```

### Subscription Types (Packages)

```javascript
GET    /subscription-types     // Get all packages
POST   /subscription-types     // Create package
DELETE /subscription-types/:id // Delete package
```

## 🧪 Testing

### Quick Test (5 minutes)

1. **Create two salon accounts** with different emails
2. **Add customers** to each salon
3. **Verify isolation** - Each salon only sees their own customers
4. **Test packages** - Create different packages per salon
5. **Test subscriptions** - Assign packages and redeem visits

See [MULTI_TENANT_TESTING.md](./MULTI_TENANT_TESTING.md) for detailed scenarios.

### Run with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register-salon \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Salon",
    "email": "test@salon.com",
    "phone": "555-1234",
    "address": "123 St",
    "password": "pass123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@salon.com",
    "password": "pass123"
  }'

# Get customers (with auth token)
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🗂️ Project Structure

```
salon-app/
├── client/                       # React Frontend
│   ├── src/
│   │   ├── App.js               # Main app (LoginScreen, OwnerPortal)
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── server/                       # Express Backend
│   ├── schema.sql               # Database schema
│   ├── server.js                # Entry point
│   ├── middleware/
│   │   └── auth.js              # JWT & salon context
│   ├── routes/
│   │   ├── auth.js              # Registration & login
│   │   ├── customers.js         # Customer management
│   │   ├── subscriptions.js     # Subscriptions & visits
│   │   └── subscriptionTypes.js # Packages
│   ├── utils/
│   │   ├── db.js                # Database connection
│   │   ├── dataAccess.js        # Query helpers
│   │   └── sheets.js            # Utilities
│   ├── package.json
│   └── .env                     # Environment variables
│
├── QUICK_REFERENCE.md           # ⭐ Start here
├── MULTI_TENANT_IMPLEMENTATION.md
├── MULTI_TENANT_TESTING.md
├── MULTI_TENANT_SUMMARY.md
├── IMPLEMENTATION_CHECKLIST.md
└── README.md                    # This file
```

## 🔄 Technology Stack

### Frontend
- **React** - UI framework
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JSON Web Tokens (JWT)** - Authentication
- **bcryptjs** - Password hashing

## 📋 File Changes Summary

| File | Changes |
|------|---------|
| `schema.sql` | Added salons table, salon_id FKs |
| `middleware/auth.js` | Added salon context extraction |
| `routes/auth.js` | New /register-salon, updated /login |
| `routes/customers.js` | Added salon filtering |
| `routes/subscriptions.js` | Added salon verification |
| `routes/subscriptionTypes.js` | Added salon filtering |
| `client/src/services/api.js` | Added registerSalon() |
| `client/src/App.js` | Updated LoginScreen & SalonApp |

## ⚠️ Breaking Changes

If upgrading from single-tenant version:

- ❌ `/auth/register` endpoint removed
- ❌ `/auth/login` no longer accepts `role` parameter
- ❌ Email must be unique per-salon (not globally)
- ✅ All other endpoints work identically

## 🐛 Troubleshooting

### "Access denied" error
✅ This is **normal** - you're trying to access another salon's data
- Verify you're logged in as correct salon owner
- Check browser console to confirm salon_id

### "Cannot find database"
- Verify DATABASE_URL in server/.env
- Ensure PostgreSQL is running
- Create database: `createdb salon_tracker`
- Run schema: `psql -d salon_tracker -f schema.sql`

### "Cannot connect to backend"
- Verify backend is running: `npm start` in /server
- Check PORT in server/.env (default: 5000)
- Verify REACT_APP_API_URL in client/.env

### "Email already exists"
✅ **Normal for same salon**
- Use different email if registering new salon
- Or try logging in instead of registering

## 📞 Support

1. **Check QUICK_REFERENCE.md** for common issues
2. **Review MULTI_TENANT_TESTING.md** for test scenarios
3. **See IMPLEMENTATION_CHECKLIST.md** for detailed status
4. **Browser console** shows frontend errors
5. **Server logs** show backend errors

## ✅ Deployment Checklist

- [ ] Database schema updated with new schema.sql
- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] All tests pass (see MULTI_TENANT_TESTING.md)
- [ ] Security review completed
- [ ] Performance tested
- [ ] Error handling verified
- [ ] Monitoring setup

## 📝 License

This project is part of the Salon Tracker application.

## 🎯 Next Steps

1. **Read** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. **Test** with [MULTI_TENANT_TESTING.md](./MULTI_TENANT_TESTING.md)
3. **Deploy** using [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
4. **Monitor** for issues and feedback

---

**Version**: 2.0 (Multi-Tenant)  
**Status**: ✅ Ready for Testing  
**Last Updated**: 2024

## Quick Links

- 🚀 [Quick Reference Guide](./QUICK_REFERENCE.md)
- 🏗️ [Implementation Details](./MULTI_TENANT_IMPLEMENTATION.md)
- 🧪 [Testing Guide](./MULTI_TENANT_TESTING.md)
- ✅ [Checklist](./IMPLEMENTATION_CHECKLIST.md)
- 📊 [Summary](./MULTI_TENANT_SUMMARY.md)

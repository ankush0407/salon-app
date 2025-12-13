# Clerk Passwordless Login Setup Guide

## Overview
This document provides step-by-step instructions to set up passwordless login (Email OTP) for the Customer Portal using Clerk.

---

## Prerequisites
- Clerk account (https://clerk.com)
- PostgreSQL database with `customers` table
- Node.js backend and React frontend running locally or deployed

---

## Part 1: Clerk Account Setup

### 1. Create a Clerk Application
1. Go to https://dashboard.clerk.com
2. Sign up or log in
3. Create a new application
4. Choose "Email Code" as your authentication method (this enforces passwordless Email OTP)

### 2. Get Your Keys
In your Clerk dashboard:
- Find **API Keys** section
- Copy your:
  - **Publishable Key** (for frontend)
  - **Secret Key** (for backend)

---

## Part 2: Backend Configuration

### 1. Environment Variables
Add these to your `.env` file in the `server/` directory:

```env
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

### 2. Database Migration
Run this SQL on your PostgreSQL database to add the `clerk_user_id` column:

```sql
ALTER TABLE customers 
ADD COLUMN clerk_user_id VARCHAR(255);
```

Or if starting fresh, the schema already includes:
```sql
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
```

### 3. Files Created/Updated

**New Files:**
- `server/middleware/clerk-auth.js` - Clerk authentication middleware
- `server/routes/customer.js` - Customer portal routes (requires Clerk auth)

**Updated Files:**
- `server/server.js` - Registered new customer routes

### 4. Backend Endpoints

#### GET `/api/customer/me`
Returns authenticated customer's profile and subscriptions

**Request Headers:**
```
Authorization: Bearer {clerkSessionToken}
```

**Response (200):**
```json
{
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "joinDate": "2024-01-01",
    "salonId": 5
  },
  "subscriptions": [
    {
      "id": 10,
      "name": "10-Visit Hair Package",
      "price": "99.99",
      "startDate": "2024-01-15",
      "isActive": true,
      "totalVisits": 10,
      "usedVisits": 3,
      "remainingVisits": 7
    }
  ]
}
```

**Response (404):**
```json
{
  "message": "No customer found with this email",
  "email": "test@example.com"
}
```

#### GET `/api/customer/subscriptions`
Returns just the subscription list with detailed visit information

**Request Headers:**
```
Authorization: Bearer {clerkSessionToken}
```

**Response (200):**
```json
{
  "subscriptions": [
    {
      "id": 10,
      "name": "10-Visit Hair Package",
      "totalVisits": 10,
      "usedVisits": 3,
      "remainingVisits": 7,
      "visits": [
        {
          "id": 45,
          "date": "2024-01-15",
          "note": "Cut and color"
        },
        {
          "id": 46,
          "date": "2024-02-01",
          "note": null
        }
      ]
    }
  ]
}
```

---

## Part 3: Frontend Configuration

### 1. Environment Variables
Add these to your `.env` file in the `client/` directory:

```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
REACT_APP_API_URL=http://localhost:5000/api
```

For production:
```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
REACT_APP_API_URL=https://your-backend-url/api
```

### 2. Files Created/Updated

**New Files:**
- `client/src/components/CustomerPortal.js` - Customer login and subscription portal

**Updated Files:**
- `client/src/index.js` - Wrapped app with ClerkProvider

### 3. Integration Steps

#### Update App.js to Include Customer Portal
Add this logic to route between owner and customer portals:

```javascript
import { useAuth, useUser } from '@clerk/clerk-react';
import { CustomerLoginScreen, CustomerPortalApp } from './components/CustomerPortal';

function YourAppComponent() {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  
  // Check if user is a Clerk-authenticated customer
  const isClerkAuth = isSignedIn && clerkUser;
  
  // If Clerk auth, show customer portal
  if (isClerkAuth) {
    return (
      <CustomerPortalApp 
        clerkUser={clerkUser}
        onLogout={() => {
          // Handle logout - clerkUser will automatically be cleared
        }}
      />
    );
  }
  
  // Otherwise show owner login
  return <LoginScreen onLogin={handleLogin} />;
}
```

---

## Part 4: Testing the Implementation

### Test Scenario 1: New Customer (Not in DB)
1. Start frontend: `npm start` in `client/`
2. Start backend: `npm run dev` in `server/`
3. Click on "Customer Login"
4. Enter an email NOT in your customers table
5. Expected: "No customer found" error message

### Test Scenario 2: Existing Customer (In DB)
1. Manually add a customer to your DB:
   ```sql
   INSERT INTO customers (salon_id, name, email, phone, join_date)
   VALUES (1, 'Test Customer', 'test@example.com', '555-0000', '2024-01-01');
   ```
2. Go to Customer Login
3. Enter `test@example.com`
4. Receive OTP code via email
5. Enter OTP code
6. Expected: Customer portal loads with subscriptions

### Test Scenario 3: Verify clerk_user_id Updates
1. After successful login, check the database:
   ```sql
   SELECT id, email, clerk_user_id FROM customers WHERE email = 'test@example.com';
   ```
2. Expected: `clerk_user_id` is now populated with the Clerk user ID

---

## Part 5: Clerk Configuration Details

### Passwordless Email OTP Configuration
In your Clerk dashboard:
1. Go to **Authentication** → **Email**
2. Ensure **Email Code** is enabled
3. Disable **Password** to enforce passwordless login
4. Optional: Configure email verification settings

### Allowed Redirect URIs
In your Clerk dashboard, add your frontend URLs:
- Local: `http://localhost:3000`
- Production: `https://yourdomain.com`

---

## Environment Variables Summary

### Backend (server/.env)
```
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Frontend (client/.env)
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Architecture Overview

### Customer Login Flow
```
1. Customer opens app
2. Shown Clerk SignIn component (Email OTP only)
3. Customer enters email
4. Clerk sends OTP to email
5. Customer enters OTP
6. Clerk verifies and creates session
7. Frontend calls GET /api/customer/me with Clerk token
8. Backend verifies token with Clerk
9. Backend queries customers table by email
10. If found: Updates clerk_user_id, returns profile + subscriptions
11. If not found: Returns 404 error
```

### Data Flow
```
Customer's Email
    ↓
Clerk Authentication (Email OTP)
    ↓
Session Token
    ↓
Backend Middleware (requireClerkAuth)
    ↓
Query customers table by email
    ↓
Save clerk_user_id for faster lookups
    ↓
Return customer profile + subscriptions
```

---

## Troubleshooting

### Issue: "Missing Clerk Publishable Key"
- Check `.env` file has `REACT_APP_CLERK_PUBLISHABLE_KEY`
- Restart React dev server after adding env var

### Issue: "Authentication failed" on backend
- Verify `CLERK_SECRET_KEY` in server `.env`
- Check Clerk API is accessible
- Ensure token format is `Bearer {token}`

### Issue: "No customer found with this email"
- Verify customer exists in database with matching email
- Check email case sensitivity
- Add customer manually if needed

### Issue: "clerk_user_id not updating"
- Ensure database migration was run
- Check database has `clerk_user_id` column
- Verify no database permission issues

---

## Security Considerations

1. **CORS**: Backend CORS is configured for localhost:3000
   - Update in `server.js` for production domains

2. **Token Validation**: Every request to `/api/customer/*` requires Clerk token
   - Tokens are verified with Clerk's API
   - Invalid tokens return 401 Unauthorized

3. **Per-Salon Data**: Customers are still scoped to salons
   - Each customer is linked to salon_id
   - No cross-salon data leakage

4. **Email Verification**: Clerk handles email verification
   - Only valid emails that own the email address can log in

---

## Next Steps

1. Set up Clerk account and get keys
2. Add environment variables to `.env` files
3. Run database migration for `clerk_user_id` column
4. Update `App.js` to route to customer portal
5. Test login flow with test customer
6. Deploy to production with production Clerk keys

---

## Support

For Clerk-specific issues: https://clerk.com/docs
For this implementation: Check the component code and middleware


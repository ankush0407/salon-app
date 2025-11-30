# Multi-Tenant Implementation - Quick Reference

## What Changed?

### The App Now Supports Multiple Salon Owners
Each salon owner has their own separate account with complete data isolation.

## Key Files Modified

```
Backend:
  schema.sql                    ← Database schema (added salons table)
  middleware/auth.js            ← JWT salon context extraction
  routes/auth.js                ← Registration and login
  routes/customers.js           ← Salon filtering on customers
  routes/subscriptions.js       ← Salon filtering on subscriptions
  routes/subscriptionTypes.js   ← Salon filtering on packages

Frontend:
  client/src/services/api.js    ← API endpoints
  client/src/App.js             ← LoginScreen and SalonApp components
```

## How to Register New Salon

1. Visit http://localhost:3000
2. Click "Don't have an account? Register"
3. Fill in:
   - Salon Name
   - Phone
   - Address
   - Email (must be unique globally for registration)
   - Password
4. Click "Create Account"
5. Redirects to Owner Portal for that salon

## How to Login

1. Click "Sign In"
2. Enter Email + Password
3. Click "Sign In"
4. Redirects to Owner Portal for that salon

## Testing Data Isolation

### Quick Test
```
1. Create "Salon A" with owner@a.com
2. Create "Salon B" with owner@b.com
3. Add customers in Salon A
4. Login to Salon B
5. Verify NO customers from Salon A visible
```

## API Endpoints

### Changed Endpoints

**Registration** (NEW)
```
POST /auth/register-salon
{
  "name": "Salon Name",
  "email": "owner@salon.com",
  "phone": "(555) 123-4567",
  "address": "123 Main St",
  "password": "password"
}
Response: { token, user, salon_id, salon_name }
```

**Login** (CHANGED - no more role parameter)
```
POST /auth/login
{
  "email": "owner@salon.com",
  "password": "password"
}
Response: { token, user, salon_id, salon_name }
```

### Unchanged Endpoints (Data filtered by salon automatically)
```
GET    /customers                    → Only current salon's customers
POST   /customers                    → Create customer for current salon
PUT    /customers/:id                → Update customer (with ownership check)
DELETE /customers/:id                → Delete customer (with ownership check)

GET    /subscriptions/customer/:id   → Only current salon's subscriptions
POST   /subscriptions                → Create subscription (with ownership check)
POST   /subscriptions/:id/redeem     → Redeem visit (with ownership check)
PUT    /subscriptions/visit/:visitId → Update visit (with ownership check)
DELETE /subscriptions/visit/:visitId → Delete visit (with ownership check)

GET    /subscription-types           → Only current salon's types
POST   /subscription-types           → Create type for current salon
DELETE /subscription-types/:id       → Delete type (with ownership check)
```

## Database Schema Changes

### New Table: salons
```sql
CREATE TABLE salons (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### Updated Tables (added salon_id)
```sql
ALTER TABLE users ADD COLUMN salon_id INT REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN salon_id INT REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE subscription_types ADD COLUMN salon_id INT REFERENCES salons(id) ON DELETE CASCADE;

-- Email uniqueness changed from global to per-salon
ALTER TABLE users ADD CONSTRAINT unique_email_per_salon UNIQUE(salon_id, email);
ALTER TABLE customers ADD CONSTRAINT unique_customer_email UNIQUE(salon_id, email);
ALTER TABLE subscription_types ADD CONSTRAINT unique_type_name UNIQUE(salon_id, name);
```

## JWT Token Content

Old:
```javascript
{ id, email, role }
```

New:
```javascript
{ id, email, role, salon_id }
```

## Code Examples

### How It Works: Getting Customer Data

```javascript
// Frontend makes request with JWT
GET /api/customers
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Backend middleware
const user = jwt.verify(token, secret);
req.salonId = user.salon_id;  // Extracts salon_id = 1

// Route handler
db.query('SELECT * FROM customers WHERE salon_id = $1', [req.salonId])
// Only returns customers for salon_id = 1
```

### How It Works: Preventing Cross-Salon Access

```javascript
// User tries to delete customer from different salon
DELETE /api/customers/42
(Customer 42 belongs to salon_id = 2, user's salon_id = 1)

// Backend verification
const { rows } = await db.query(
  'SELECT id FROM customers WHERE id = $1 AND salon_id = $2',
  [42, 1]  // req.salonId = 1
);

// Query returns empty (no match)
if (rows.length === 0) {
  return res.status(403).json({ message: 'Access denied' });
}
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Access denied" | Accessing other salon's data | ✅ Expected! Try logging in to correct salon |
| "Email already exists" | Email used in same salon | Use different email |
| "Subscription not found" | Subscription belongs to other salon | Login to correct salon |
| "401 Unauthorized" | Invalid/expired JWT | Log out and log back in |
| "Cannot find module" | Missing npm install | Run `npm install` in both client and server |

## Environment Variables

No new environment variables needed! Same as before:

**Backend (.env)**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=5000
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Testing Commands

### Start Backend
```bash
cd server
npm install  # If first time
npm start    # or nodemon server.js
```

### Start Frontend
```bash
cd client
npm install  # If first time
npm start
```

### Test with cURL

```bash
# Register salon
curl -X POST http://localhost:5000/api/auth/register-salon \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Salon",
    "email": "test@salon.com",
    "phone": "555-1234",
    "address": "123 St",
    "password": "pass123"
  }'

# Response includes salon_id
# {"token": "...", "user": {...}, "salon_id": 1, "salon_name": "Test Salon"}

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@salon.com",
    "password": "pass123"
  }'

# Get customers (with auth token)
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer TOKEN_HERE"
```

## Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| Multiple Owners | ❌ | ✅ |
| Data Isolation | ❌ | ✅ |
| Shared Email | ❌ | ✅ |
| Registration | One-time setup | Per-owner |
| Login | Global users | Per-salon owner |
| Customers | All visible | Salon-specific |
| Packages | Global | Per-salon |
| Subscriptions | Mixed | Salon-specific |
| Visits | Mixed | Isolated |

## Troubleshooting Quick Guide

**Frontend won't compile?**
```bash
cd client
npm install
npm start
```

**Backend won't start?**
```bash
cd server
npm install
node server.js  # Check for errors
```

**Database error?**
```bash
# Verify connection string in .env
# Verify database exists
# Run schema.sql
```

**Can't register?**
- Check all fields filled
- Email must be unique globally
- Check backend logs for error

**Can't login?**
- Verify email/password correct
- Try deleting localStorage and reload
- Check backend is running

**Data from wrong salon?**
- Clear browser localStorage
- Log out completely
- Log back in

## Performance Notes

- Indexes added on all salon_id fields for fast queries
- JWT keeps salon context in token (no DB lookup needed)
- Cascading deletes prevent orphaned records
- Per-salon email uniqueness prevents collisions

## Security Checklist

✅ **Implemented**
- Salon context in JWT
- Middleware enforces salon access
- All queries filtered by salon_id
- Ownership verification on updates/deletes
- Cascading deletes prevent orphaned records
- No raw SQL injection (parameterized queries)
- Email unique per-salon
- Password hashing (bcryptjs)

## Next Steps

1. **Run Tests** → Follow MULTI_TENANT_TESTING.md
2. **Deploy** → Update database with new schema
3. **Monitor** → Watch for access denied errors (expected)

## Questions?

1. See MULTI_TENANT_IMPLEMENTATION.md for technical details
2. See MULTI_TENANT_TESTING.md for test scenarios
3. Check browser console (frontend issues)
4. Check server logs (backend issues)
5. Review IMPLEMENTATION_CHECKLIST.md for reference

---

**Status**: ✅ Ready for Testing
**Date**: 2024

# Clerk Integration - Quick Reference & Developer Guide

## 🎯 What You Got

A complete passwordless authentication system for your Customer Portal using Clerk with Email OTP.

### Key Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `server/middleware/clerk-auth.js` | NEW | Verifies Clerk tokens on backend |
| `server/routes/customer.js` | NEW | Customer data endpoints (Clerk-protected) |
| `client/src/components/CustomerPortal.js` | NEW | Login + subscription portal UI |
| `server/server.js` | MODIFIED | Registered new customer routes |
| `server/schema.sql` | MODIFIED | Added `clerk_user_id` column |
| `client/src/index.js` | MODIFIED | Wrapped app with ClerkProvider |
| `CLERK_PASSWORDLESS_SETUP.md` | NEW | Complete setup instructions |
| `CLERK_IMPLEMENTATION_GUIDE.md` | NEW | API docs + testing guide |

---

## 🔐 How It Works

### Customer Login Process
1. Customer visits app → sees Clerk login (Email OTP only)
2. Customer enters email → Clerk sends OTP
3. Customer enters OTP → Clerk creates session
4. Frontend gets Clerk token
5. Frontend calls `/api/customer/me` with token
6. Backend verifies token with Clerk
7. Backend finds customer in PostgreSQL by email
8. Backend saves `clerk_user_id` for next time
9. Backend returns customer profile + subscriptions
10. Frontend displays subscription portal

### Why This Approach?
- ✅ **Secure**: Clerk handles all auth, customer data stays in your DB
- ✅ **Simple**: Customers don't manage passwords
- ✅ **Fast**: clerk_user_id enables quick lookups on future logins
- ✅ **Linked**: Customers created by salon owners are used by Clerk without duplication

---

## 📝 Integration Checklist

### 1. Get Clerk Keys
- [ ] Create account at https://clerk.com
- [ ] Create new application
- [ ] Select "Email Code" auth method (forces OTP only)
- [ ] Copy Publishable Key (frontend)
- [ ] Copy Secret Key (backend)

### 2. Environment Variables
```bash
# server/.env
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# client/.env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Database Migration
```sql
-- Run on your PostgreSQL instance
ALTER TABLE customers ADD COLUMN clerk_user_id VARCHAR(255);
```

### 4. Update App.js
Add routing logic to show Customer Portal OR Owner Portal:
```javascript
import { useAuth, useUser } from '@clerk/clerk-react';
import { CustomerLoginScreen, CustomerPortalApp } from './components/CustomerPortal';

// In main App component
const { isSignedIn } = useAuth();
const { user: clerkUser } = useUser();

// Show customer portal if Clerk auth
if (isSignedIn && clerkUser) {
  return <CustomerPortalApp clerkUser={clerkUser} onLogout={() => {}} />;
}

// Show owner portal (existing login)
if (currentUser && userRole === 'OWNER') {
  return <OwnerPortal {...props} />;
}

// Show login screen
return <LoginScreen onLogin={handleLogin} />;
```

### 5. Test
- [ ] Login as non-existent customer (expect error)
- [ ] Login as existing customer (expect portal)
- [ ] Check `clerk_user_id` updated in DB
- [ ] Logout and login again

---

## 💻 Running Locally

```bash
# Terminal 1: Backend
cd server
npm run dev
# Server starts on http://localhost:5000

# Terminal 2: Frontend
cd client
npm start
# App opens at http://localhost:3000
```

### Test URLs
- Owner login: `http://localhost:3000` (existing flow)
- Customer login: Add button/link to show customer portal

---

## 🧪 Quick Test Commands

### Test 1: Check Backend Running
```bash
curl http://localhost:5000/api/health
# or
curl http://localhost:5000
# Should return: {"message":"Salon API is running"}
```

### Test 2: Verify Database Connection
```bash
# In server directory
node -e "const db = require('./utils/db'); db.query('SELECT 1').then(() => console.log('Connected')).catch(e => console.log(e))"
```

### Test 3: Verify Clerk Middleware
```javascript
// In server/routes/customer.js, middleware is applied:
router.get('/me', requireClerkAuth, async (req, res) => {
  // requireClerkAuth verifies token before this runs
});
```

---

## 🔍 What Each Component Does

### `CustomerPortal.js`
- **CustomerLoginScreen**: Clerk SignIn component
- **CustomerPortalApp**: Main portal after login
  - Fetches `/api/customer/me` on load
  - Displays subscriptions
  - Shows visit history
  - Handles logout

### `clerk-auth.js` Middleware
```javascript
requireClerkAuth(req, res, next)
// 1. Gets token from Authorization header
// 2. Verifies token with Clerk API
// 3. Extracts user email and ID
// 4. Adds req.clerkUser = { id, email }
// 5. Calls next() to proceed to route
```

### `/api/customer/me` Endpoint
```javascript
1. Get email from req.clerkUser (verified by middleware)
2. Query: SELECT * FROM customers WHERE email = ?
3. If not found: return 404
4. If found:
   - Update: clerk_user_id = clerkUser.id
   - Query: SELECT subscriptions WHERE customer_id = ?
   - Return: { customer, subscriptions }
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  CUSTOMER SIDE                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Customer Opens App                                     │
│         ↓                                               │
│  <CustomerLoginScreen>                                  │
│    (Clerk <SignIn /> - Email OTP)                       │
│         ↓                                               │
│  Customer enters email & OTP                            │
│         ↓                                               │
│  Clerk creates session                                  │
│         ↓                                               │
│  <CustomerPortalApp>                                    │
│    (calls GET /api/customer/me)                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
              Backend receives request
                        ↓
┌─────────────────────────────────────────────────────────┐
│  BACKEND SIDE                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  GET /api/customer/me                                   │
│         ↓                                               │
│  requireClerkAuth Middleware                            │
│    - Get Authorization: Bearer token                    │
│    - Verify with Clerk API                              │
│    - Extract email & user_id                            │
│         ↓                                               │
│  Route Handler                                          │
│    - Query: SELECT * FROM customers WHERE email = ?    │
│    - If not found: return 404                           │
│    - If found:                                          │
│      * UPDATE clerk_user_id                             │
│      * Query subscriptions                              │
│      * Query visits per subscription                    │
│    - Return customer + subscriptions                    │
│         ↓                                               │
│  Response to Frontend                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
        Frontend receives customer data
                        ↓
      <CustomerPortalApp> renders subscriptions
```

---

## 🐛 Debugging Tips

### Issue: "Missing Clerk Publishable Key"
**Solution:**
- Check `client/.env` has `REACT_APP_CLERK_PUBLISHABLE_KEY`
- Restart React dev server after updating .env
- Make sure no typos in key name

### Issue: "Authentication failed" on backend
**Solution:**
- Check `server/.env` has `CLERK_SECRET_KEY`
- Make sure Clerk account is active
- Test Clerk keys are not rotated/invalidated
- Check network connectivity to Clerk API

### Issue: "No customer found" error
**Solution:**
- Verify email in database matches email in Clerk
- Email comparison is case-sensitive
- Check customer exists: `SELECT * FROM customers WHERE email = 'test@example.com';`
- Manually add customer if needed

### Issue: clerk_user_id not updating
**Solution:**
- Check database migration ran: `ALTER TABLE customers ADD COLUMN clerk_user_id VARCHAR(255);`
- Verify column exists: `\d customers` (PostgreSQL)
- Check no permission issues updating database
- Verify UPDATE query runs (check logs)

### Issue: Token verification fails
**Solution:**
- Make sure token format is `Bearer {token}`
- Check Authorization header is being sent
- Verify Clerk token isn't expired
- Check Clerk Secret Key matches your application

---

## 🚀 Production Checklist

Before deploying:

- [ ] Update `REACT_APP_CLERK_PUBLISHABLE_KEY` in `.env` with production key
- [ ] Update `CLERK_SECRET_KEY` in `server/.env` with production key
- [ ] Add production domain to Clerk dashboard under "Allowed URLs"
- [ ] Update `REACT_APP_API_URL` to production backend URL
- [ ] Run database migration on production database
- [ ] Test customer login flow end-to-end
- [ ] Monitor Clerk dashboard for errors
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Enable HTTPS on frontend and backend
- [ ] Update CORS origins in `server.js` for production domain

---

## 📞 When Something Goes Wrong

### Check These First
1. **Are both servers running?**
   - Backend: `npm run dev` in `server/`
   - Frontend: `npm start` in `client/`

2. **Are environment variables set?**
   - Frontend: `REACT_APP_CLERK_PUBLISHABLE_KEY`
   - Backend: `CLERK_SECRET_KEY`, `DATABASE_URL`
   - Restart dev servers after adding .env variables

3. **Is database migration done?**
   - `ALTER TABLE customers ADD COLUMN clerk_user_id VARCHAR(255);`

4. **Is customer in database?**
   - `SELECT * FROM customers WHERE email = 'test@email.com';`

### Get Logs
```bash
# Backend logs
# Check terminal where you ran `npm run dev`

# Frontend logs
# Check browser console (F12)

# Clerk logs
# Go to https://dashboard.clerk.com → Logs
```

### Test Manually
```bash
# 1. Test backend is running
curl http://localhost:5000

# 2. Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# 3. Test Clerk keys
# Just try login flow in Clerk

# 4. Test endpoint with real Clerk token
curl -H "Authorization: Bearer {clerkSessionToken}" \
  http://localhost:5000/api/customer/me
```

---

## 🎓 Learning Resources

### Understanding the Code
1. Start with `customer.js` (routes) - easy to understand
2. Then read `clerk-auth.js` (middleware) - see how auth works
3. Then review `CustomerPortal.js` (frontend) - see how UI calls backend

### Clerk Documentation
- https://clerk.com/docs
- https://clerk.com/docs/reference/backend-api
- https://clerk.com/docs/reference/frontend-api

### PostgreSQL Queries
- Check customers: `SELECT * FROM customers LIMIT 5;`
- Check subscriptions: `SELECT * FROM subscriptions LIMIT 5;`
- Check visits: `SELECT * FROM visits LIMIT 5;`

---

## ✅ All Done!

You now have:
- ✅ Passwordless Email OTP authentication
- ✅ Clerk integration on frontend and backend
- ✅ Customer portal showing subscriptions
- ✅ Automatic clerk_user_id tracking
- ✅ Full documentation and guides
- ✅ Testing scenarios and debugging help

**Next: Follow the checklist above to set up Clerk account and environment variables, then test!**

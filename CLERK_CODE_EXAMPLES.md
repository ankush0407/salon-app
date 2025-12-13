# Code Examples & Integration Patterns

## Integration with Existing App.js

Here's how to integrate the Customer Portal into your existing `App.js`:

### Option 1: Route Based on Authentication Type

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { LoginScreen } from './components/LoginScreen'; // Existing owner login
import { OwnerPortal } from './components/OwnerPortal'; // Existing owner portal
import { CustomerLoginScreen, CustomerPortalApp } from './components/CustomerPortal'; // NEW

export default function App() {
  // Existing owner auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [salonId, setSalonId] = useState(null);
  const [salonName, setSalonName] = useState(null);

  // Clerk authentication (for customers)
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();

  // Load owner session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      setUserRole(parsedUser.role);
      setSalonId(parsedUser.salon_id);
      setSalonName(parsedUser.salon_name);
    }
  }, []);

  const handleOwnerLogin = (role, user, salId, salName) => {
    setUserRole(role);
    setCurrentUser(user);
    setSalonId(salId);
    setSalonName(salName);
  };

  const handleOwnerLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('salon_id');
    localStorage.removeItem('salon_name');
    setCurrentUser(null);
    setUserRole(null);
    setSalonId(null);
    setSalonName(null);
  };

  const handleCustomerLogout = () => {
    // Clerk handles logout automatically
    // Just clear any local state if needed
  };

  // If Clerk is still loading, show loading state
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Priority 1: Clerk-authenticated customer
  if (isSignedIn && clerkUser) {
    return (
      <CustomerPortalApp 
        clerkUser={clerkUser}
        onLogout={handleCustomerLogout}
      />
    );
  }

  // Priority 2: Owner-authenticated user
  if (currentUser && userRole === 'OWNER') {
    return (
      <OwnerPortal
        // ... existing props
        onLogout={handleOwnerLogout}
      />
    );
  }

  // Show login screen with choice between owner and customer
  return <LoginPage onOwnerLogin={handleOwnerLogin} />;
}

/**
 * LoginPage Component
 * Shows both Owner and Customer login options
 */
function LoginPage({ onOwnerLogin }) {
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);

  if (showCustomerLogin) {
    return <CustomerLoginScreen onLoginSuccess={onOwnerLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Salon Tracker</h1>
          <p className="text-gray-600 mt-2">Choose Your Portal</p>
        </div>

        {/* Owner Portal Button */}
        <button
          onClick={() => {/* Show owner login */}}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Salon Owner Login
        </button>

        {/* Customer Portal Button */}
        <button
          onClick={() => setShowCustomerLogin(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Customer Login
        </button>

        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Owners: Use your salon account</p>
          <p>Customers: Login with your email for OTP</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Backend Endpoint Usage Examples

### Using Clerk Token in Frontend

```javascript
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { getToken } = useAuth();

  const fetchCustomerData = async () => {
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/customer/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Customer:', data.customer);
        console.log('Subscriptions:', data.subscriptions);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
  };

  return <button onClick={fetchCustomerData}>Load Data</button>;
}
```

### Manual API Call with Fetch

```javascript
// Get Clerk token first (inside a Clerk-protected component)
const token = await auth.getToken();

// Call endpoint
const response = await fetch('http://localhost:5000/api/customer/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();

if (response.status === 404) {
  console.log('Customer not found');
} else if (response.ok) {
  console.log('Customer found:', data.customer);
  console.log('Subscriptions:', data.subscriptions);
}
```

---

## Backend: Understanding the Middleware

### How Clerk Token Verification Works

```javascript
// server/middleware/clerk-auth.js

async function requireClerkAuth(req, res, next) {
  try {
    // Step 1: Extract token from header
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    // Result: "sess_xxxxx"

    if (!sessionToken) {
      return res.status(401).json({ message: 'Missing session token' });
    }

    // Step 2: Verify token with Clerk's API
    const session = await clerk.sessions.getSession(sessionToken);
    // Clerk API validates signature and expiration
    // Returns: { userId: "user_xxxxx", ... }

    if (!session || !session.userId) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // Step 3: Get user details from Clerk
    const user = await clerk.users.getUser(session.userId);
    // Returns: { id, emailAddresses: [{ emailAddress: 'test@example.com' }], ... }

    // Step 4: Extract email
    const email = user.emailAddresses?.[0]?.emailAddress;

    // Step 5: Attach to request
    req.clerkUser = {
      id: user.id,              // "user_xxxxx"
      email: email,              // "test@example.com"
    };

    // Step 6: Continue to next middleware/route
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = { requireClerkAuth };
```

---

## Database Schema Updates

### Migration Script

```javascript
// server/migrations/add-clerk-user-id.js
const db = require('../utils/db');

async function migrate() {
  try {
    console.log('Adding clerk_user_id column...');
    
    await db.query(`
      ALTER TABLE customers 
      ADD COLUMN clerk_user_id VARCHAR(255)
    `);
    
    console.log('✅ Migration successful');
  } catch (error) {
    if (error.message.includes('column "clerk_user_id" of relation "customers" already exists')) {
      console.log('✅ Column already exists, skipping');
    } else {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;
```

Run migration:
```bash
node server/migrations/add-clerk-user-id.js
```

---

## Testing with cURL

### Test 1: Verify Backend is Running

```bash
curl http://localhost:5000
# Expected: {"message":"Salon API is running"}
```

### Test 2: Test with Real Clerk Token

```bash
# First get a token from your app by signing in
# Then use it in curl:

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/customer/me

# Expected: Customer data or 404
```

### Test 3: Test Invalid Token

```bash
curl -H "Authorization: Bearer invalid.token.here" \
  http://localhost:5000/api/customer/me

# Expected: {"message":"Authentication failed"}
```

---

## Error Handling

### Common Error Responses

```javascript
// 401 - No token
{
  "message": "Missing session token"
}

// 401 - Invalid/expired token
{
  "message": "Invalid or expired session"
}

// 404 - Customer not found
{
  "message": "No customer found with this email",
  "email": "test@example.com"
}

// 400 - Email missing from Clerk
{
  "message": "Email not found in Clerk session"
}

// 500 - Server error
{
  "message": "Failed to fetch customer profile"
}
```

### Frontend Error Handling

```javascript
const handleError = (response) => {
  if (response.status === 401) {
    // Token expired or invalid
    // User should re-authenticate
    return 'Please sign in again';
  }
  
  if (response.status === 404) {
    // Customer not in database
    return 'No customer account found with this email';
  }
  
  if (response.status === 500) {
    // Server error
    return 'Server error. Please try again later';
  }
  
  return 'Something went wrong';
};
```

---

## Advanced: Caching Customer Data

```javascript
// client/src/hooks/useCustomerData.js
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Custom hook to fetch and cache customer data
 */
export function useCustomerData() {
  const { getToken, isSignedIn } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = sessionStorage.getItem('customerData');
    if (cached) {
      const data = JSON.parse(cached);
      setCustomer(data.customer);
      setSubscriptions(data.subscriptions);
      setLoading(false);
      return;
    }

    // Fetch from backend
    const fetchData = async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/customer/me`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setCustomer(data.customer);
        setSubscriptions(data.subscriptions);

        // Cache for 5 minutes
        sessionStorage.setItem(
          'customerData',
          JSON.stringify(data)
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, getToken]);

  return { customer, subscriptions, loading, error };
}

// Usage
function MyComponent() {
  const { customer, subscriptions, loading, error } = useCustomerData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Welcome, {customer.name}</h1>
      <ul>
        {subscriptions.map(sub => (
          <li key={sub.id}>{sub.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Security Best Practices

### Never Do This ❌

```javascript
// DON'T store tokens in localStorage
localStorage.setItem('clerkToken', token);

// DON'T expose Clerk secret key in frontend
const CLERK_SECRET_KEY = "sk_test_xxxxx"; // WRONG!

// DON'T skip token verification
app.get('/api/customer/me', (req, res) => {
  // Missing requireClerkAuth middleware!
  // Anyone can call this
});

// DON'T trust email from request body
app.post('/api/customer', (req, res) => {
  const email = req.body.email; // User could fake this
  // Always get email from verified token instead
});
```

### Always Do This ✅

```javascript
// DO let Clerk manage tokens
const { getToken } = useAuth();
const token = await getToken(); // Fresh token, auto-refreshed

// DO keep secret key in backend .env
// server/.env
CLERK_SECRET_KEY=sk_test_xxxxx

// DO verify token on every protected route
app.get('/api/customer/me', requireClerkAuth, (req, res) => {
  const email = req.clerkUser.email; // From verified token
  // Safe to use!
});

// DO validate on backend
// Even if frontend checks, backend must too
app.post('/api/customer/data', requireClerkAuth, (req, res) => {
  const email = req.clerkUser.email; // From verified token
  const customerId = req.body.customerId;
  
  // Verify customer owns this data
  const customer = queryDB('SELECT id FROM customers WHERE id = ? AND email = ?', [customerId, email]);
  if (!customer) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
});
```

---

## Deployment Considerations

### Environment Variables Checklist

```bash
# Frontend (client/.env)
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx  # Use production key
REACT_APP_API_URL=https://api.yourdomain.com  # Use HTTPS

# Backend (server/.env)
CLERK_SECRET_KEY=sk_live_xxxxx                 # Use production key
DATABASE_URL=postgresql://...                  # Production database
JWT_SECRET=strong_random_secret                # Different from dev
NODE_ENV=production
```

### CORS Configuration

```javascript
// server/server.js
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Development
    'https://yourdomain.com',          // Production
    'https://app.yourdomain.com',      // Production subdomain
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### Database Considerations

- Ensure `clerk_user_id` column exists in production database
- Create index on `clerk_user_id` for fast lookups:
  ```sql
  CREATE INDEX idx_customers_clerk_user_id ON customers(clerk_user_id);
  ```
- Regular backups of customer data

---

## Monitoring & Logging

```javascript
// server/middleware/clerk-auth.js - Add logging
async function requireClerkAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      console.warn('AUTH: Missing token from', req.ip);
      return res.status(401).json({ message: 'Missing session token' });
    }

    const session = await clerk.sessions.getSession(sessionToken);
    const user = await clerk.users.getUser(session.userId);

    console.info('AUTH: User logged in', { 
      clerkUserId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      timestamp: new Date().toISOString(),
    });

    req.clerkUser = {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || null,
    };

    next();
  } catch (error) {
    console.error('AUTH: Error', {
      error: error.message,
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });
    return res.status(401).json({ message: 'Authentication failed' });
  }
}
```

Monitor:
- Failed authentication attempts
- Customer lookup failures (404s)
- Database update errors
- Clerk API errors

---

## Summary of Integration Points

| Component | Purpose | Key Function |
|-----------|---------|--------------|
| `ClerkProvider` | Wraps app, enables useAuth() | Provides session context |
| `<SignIn />` | Clerk UI for login | Handles OTP flow |
| `useAuth()` | Access auth state | Get tokens, check login status |
| `useUser()` | Get current user | Access email, profile |
| `requireClerkAuth` | Backend middleware | Verify tokens, extract email |
| `GET /api/customer/me` | Main endpoint | Return customer + subscriptions |
| `clerk_user_id` | Database column | Store Clerk user ID for lookups |

All components work together to create a seamless passwordless experience!

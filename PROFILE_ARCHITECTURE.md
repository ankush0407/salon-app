# Profile Page Architecture & Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             Profile.js Component                         │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Salon Details Section                           │   │   │
│  │  │  - Name, Phone, Email (editable)                │   │   │
│  │  │  - Image Upload with Preview                    │   │   │
│  │  │  - Save Button → PUT /api/profile               │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Subscription Card (Right Sidebar)               │   │   │
│  │  │  - Status Badge (Active/Inactive)               │   │   │
│  │  │  - Stripe Checkout Button                       │   │   │
│  │  │    → POST /api/profile/create-checkout-session  │   │   │
│  │  │    → Redirects to Stripe Checkout               │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Invoice History (Right Sidebar)                 │   │   │
│  │  │  - Invoice Table                                │   │   │
│  │  │  - GET /api/profile/invoices                   │   │   │
│  │  │  - Download Button                             │   │   │
│  │  │    → GET /api/profile/invoice/:id              │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↕ (HTTP Requests)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Authentication Middleware                              │   │
│  │  - authenticateToken (JWT verification)                │   │
│  │  - Extracts salon_id from JWT                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Profile Routes (routes/profile.js)                      │   │
│  │                                                          │   │
│  │  GET /api/profile                                       │   │
│  │  - Fetch salon details + subscription_status            │   │
│  │  - Returns: name, phone, email, image_url, status       │   │
│  │                                                          │   │
│  │  PUT /api/profile (with multer)                          │   │
│  │  - Update salon details                                 │   │
│  │  - Handle image upload to /uploads folder               │   │
│  │  - Save image URL in database                           │   │
│  │                                                          │   │
│  │  POST /api/profile/create-checkout-session              │   │
│  │  - Create Stripe Customer (if not exists)               │   │
│  │  - Create Stripe Checkout Session                       │   │
│  │  - Return checkout URL to frontend                      │   │
│  │                                                          │   │
│  │  GET /api/profile/invoices                              │   │
│  │  - Query Stripe API for customer's invoices             │   │
│  │  - Format and return invoice list                       │   │
│  │                                                          │   │
│  │  GET /api/profile/invoice/:invoiceId                    │   │
│  │  - Verify authorization                                 │   │
│  │  - Return invoice PDF URL from Stripe                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE (PostgreSQL)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Salons Table                                            │   │
│  │  ├── id (PRIMARY KEY)                                   │   │
│  │  ├── name                                               │   │
│  │  ├── email                                              │   │
│  │  ├── phone                                              │   │
│  │  ├── address                                            │   │
│  │  ├── salon_image_url ← Stores uploaded image path       │   │
│  │  ├── stripe_customer_id ← Links to Stripe customer     │   │
│  │  ├── subscription_status ← 'active' or 'inactive'       │   │
│  │  └── created_at                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  File Storage                                            │   │
│  │  ├── /uploads/                                          │   │
│  │  │   ├── 1702655400000.jpg (salon image)                │   │
│  │  │   └── ...                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Stripe API (https://api.stripe.com)                     │   │
│  │                                                          │   │
│  │  - Customers → Create/retrieve Stripe customer          │   │
│  │  - Checkout Sessions → Create subscription checkout     │   │
│  │  - Invoices → Fetch & download customer invoices        │   │
│  │  - Subscriptions → Manage subscription state             │   │
│  │                                                          │   │
│  │  Secret Key: sk_test_xxxxx (stored in server/.env)      │   │
│  │  Publishable Key: pk_test_xxxxx (frontend reference)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Salon Profile Update Flow

```
User fills form (name, phone, email)
    ↓
User selects image (optional)
    ↓
User clicks "Save Changes"
    ↓
Frontend: PUT /api/profile (with FormData)
    ↓
Backend: 
  - Verify JWT & extract salon_id
  - Validate inputs
  - If image: Save to /uploads/, get path
  - Update salons table in DB
    ↓
Database: UPDATE salons SET name, phone, email, salon_image_url
    ↓
Backend: Return updated salon object
    ↓
Frontend: 
  - Clear form
  - Show success message
  - Update local state
    ↓
User sees "✓ Profile updated successfully!"
```

---

### 2. Stripe Subscription Flow

```
User clicks "Pay/Subscribe Now"
    ↓
Frontend: POST /api/profile/create-checkout-session
    ↓
Backend:
  - Get salon data from DB
  - Check if stripe_customer_id exists
  - If not: Create Stripe Customer
  - Save stripe_customer_id to DB
  - Create Checkout Session with:
    - Product: "Salon Tracker Pro - Monthly"
    - Amount: $99/month
    - Type: Recurring subscription
    - Metadata: { salon_id }
    ↓
Stripe API: Create checkout session
    ↓
Backend: Return checkout session URL
    ↓
Frontend: window.location.href = checkout_url
    ↓
User: Redirected to Stripe Checkout
    ↓
User: Enters payment details
    ↓
Stripe: 
  - Charges card
  - Creates subscription
  - Sends webhook (optional)
    ↓
Success: Redirect to /success page
OR
Cancel: Redirect to /profile page
```

---

### 3. Invoice History Flow

```
Page loads / User navigates to Profile
    ↓
Frontend: GET /api/profile (for subscription status)
Frontend: GET /api/profile/invoices (for invoice list)
    ↓
Backend:
  - Get salon_id from JWT
  - Query: SELECT stripe_customer_id FROM salons
    ↓
If stripe_customer_id exists:
  - Call Stripe API: stripe.invoices.list({ customer: id })
  - Format response:
    * id, amount, date, status, url, pdfUrl
    ↓
Else:
  - Return empty array []
    ↓
Backend: Return formatted invoices array
    ↓
Frontend:
  - Display invoices in table
  - Show: Date | Amount | Status | Download button
    ↓
User: Clicks "Download" button
    ↓
Frontend: GET /api/profile/invoice/:invoiceId
    ↓
Backend:
  - Verify authorization
  - Get PDF URL from Stripe
  - Return pdfUrl
    ↓
Frontend: 
  - Open PDF in new window
  - OR trigger browser download
    ↓
User: Downloads/views PDF invoice
```

---

## 🔐 Security Flow

```
Frontend Request
    ↓
Include JWT in header: "Authorization: Bearer token..."
    ↓
Backend: authenticateToken middleware
    ↓
Verify JWT signature with JWT_SECRET
    ↓
Extract payload: { id, email, role, salon_id }
    ↓
Attach to request: req.salonId = salon_id
    ↓
Route Handler:
  - Use req.salonId to filter database queries
  - Only salon_id matches can access/modify data
    ↓
Response: Only data for req.salonId returned
    ↓
Result: Salon can only see/modify their own data
```

---

## 📊 Data Models

### Salons Table
```javascript
{
  id: 1,                          // Primary key
  name: "My Salon",               // Editable in Profile
  email: "owner@salon.com",       // Editable in Profile
  phone: "555-0123",              // Editable in Profile
  address: "123 Main St",         // For display
  salon_image_url: "/uploads/file.jpg",  // Updated on image upload
  stripe_customer_id: "cus_xxxxx",       // Created on first checkout
  subscription_status: "active",         // From Stripe webhook
  created_at: "2025-12-15T10:30:00Z",
  is_active: true
}
```

### Invoice Object (from Stripe)
```javascript
{
  id: "in_1234567890",            // Stripe invoice ID
  amount: 9900,                   // Amount in cents ($99.00)
  date: "2025-12-15T10:30:00Z",   // Created date
  status: "Paid",                 // Paid | Pending | Draft
  url: "https://invoice.stripe.com/...",     // Hosted invoice
  pdfUrl: "https://pay.stripe.com/invoice/.../pdf"  // PDF download
}
```

---

## 🎯 Component State

### Profile.js Local State
```javascript
// Form fields
const [salonName, setSalonName] = useState('');
const [phone, setPhone] = useState('');
const [email, setEmail] = useState('');

// Image
const [salonImage, setSalonImage] = useState(null);
const [imagePreview, setImagePreview] = useState('');
const [currentImageUrl, setCurrentImageUrl] = useState('');

// Subscription & Invoices
const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
const [invoices, setInvoices] = useState([]);

// UI State
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState({ type: '', text: '' });
const [loadingInvoices, setLoadingInvoices] = useState(false);
```

---

## 🚀 Deployment Considerations

### Production Checklist

- [ ] Update STRIPE_SECRET_KEY to live key (sk_live_...)
- [ ] Set FRONTEND_URL to production domain
- [ ] Update CORS origins in server.js
- [ ] Ensure /uploads directory exists and is writable
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (random, long string)
- [ ] Enable HTTPS for all Stripe requests
- [ ] Test complete checkout flow end-to-end
- [ ] Set up Stripe webhooks for subscription events
- [ ] Monitor Stripe dashboard for payment issues
- [ ] Set up email notifications for invoices
- [ ] Configure backup for uploaded images

---

## 📝 API Response Examples

### GET /api/profile Success
```json
{
  "id": 1,
  "name": "My Salon",
  "phone": "555-0123",
  "email": "owner@salon.com",
  "salon_image_url": "/uploads/1702655400000.jpg",
  "subscription_status": "active",
  "stripe_customer_id": "cus_xxxxx"
}
```

### POST /api/profile/create-checkout-session Success
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

### GET /api/profile/invoices Success
```json
[
  {
    "id": "in_1234567890",
    "amount": 9900,
    "date": "2025-12-15T10:30:00.000Z",
    "status": "Paid",
    "url": "https://invoice.stripe.com/i/xxxxx",
    "pdfUrl": "https://pay.stripe.com/invoice/xxxxx/pdf"
  },
  {
    "id": "in_0987654321",
    "amount": 9900,
    "date": "2025-11-15T10:30:00.000Z",
    "status": "Paid",
    "url": "https://invoice.stripe.com/i/yyyyy",
    "pdfUrl": "https://pay.stripe.com/invoice/yyyyy/pdf"
  }
]
```

---

**This architecture ensures:** ✅ Security | ✅ Scalability | ✅ Real-time Updates | ✅ Clean Separation of Concerns

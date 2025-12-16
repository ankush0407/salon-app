# Invoice API Response Format & Examples

This document shows exactly what the API returns so you know what to expect when testing.

---

## GET /api/profile - Profile Data

### Request
```
GET http://localhost:3000/api/profile
Headers: Authorization: Bearer [JWT_TOKEN]
```

### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Salon Beauty Pro",
  "phone": "555-123-4567",
  "email": "info@salonbeautypro.com",
  "salon_image_url": "/uploads/1702957823456.jpg",
  "subscription_status": "active",
  "stripe_customer_id": "cus_OnOFqNlXrJMpUp"
}
```

### Response Fields Explained
| Field | Type | Example | Meaning |
|-------|------|---------|---------|
| `id` | UUID | "550e8400-..." | Unique salon identifier |
| `name` | String | "Salon Beauty Pro" | Salon name |
| `phone` | String | "555-123-4567" | Contact phone |
| `email` | String | "info@..." | Contact email |
| `salon_image_url` | String | "/uploads/..." | Path to salon logo/image |
| `subscription_status` | String | "active" or "inactive" | Current subscription state |
| `stripe_customer_id` | String | "cus_..." | Links to Stripe customer account |

---

## GET /api/profile/invoices - Invoice List

### Request
```
GET http://localhost:3000/api/profile/invoices
Headers: Authorization: Bearer [JWT_TOKEN]
```

### Response (200 OK) - With Invoices
```json
[
  {
    "id": "in_1Ow5VqH5T5tsZc3N0000000001",
    "amount": 9900,
    "date": "2025-12-24T15:32:00Z",
    "status": "paid",
    "url": "https://invoice.stripe.com/i/acct_1NZOrJH5T5tsZc3N/test_YWNjdF8xTlpPckpINVQ1dHNaYzNO/inv_1Ow5VqH5T5tsZc3N0000000001",
    "pdfUrl": "https://invoice.stripe.com/pdf/i/acct_1NZOrJH5T5tsZc3N/test_YWNjdF8xTlpPckpINVQ1dHNaYzNO/inv_1Ow5VqH5T5tsZc3N0000000001.pdf"
  },
  {
    "id": "in_1Ow4VqH5T5tsZc3N0000000002",
    "amount": 9900,
    "date": "2025-11-24T10:15:00Z",
    "status": "paid",
    "url": "https://invoice.stripe.com/i/acct_1NZOrJH5T5tsZc3N/test_YWNjdF8xTlpPckpINVQ1dHNaYzNO/inv_1Ow4VqH5T5tsZc3N0000000002",
    "pdfUrl": "https://invoice.stripe.com/pdf/i/acct_1NZOrJH5T5tsZc3N/test_YWNjdF8xTlpPckpINVQ1dHNaYzNO/inv_1Ow4VqH5T5tsZc3N0000000002.pdf"
  }
]
```

### Response (200 OK) - No Invoices Yet
```json
[]
```

### Response Fields Explained
| Field | Type | Example | Meaning |
|-------|------|---------|---------|
| `id` | String | "in_1Ow5VqH..." | Stripe invoice ID (unique) |
| `amount` | Number | 9900 | **Amount in cents** (divide by 100 for dollars) |
| `date` | String (ISO) | "2025-12-24T..." | Invoice date/time |
| `status` | String | "paid", "draft" | Payment status |
| `url` | String | "https://..." | Link to invoice on Stripe |
| `pdfUrl` | String | "https://..." | Direct PDF download link |

### Converting Amount
```javascript
// Raw from API: 9900 (cents)
// Display format: $99.00 (dollars)

const displayAmount = amount / 100;
// 9900 / 100 = 99.00
```

---

## GET /api/profile/debug - Debug Information

### Request
```
GET http://localhost:3000/api/profile/debug
Headers: Authorization: Bearer [JWT_TOKEN]
(Dev only - for troubleshooting)
```

### Response (200 OK)
```json
{
  "salon": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Salon Beauty Pro",
    "stripe_customer_id": "cus_OnOFqNlXrJMpUp",
    "subscription_status": "active"
  },
  "stripeInfo": {
    "hasStripeKey": true,
    "stripeCustomerId": "cus_OnOFqNlXrJMpUp",
    "subscriptionStatus": "active",
    "stripeCustomerEmail": "info@salonbeautypro.com",
    "stripeCustomerCreated": "2025-12-20T10:30:00.000Z"
  }
}
```

### What Each Field Means
| Field | Meaning | Good Value | Bad Value |
|-------|---------|------------|-----------|
| `hasStripeKey` | Stripe configured | `true` | `false` |
| `stripeCustomerId` | Customer exists in Stripe | `"cus_..."` | `null` |
| `stripeCustomerEmail` | Email in Stripe | `"info@..."` | (missing) |
| `stripeCustomerCreated` | When customer created | (recent date) | (old date) |

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Meaning:** Token expired or missing  
**Fix:** Reload page and log in again

### 404 Not Found
```json
{
  "error": "Salon not found"
}
```
**Meaning:** Salon doesn't exist in database  
**Fix:** Check database, verify salon was created

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch invoices"
}
```
**Meaning:** Backend error (check server logs)  
**Fix:** Check server terminal for specific error

---

## Real-World Example Scenarios

### Scenario 1: First-Time Visitor (No Payments Yet)
```
GET /api/profile → returns salon info with stripe_customer_id: null
GET /api/profile/invoices → returns []
Display: "No invoices yet"
```

### Scenario 2: Just Made Payment
```
Time 0s: Payment completes
Time 0-2s: Stripe processing
Time 2s: Frontend calls GET /api/profile/invoices
Time 2-3s: Backend retrieves from Stripe API
Time 3s: Invoice appears on frontend

GET /api/profile/invoices → returns [
  { id: "in_...", amount: 9900, status: "paid", ... }
]
Display: Shows invoice with date, amount, and ✓ Paid status
```

### Scenario 3: Multiple Payments (Monthly Subscription)
```
GET /api/profile/invoices → returns [
  { id: "in_current", amount: 9900, date: "2025-12-24", status: "paid" },
  { id: "in_previous", amount: 9900, date: "2025-11-24", status: "paid" },
  { id: "in_old", amount: 9900, date: "2025-10-24", status: "paid" }
]
Display: Shows all 3 invoices in reverse chronological order
```

---

## Testing API Responses in Browser

### Test Invoice List
```javascript
// Copy-paste into browser console (F12)
fetch('/api/profile/invoices')
  .then(response => response.json())
  .then(data => console.log('Invoices:', data))
  .catch(error => console.error('Error:', error))
```

### Test Profile Data
```javascript
fetch('/api/profile')
  .then(response => response.json())
  .then(data => console.log('Profile:', data))
  .catch(error => console.error('Error:', error))
```

### Test Debug Info
```javascript
fetch('/api/profile/debug')
  .then(response => response.json())
  .then(data => console.log('Debug:', JSON.stringify(data, null, 2)))
  .catch(error => console.error('Error:', error))
```

---

## Frontend Display Logic

### Invoice List Rendering
```javascript
// What the frontend receives:
invoices = [
  {id: "in_123", amount: 9900, date: "2025-12-24T...", status: "paid", ...},
  {id: "in_456", amount: 9900, date: "2025-11-24T...", status: "paid", ...}
]

// How it displays:
invoices.map(invoice => (
  <div className="invoice-item">
    <p className="invoice-date">Dec 24, 2025</p>           {/* formatted date */}
    <p className="invoice-amount">$99.00</p>              {/* amount / 100 */}
    <span className="status-paid">✓ Paid</span>          {/* status badge */}
    <button>Download PDF</button>                        {/* uses pdfUrl */}
  </div>
))
```

### Empty State
```javascript
if (invoices.length === 0) {
  return <p>No invoices yet</p>
}
```

---

## Common Test Scenarios & Expected Responses

### Test 1: Check if Stripe is configured
```javascript
fetch('/api/profile/debug')
  .then(r => r.json())
  .then(d => d.stripeInfo.hasStripeKey)
  
// Expected: true
// If false: Check STRIPE_SECRET_KEY in .env.development
```

### Test 2: Check if customer exists
```javascript
fetch('/api/profile')
  .then(r => r.json())
  .then(d => d.stripe_customer_id)
  
// Expected: "cus_..." (after payment)
// If null: Customer will be created on first payment
```

### Test 3: Check invoices count
```javascript
fetch('/api/profile/invoices')
  .then(r => r.json())
  .then(d => d.length)
  
// Expected: 0 (no payments), or > 0 (after payments)
```

---

## Response Time Expectations

| Endpoint | Typical Time | Max Time |
|----------|--------------|----------|
| `GET /api/profile` | 50-100ms | 200ms |
| `GET /api/profile/invoices` | 300-500ms | 1000ms |
| `GET /api/profile/debug` | 200-400ms | 800ms |

*Times depend on network and Stripe API response times*

---

## Field Value Reference

### subscription_status Values
```
"active"      → Subscription is active, billing in progress
"inactive"    → No active subscription
"past_due"    → Payment failed, past due
"canceled"    → Subscription was canceled
```

### invoice status Values
```
"paid"       → Invoice paid in full
"draft"      → Invoice not yet sent
"open"       → Invoice sent, waiting for payment
"uncollectible" → Payment failed, marked uncollectible
```

### Amount Values
```
9900 cents = $99.00 USD
2900 cents = $29.00 USD
500 cents = $5.00 USD

Always divide by 100 to get dollars
```

---

## Quick Reference: API Endpoints

```
GET /api/profile                    → Salon profile data
GET /api/profile/invoices           → List of invoices
GET /api/profile/invoice/:id        → Download invoice PDF
GET /api/profile/debug              → Debug info (dev only)
```

All endpoints require:
- Header: `Authorization: Bearer [JWT_TOKEN]`
- Status: 200 OK (success), 401 (auth), 500 (error)

---

**Last Updated:** December 24, 2025  
**Format Version:** 1.0

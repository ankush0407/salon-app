# Stripe Invoice Linking - Visual Flow Diagram

## 🔄 Complete Payment → Invoice Workflow

```
USER MAKES PAYMENT
│
├─ Clicks "Subscribe Now" button
│  └─ Opens Stripe Buy Button checkout
│
├─ Enters card: 4242 4242 4242 4242
│  └─ Completes test payment
│
└─ Payment succeeds ✓
   │
   └─ STRIPE CREATES INVOICE AUTOMATICALLY
      ├─ Invoice ID: in_1Ow5VqH...
      ├─ Amount: 9900 cents ($99.00)
      ├─ Date: 2025-12-24
      ├─ Status: paid
      ├─ PDF URL: https://invoice.stripe.com/pdf/...
      └─ Hosted URL: https://invoice.stripe.com/i/...
   
   └─ Browser redirects to: /profile?payment_success=true
      │
      └─ SUCCESS MESSAGE APPEARS
         └─ "✓ Payment successful! Invoice is being processed."
      
      └─ 2-SECOND AUTO-REFRESH HAPPENS
         │
         └─ Frontend calls: GET /api/profile/invoices
            │
            └─ BACKEND CONNECTS TO STRIPE API
               ├─ Gets salon's stripe_customer_id
               ├─ Calls stripe.invoices.list()
               └─ Stripe returns all invoices for this customer
            
            └─ BACKEND FORMATS INVOICE DATA
               ├─ id: "in_1Ow5VqH..."
               ├─ amount: 9900
               ├─ date: "2025-12-24T..."
               ├─ status: "Paid"
               ├─ url: "https://invoice.stripe.com/i/..."
               └─ pdfUrl: "https://invoice.stripe.com/pdf/..." ⭐
            
            └─ SENDS TO FRONTEND
               │
               └─ FRONTEND RECEIVES INVOICE DATA
                  │
                  ├─ Converts date to month: "December 2025"
                  ├─ Calculates amount: 9900 ÷ 100 = "$99.00"
                  ├─ Gets status: "Paid"
                  └─ Stores pdfUrl for download: ⭐
                  
                  └─ RENDERS INVOICE IN HISTORY
                     ┌──────────────────────────────────┐
                     │ December 2025       ✓ Paid  📥   │
                     │ Dec 24, 2025                     │
                     │ $99.00                           │
                     └──────────────────────────────────┘

USER CLICKS DOWNLOAD BUTTON (📥)
│
├─ onClick handler triggers
│  └─ Finds invoice object in state
│
├─ Gets pdfUrl from invoice: "https://invoice.stripe.com/pdf/..."
│  └─ This is the OFFICIAL Stripe PDF link ⭐
│
└─ window.open(pdfUrl, '_blank')
   │
   └─ Opens Stripe PDF in NEW TAB
      ├─ Shows invoice from Stripe
      ├─ Has official invoice number
      ├─ Shows subscription details
      ├─ Shows amount and date
      └─ User can download/print/save
```

---

## 📊 Data Mapping: Stripe → Your App

### Stripe Invoice Object → Your App

```
STRIPE API RETURNS:
{
  "id": "in_1Ow5VqH5T5tsZc3N1234567890",
  "customer": "cus_OnOFqNlXrJMpUp",
  "created": 1735058400,  // Unix timestamp (seconds)
  "amount_paid": 9900,    // In cents!
  "total": 9900,
  "status": "paid",
  "hosted_invoice_url": "https://invoice.stripe.com/i/acct_.../inv_.../",
  "invoice_pdf": "https://invoice.stripe.com/pdf/...",  // ⭐ PDF LINK
  ...
}

YOUR BACKEND FORMATS TO:
{
  "id": "in_1Ow5VqH5T5tsZc3N1234567890",
  "amount": 9900,                          // ← Still in cents
  "date": "2025-12-24T10:30:00.000Z",     // ← Converted to Date
  "status": "Paid",                        // ← Converted to readable
  "url": "https://invoice.stripe.com/...",
  "pdfUrl": "https://invoice.stripe.com/pdf/..."  // ⭐ PASSED THROUGH
}

YOUR FRONTEND DISPLAYS AS:
{
  monthName: "December 2025",              // ← From invoice.date
  fullDate: "Dec 24, 2025",                // ← From invoice.date
  amount: "$99.00",                        // ← invoice.amount ÷ 100
  status: "Paid",                          // ← invoice.status
  downloadUrl: "https://invoice.stripe.com/pdf/..."  // ⭐ Used for download
}
```

---

## 🔗 The Invoice ID Link Chain

```
STRIPE DATABASE:
  Invoice: in_1Ow5VqH5T5tsZc3N1234567890
  Customer: cus_OnOFqNlXrJMpUp
  Created: 2025-12-24
  Amount: 9900 cents
  PDF: https://invoice.stripe.com/pdf/...
  
YOUR DATABASE:
  Salon: {id: "550e8400-...", stripe_customer_id: "cus_OnOFqNlXrJMpUp"}
  
LINK: 
  Your salon → stripe_customer_id → Stripe customer → invoices → PDFs
  
API CALL:
  stripe.invoices.list({ customer: "cus_OnOFqNlXrJMpUp" })
  ↓
  Returns all invoices for that customer (your salon)
```

---

## 💾 What's Stored Where

```
STRIPE (Their Servers)
├─ Customer account: cus_OnOFqNlXrJMpUp
├─ Invoice record: in_1Ow5VqH...
├─ Amount: 9900 cents
├─ Date: 2025-12-24
├─ Invoice PDF file (generated automatically)
└─ PDF URL: https://invoice.stripe.com/pdf/...

YOUR DATABASE
├─ Salons table
│  └─ stripe_customer_id: "cus_OnOFqNlXrJMpUp"  ← THE LINK!
└─ (No PDFs stored here! Stripe hosts them)

YOUR APP MEMORY (REACT STATE)
├─ invoices: [
│    { id: "in_1Ow5VqH...", amount: 9900, pdfUrl: "https://..." }
│  ]
└─ (Fetched from Stripe API each time)
```

---

## 🔄 Real-Time Sync Explanation

```
SCENARIO: User makes 3 payments over 3 months

Month 1 (Dec 24, 2025):
┌─────────────────────────────┐
│ Payment $99 completed       │
├─────────────────────────────┤
│ Stripe creates invoice:     │
│ in_1Ow5VqH... ($99)         │
└─────────────────────────────┘
         ↓
   GET /api/profile/invoices
         ↓
   Returns: [Dec 24 invoice] ✓

Month 2 (Jan 24, 2026):
┌─────────────────────────────┐
│ Payment $99 completed       │
├─────────────────────────────┤
│ Stripe creates invoice:     │
│ in_1Ow6VqH... ($99)         │
└─────────────────────────────┘
         ↓
   GET /api/profile/invoices
         ↓
   Returns: [Jan 24, Dec 24 invoices] ✓

Month 3 (Feb 24, 2026):
┌─────────────────────────────┐
│ Payment $99 completed       │
├─────────────────────────────┤
│ Stripe creates invoice:     │
│ in_1Ow7VqH... ($99)         │
└─────────────────────────────┘
         ↓
   GET /api/profile/invoices
         ↓
   Returns: [Feb 24, Jan 24, Dec 24 invoices] ✓

USER'S INVOICE HISTORY SHOWS:
February 2026        ✓ Paid   📥
Feb 24, 2026
$99.00

January 2026         ✓ Paid   📥
Jan 24, 2026
$99.00

December 2025        ✓ Paid   📥
Dec 24, 2025
$99.00
```

---

## 📍 No Placeholder Invoices - All Real!

```
BEFORE (if using placeholders):
├─ Manual invoice entry needed
├─ Copy invoice number from Stripe
├─ Upload PDF manually
├─ Match to month name manually
├─ Update when anything changes
└─ Risk of mismatches/errors

AFTER (current implementation):
├─ Payment completes on Stripe ✓
├─ Invoice auto-generated by Stripe ✓
├─ Stripe stores PDF ✓
├─ Your app fetches from Stripe API ✓
├─ Display with month automatically ✓
├─ Download links directly to Stripe PDF ✓
├─ Always in sync (fetched each time) ✓
└─ Zero manual work needed ✓
```

---

## 🧪 Verification: Is It a Real Stripe Invoice?

When you click download, here's how to verify:

```
1. PDF opens in new tab
   ├─ URL starts with: https://invoice.stripe.com/pdf/
   └─ ✓ Definitely from Stripe!

2. PDF contents show:
   ├─ "Stripe" branding/logo
   ├─ Invoice number: in_XXXXX...
   ├─ Your salon information
   ├─ Amount: $99.00 (or subscription price)
   ├─ Date: Matches the month shown
   ├─ "Paid" status
   └─ ✓ Official Stripe invoice!

3. You can:
   ├─ Save as PDF to computer
   ├─ Print for records
   ├─ Share with accountant
   ├─ Email to customer (if B2B)
   └─ ✓ Production-ready invoice!
```

---

## 🔐 Security & Authentication

```
STRIPE PDF URLS ARE SIGNED:
├─ Unique to your Stripe account
├─ Include access tokens
├─ Expire after some time
├─ Cannot be forged
└─ Only work for your invoices

YOUR APP:
├─ Only stores customer ID
├─ Fetches invoice URLs from Stripe API
├─ Passes URLs through to frontend
├─ Frontend opens in new tab (CORS handled)
└─ User must be authenticated (JWT token)

RESULT:
├─ Only authenticated users can see their invoices
├─ Cannot forge invoice URLs
├─ Stripe validates each request
├─ Completely secure ✓
```

---

## 📱 Complete Component Map

```
PROFILE.JS COMPONENT
├─ useState(invoices) ← Holds Stripe invoice data
│
├─ fetchInvoices()
│  └─ await api.get('/profile/invoices')
│     └─ Calls backend endpoint
│
├─ handleDownloadInvoice(invoiceId)
│  └─ Gets pdfUrl from invoices state
│     └─ window.open(pdfUrl, '_blank')
│        └─ Opens Stripe PDF in new tab
│
└─ Render invoices
   └─ invoices.map(invoice => {
      monthName: invoice.date → "December 2025"
      amount: invoice.amount / 100 → "$99.00"
      status: invoice.status → "Paid"
      pdfUrl: invoice.pdfUrl → Stripe link
   })

PROFILE.JS API CALLS
├─ GET /api/profile/invoices
│  ├─ Request: Just send JWT token
│  └─ Response: Array of invoice objects
│
└─ Download (frontend only!)
   ├─ No API call
   ├─ window.open(invoice.pdfUrl)
   └─ Browser handles it

PROFILE.JS ROUTE (BACKEND)
├─ GET /api/profile/invoices
│  ├─ Check authentication
│  ├─ Get stripe_customer_id from database
│  ├─ Call stripe.invoices.list(customer_id)
│  ├─ Format response (keep pdfUrl!)
│  └─ Send to frontend
```

---

## 🎯 The Key Insight

```
BEFORE: You needed to...
  1. Monitor Stripe dashboard
  2. Download invoices manually
  3. Upload to your system
  4. Match with months
  5. Manage PDF storage
  
AFTER: It's automatic!
  1. Payment → Stripe creates invoice automatically
  2. Your app fetches from Stripe API automatically
  3. Displays with month automatically
  4. PDF downloads directly from Stripe
  5. Stripe manages everything
  
NO PLACEHOLDERS, JUST REAL STRIPE INVOICES! ✓
```

---

## ✅ Quick Checklist

- [x] Stripe automatically generates invoice on payment
- [x] Invoice PDF stored on Stripe's servers
- [x] Your database links via stripe_customer_id
- [x] Backend API fetches invoices from Stripe
- [x] Frontend gets real invoice data with PDF URLs
- [x] Month names displayed prominently
- [x] Download button links directly to Stripe PDF
- [x] All real Stripe invoices (no placeholders)
- [x] Auto-refreshes after payment
- [x] Manual refresh available

---

**Status:** ✅ LIVE & AUTOMATIC  
**Maintenance:** None needed (Stripe handles everything)  
**Last Updated:** December 15, 2025

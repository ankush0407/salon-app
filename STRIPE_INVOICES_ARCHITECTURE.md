# Stripe Invoice Architecture - Visual Reference

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR FRONTEND (React)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Profile.js Component                                           │
│  ├─ useState(invoices)  ← Holds invoice data from API          │
│  ├─ fetchInvoices()    ← Calls GET /api/profile/invoices       │
│  ├─ handleDownloadInvoice(id)  ← Opens Stripe PDF in new tab   │
│  └─ Render:                                                     │
│     ├─ December 2025        ✓ Paid   📥  ← MONTH NAME (NEW!)   │
│     ├─ Dec 24, 2025                                             │
│     └─ $99.00                                                   │
│                                                                  │
│  Profile.css Styling                                            │
│  ├─ .invoice-month  { font-weight: 700; font-size: 1rem; }     │
│  ├─ .invoice-date   { font-size: 0.8rem; }                     │
│  └─ .invoice-amount { color: #10b981; }                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        GET /api/profile/invoices
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       YOUR BACKEND (Express)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  server/routes/profile.js                                       │
│  └─ router.get('/invoices', async (req, res) => {              │
│      ├─ Get salon's stripe_customer_id from DATABASE           │
│      ├─ Call Stripe API:                                       │
│      │   stripe.invoices.list({ customer: "cus_..." })        │
│      ├─ Format response:                                       │
│      │   {                                                     │
│      │     id: "in_1Ow5VqH...",                              │
│      │     amount: 9900,                                       │
│      │     date: "2025-12-24T...",                           │
│      │     status: "Paid",                                     │
│      │     pdfUrl: "https://invoice.stripe.com/pdf/..."       │
│      │   }                                                     │
│      └─ Return to frontend                                     │
│    })                                                           │
│                                                                  │
│  Database (PostgreSQL)                                          │
│  └─ salons table:                                              │
│     ├─ id: "550e8400-..."                                      │
│     ├─ name: "Salon Beauty"                                    │
│     └─ stripe_customer_id: "cus_OnOFqNlXrJMpUp"  ← THE LINK!   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        stripe.invoices.list({ customer: "cus_..." })
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STRIPE API (Remote Servers)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stripe Customer: cus_OnOFqNlXrJMpUp                            │
│  ├─ Invoices:                                                   │
│  │  ├─ Invoice #1: in_1Ow5VqH... (Dec 24, 2025)               │
│  │  │  ├─ Amount: 9900 cents                                   │
│  │  │  ├─ Status: paid                                         │
│  │  │  └─ PDF: https://invoice.stripe.com/pdf/...             │
│  │  ├─ Invoice #2: in_1Ow4VqH... (Nov 24, 2024)               │
│  │  │  ├─ Amount: 9900 cents                                   │
│  │  │  ├─ Status: paid                                         │
│  │  │  └─ PDF: https://invoice.stripe.com/pdf/...             │
│  │  └─ Invoice #3: in_1Ow3VqH... (Oct 24, 2024)               │
│  │     ├─ Amount: 9900 cents                                   │
│  │     ├─ Status: paid                                         │
│  │     └─ PDF: https://invoice.stripe.com/pdf/...             │
│  │                                                              │
│  └─ PDF Files (auto-generated by Stripe)                       │
│     ├─ https://invoice.stripe.com/pdf/...  (invoice #1)       │
│     ├─ https://invoice.stripe.com/pdf/...  (invoice #2)       │
│     └─ https://invoice.stripe.com/pdf/...  (invoice #3)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Flow

```
START: User on Profile Page
  │
  ├─ Component mounts
  │  ├─ fetchProfileData()  → GET /api/profile
  │  └─ fetchInvoices()     → GET /api/profile/invoices
  │
  ├─ Backend queries Stripe
  │  └─ stripe.invoices.list({ customer: "cus_..." })
  │
  ├─ Frontend receives invoice data
  │  ├─ Extracts month: "December 2025"
  │  ├─ Formats amount: "$99.00"
  │  ├─ Shows status: "✓ Paid"
  │  └─ Stores pdfUrl: "https://..."
  │
  ├─ Display invoice
  │  ┌────────────────────────────┐
  │  │ December 2025   ✓ Paid  📥 │
  │  │ Dec 24, 2025              │
  │  │ $99.00                    │
  │  └────────────────────────────┘
  │
  └─ User clicks 📥 button
     ├─ handleDownloadInvoice()
     ├─ Gets invoice.pdfUrl from state
     ├─ window.open(pdfUrl, '_blank')
     └─ Stripe PDF opens in new tab
        ├─ User can view, save, or print
        └─ No server interaction needed

PAYMENT FLOW:
  │
  ├─ User clicks "Subscribe Now"
  │  └─ Stripe Buy Button opens checkout
  │
  ├─ User completes payment
  │  └─ Card 4242 4242 4242 4242 accepted
  │
  ├─ Stripe creates invoice automatically
  │  ├─ Generates PDF
  │  ├─ Stores on Stripe servers
  │  └─ Makes available via API
  │
  ├─ Browser redirects to:
  │  └─ /profile?payment_success=true
  │
  ├─ Frontend detects success parameter
  │  ├─ Shows message: "✓ Payment successful!"
  │  └─ Waits 2 seconds (Stripe processing)
  │
  ├─ Auto-refreshes invoices
  │  ├─ fetchProfileData()
  │  └─ fetchInvoices()
  │
  ├─ Backend queries Stripe again
  │  └─ NEW invoice now included!
  │
  ├─ Frontend displays new invoice
  │  ┌────────────────────────────┐
  │  │ December 2025   ✓ Paid  📥 │ ← NEW!
  │  │ Dec 24, 2025              │
  │  │ $99.00                    │
  │  └────────────────────────────┘
  │
  └─ Done! Invoice appears automatically
```

---

## 📊 Data Transformation Journey

```
STRIPE API RETURNS:
{
  "id": "in_1Ow5VqH5T5tsZc3N1234567890",
  "customer": "cus_OnOFqNlXrJMpUp",
  "created": 1735058400,
  "amount_paid": 9900,
  "status": "paid",
  "invoice_pdf": "https://invoice.stripe.com/pdf/..."
}
           ↓
BACKEND FORMATS:
{
  "id": "in_1Ow5VqH...",
  "amount": 9900,
  "date": "2025-12-24T10:30:00Z",  ← Converted
  "status": "Paid",
  "pdfUrl": "https://invoice.stripe.com/pdf/..."
}
           ↓
FRONTEND STORES IN STATE:
invoices = [{...}, {...}, {...}]
           ↓
FRONTEND RENDERS:
monthName = "December 2025"     ← Extracted from date
fullDate = "Dec 24, 2025"
amount = "$99.00"               ← Divided by 100
status = "✓ Paid"
pdfUrl = "https://..."          ← Used for download
           ↓
USER SEES:
December 2025        ✓ Paid   📥
Dec 24, 2025
$99.00
```

---

## 🔗 The Connection Map

```
┌──────────────────┐
│  Stripe Payment  │
│                  │
│  Customer makes  │
│  $99 payment     │
└────────┬─────────┘
         │
         ├─ Stripe processes
         ├─ Creates invoice
         ├─ Generates PDF
         └─ Stores in account
         
┌────────────────────────────────────────┐
│    Your Database (PostgreSQL)           │
│                                        │
│  salons table                          │
│  ├─ id: 550e8400-...                  │
│  └─ stripe_customer_id: cus_...  ←────┼─── LINK!
└────────────────────────────────────────┘
         │
         ├─ Your backend stores this ID
         ├─ Uses it to query Stripe
         └─ Gets all invoices for this customer
         
┌────────────────────────────────────────┐
│    Stripe API                          │
│                                        │
│  Customer: cus_OnOFqNlXrJMpUp         │
│  Invoices:                             │
│  ├─ in_1Ow5VqH... (Dec 24, 2025)     │
│  │  └─ PDF: https://...               │
│  ├─ in_1Ow4VqH... (Nov 24, 2024)     │
│  │  └─ PDF: https://...               │
│  └─ in_1Ow3VqH... (Oct 24, 2024)     │
│     └─ PDF: https://...               │
└────────────────────────────────────────┘
         │
         ├─ Your backend fetches
         ├─ Frontend displays
         └─ User downloads PDFs from Stripe
```

---

## 💾 What's Stored Where

```
STRIPE SERVERS
├─ Customer records
├─ Payment history
├─ Invoice records
├─ PDF files (auto-generated)
└─ All invoice data

YOUR SERVER (Database)
├─ Salons table
│  ├─ id
│  ├─ name
│  ├─ stripe_customer_id ← ONLY THIS LINKS TO STRIPE
│  └─ other fields
└─ (NO invoice PDFs stored - Stripe hosts them)

YOUR FRONTEND (React State)
├─ invoices array (fetched each time)
│  └─ Contains pdfUrl pointing to Stripe
└─ (PDFs NOT downloaded/stored - links only)
```

---

## 🔐 Security Architecture

```
USER REQUEST
     │
     ├─ Browser sends authenticated request
     │  ├─ JWT token in header
     │  └─ HTTPS encrypted
     │
     ├─ Your backend validates token
     │  └─ Confirms salon_id
     │
     ├─ Get stripe_customer_id from database
     │  └─ Only for authenticated salon
     │
     ├─ Call Stripe API
     │  ├─ Uses STRIPE_SECRET_KEY
     │  └─ Stripe returns only this customer's data
     │
     ├─ Frontend receives invoice data
     │  └─ Includes pdfUrl signed by Stripe
     │
     └─ User downloads PDF
        ├─ Browser opens in new tab
        ├─ Stripe validates PDF request
        └─ Only this customer can access their PDFs

RESULT: Only authenticated users see their invoices! ✓
```

---

## 🎯 Invoice Journey Timeline

```
MONTH 1 (December 24, 2025)
  User clicks "Subscribe Now"
       ↓
  Stripe processes payment ($99)
       ↓
  Stripe creates invoice: in_1Ow5VqH...
       ↓
  Invoice stored in Stripe
  PDF auto-generated
       ↓
  User redirected to /profile?payment_success=true
       ↓
  Frontend auto-refreshes (2 second delay)
       ↓
  Invoice appears:
  December 2025 ✓ Paid 📥

MONTH 2 (January 24, 2026)
  Automatic subscription renewal
       ↓
  Stripe processes payment ($99)
       ↓
  Stripe creates invoice: in_1Ow6VqH...
       ↓
  User goes to Profile page
       ↓
  Frontend calls GET /api/profile/invoices
       ↓
  Now shows TWO invoices:
  January 2026 ✓ Paid 📥
  December 2025 ✓ Paid 📥

MONTH 3 (February 24, 2026)
  Another renewal
       ↓
  THREE invoices visible:
  February 2026 ✓ Paid 📥
  January 2026 ✓ Paid 📥
  December 2025 ✓ Paid 📥
```

---

## 🚀 Performance Flow

```
USER LOADS PROFILE PAGE
           ↓
    Component mounts
           ├─ setState(loading: true)
           ├─ fetchProfileData()
           │  └─ GET /api/profile (~100ms)
           └─ fetchInvoices()
              └─ GET /api/profile/invoices (~500ms)
           ↓
    Backend calls Stripe
           └─ stripe.invoices.list() (~300ms)
           ↓
    Frontend receives data
           ├─ setState(invoices: [...])
           ├─ setState(loading: false)
           └─ Re-render component
           ↓
    INVOICES DISPLAY (~1 second total)
           ├─ Month names extracted
           ├─ Amounts formatted
           ├─ Dates processed
           └─ PDFs linked

TOTAL TIME: ~1 second (acceptable, Stripe API is fast)
```

---

## ✅ Component Checklist

```
Frontend (Profile.js)
├─ ✅ fetchInvoices() function
├─ ✅ handleDownloadInvoice() function  
├─ ✅ Month name extraction logic
├─ ✅ Invoice mapping/rendering
└─ ✅ Success message on payment

Backend (server/routes/profile.js)
├─ ✅ GET /api/profile/invoices endpoint
├─ ✅ Stripe authentication
├─ ✅ Customer ID lookup
├─ ✅ Invoice formatting
└─ ✅ Error handling

Styling (Profile.css)
├─ ✅ .invoice-month class (bold, large)
├─ ✅ .invoice-date class (subtle)
├─ ✅ .invoice-amount class (green)
└─ ✅ .invoice-item class (layout)

Database (PostgreSQL)
├─ ✅ salons.stripe_customer_id column
└─ ✅ No new tables needed

Stripe Integration
├─ ✅ stripe.invoices.list() call
├─ ✅ invoice_pdf URL included
├─ ✅ Amount in cents (9900 = $99)
└─ ✅ Status handling (paid/pending)
```

---

**Visual Architecture Complete!** 🎉

Everything from payment → invoice creation → display is documented and working.

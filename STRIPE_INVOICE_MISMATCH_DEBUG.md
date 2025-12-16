# Stripe Invoice Mismatch - Debug Guide

## 🔍 Problem
- Made a **$50 payment** through Stripe Buy Button
- But invoice shows **$99** instead
- Customer email: `owner@owner@bluesalon.com` (note: double @@)

## 🎯 Possible Causes

1. **Multiple Stripe Customers** - Email might exist in Stripe multiple times
2. **Wrong Customer Linked** - Sync found different customer than expected
3. **Different Subscription** - $99 might be from a different product
4. **Old Invoices** - Finding invoices from previous payments
5. **Email Typo** - Double @@ might be matching wrong customer

---

## 🧪 Debug Steps

### Step 1: Call the Enhanced Debug Endpoint

**In browser console (F12):**
```javascript
fetch('/api/profile/debug')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
```

Or use curl:
```bash
curl -H "Authorization: Bearer [YOUR_JWT_TOKEN]" \
  http://localhost:3000/api/profile/debug
```

### Step 2: Analyze the Response

The debug endpoint returns:
```json
{
  "salon": {
    "id": "550e8400-...",
    "name": "Blue Salon",
    "email": "owner@owner@bluesalon.com",
    "stripe_customer_id": "cus_OnOFqNlXrJMpUp",
    "subscription_status": "inactive"
  },
  "stripeApi": {
    "configured": true,
    "secretKeySet": true
  },
  "customers": [
    {
      "id": "cus_OnOFqNlXrJMpUp",
      "email": "owner@owner@bluesalon.com",
      "created": "2025-12-15T10:30:00.000Z",
      "isInDatabase": true
    },
    {
      "id": "cus_DifferentId123",
      "email": "owner@owner@bluesalon.com",
      "created": "2025-12-10T05:15:00.000Z",
      "isInDatabase": false
    }
  ],
  "invoices": [
    {
      "customer_id": "cus_OnOFqNlXrJMpUp",
      "invoice_id": "in_1Ow5VqH...",
      "amount": 99,
      "date": "2025-12-10T...",
      "status": "paid",
      "hasPdf": true
    },
    {
      "customer_id": "cus_DifferentId123",
      "invoice_id": "in_1Ow4VqH...",
      "amount": 50,
      "date": "2025-12-15T...",
      "status": "paid",
      "hasPdf": true
    }
  ],
  "warnings": []
}
```

### Step 3: Check for Issues

**Look for:**

1. **Multiple Customers**
   ```
   customers: [ { ... }, { ... }, { ... } ]
   ```
   If you see multiple customers with same email, that's the problem!

2. **Wrong Customer in Database**
   ```
   "isInDatabase": false  ← Wrong customer linked!
   ```
   Database might be linked to the old customer

3. **Mismatched Amounts**
   ```
   invoices: [
     { customer_id: "cus_...", amount: 99 },  ← Old payment
     { customer_id: "cus_...", amount: 50 }   ← New payment
   ]
   ```
   If amounts don't match, check which customer is linked

4. **Warnings**
   ```
   "warnings": [
     "Database customer cus_... not found by email search"
   ]
   ```
   This means database and email search found different customers!

---

## 🔧 How to Fix

### Option 1: Update Salon Email (If Email is Wrong)

Check if your salon email has the double @@ typo:

```bash
# In browser console:
fetch('/api/profile')
  .then(r => r.json())
  .then(d => console.log('Email:', d.email))
```

If it shows `owner@owner@bluesalon.com`, that's wrong! Should be `owner@bluesalon.com`

**Fix by updating the email:**
1. Go to Profile page
2. Change email to: `owner@bluesalon.com` (remove extra @)
3. Click "Save Changes"

### Option 2: Manually Set Correct Customer ID

If sync found the wrong customer, you can manually set it:

**Get the correct customer ID:**
1. Call debug endpoint (see Step 1)
2. Find the customer with amount: 50
3. Note its `customer_id`: `cus_...`

**Update in database:**
```sql
UPDATE salons 
SET stripe_customer_id = 'cus_CORRECT_ID'
WHERE id = '550e8400-...';
```

Or through the app by making a payment with the correct email.

### Option 3: Clear and Resync

Delete the customer ID and let sync find the right one:

```sql
UPDATE salons 
SET stripe_customer_id = NULL
WHERE id = '550e8400-...';
```

Then:
1. Refresh Profile page
2. Make another payment (or call sync manually)
3. Sync will find and link correct customer

---

## 🚀 Quick Test After Fix

After fixing, run debug again:

```javascript
fetch('/api/profile/debug')
  .then(r => r.json())
  .then(d => {
    console.log('Customers:', d.customers.length);
    console.log('Invoices:', d.invoices);
    console.log('Warnings:', d.warnings);
  })
```

**Should show:**
- ✅ Only 1 customer (or correct one marked as `isInDatabase: true`)
- ✅ Invoice with amount: 50
- ✅ No warnings

---

## 📊 Common Scenarios

### Scenario 1: Email Typo (owner@owner@bluesalon.com)

**Problem:**
```
Stripe has 2 customers, both with typo email
├─ cus_OLD with email owner@owner@bluesalon.com (created Dec 10) → 1 invoice $99
└─ cus_NEW with email owner@owner@bluesalon.com (created Dec 15) → 1 invoice $50
Database linked to cus_OLD, so shows $99
```

**Solution:**
1. Update email to: `owner@bluesalon.com` (correct it)
2. Resync or manually update customer ID

### Scenario 2: Multiple Customers, Wrong One Linked

**Problem:**
```
Stripe has 2 customers
├─ cus_CORRECT (has $50 invoice) - NOT in database
└─ cus_WRONG (has $99 invoice) - IN database ✓

Debug shows:
customers: [
  { id: "cus_WRONG", isInDatabase: true },
  { id: "cus_CORRECT", isInDatabase: false }
]
```

**Solution:**
1. Update database to correct customer ID
2. Or: Delete ID and resync

### Scenario 3: Customer Doesn't Have $50 Invoice

**Problem:**
```
Debug shows:
invoices: [
  { customer_id: "cus_...", amount: 99 },
  { customer_id: "cus_...", amount: 50 }
]

But both are from different customers!
$50 customer is NOT the one in database
```

**Solution:**
1. Check Stripe Dashboard
2. Find customer with $50 invoice
3. Get their customer ID
4. Update database

---

## 🔍 Check in Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Click "Customers" in left sidebar
3. Search for: `owner@owner@bluesalon.com` OR `owner@bluesalon.com`
4. **Note each customer ID** and their **created date**
5. Click each customer to see their **invoices**
6. Which customer has the $50 invoice? → That's the one you want!

---

## 📝 Debug Checklist

- [ ] Called `/api/profile/debug` endpoint
- [ ] Checked response for multiple customers
- [ ] Verified database customer ID matches correct customer
- [ ] Checked invoice amounts
- [ ] Looked for warnings
- [ ] Fixed email if typo exists
- [ ] Updated customer ID if needed
- [ ] Made another payment to verify fix
- [ ] Confirmed invoice shows $50
- [ ] Tested download PDF

---

## 🎯 What the Debug Endpoint Shows

```
salon section:
├─ Your database info
├─ Current email stored
├─ Current stripe_customer_id
└─ subscription_status

stripeApi section:
├─ Is Stripe configured
└─ Is secret key set

customers section:
├─ All customers with this email in Stripe
├─ When each was created
└─ Which one is in your database (isInDatabase)

invoices section:
├─ All invoices from all customers
├─ Customer ID each belongs to
├─ Amount of each
├─ Date and status
└─ PDF URL

warnings section:
└─ Any issues found
```

---

## ✅ Expected After Fix

**Debug response should show:**

```json
{
  "customers": [
    {
      "id": "cus_OnOFqNlXrJMpUp",
      "email": "owner@bluesalon.com",  ← Correct email
      "isInDatabase": true
    }
  ],
  "invoices": [
    {
      "customer_id": "cus_OnOFqNlXrJMpUp",
      "amount": 50,  ← Correct amount!
      "status": "paid"
    }
  ],
  "warnings": []  ← No warnings!
}
```

---

## 🚀 Quick Email Fix

If your email really is `owner@owner@bluesalon.com` (double @@):

1. Go to Profile page
2. Change email field to: `owner@bluesalon.com`
3. Click "Save Changes"
4. Go back to Stripe
5. Make new payment with correct email
6. Invoices should now show $50

---

**Run the debug endpoint first to understand what's happening, then let me know what you see!** 🔍


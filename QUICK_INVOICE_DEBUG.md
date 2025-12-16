# $99 vs $50 Invoice - Quick Debug

## 🎯 What's Happening

You see **$99 invoice** when you paid **$50**. This usually means:
1. Multiple Stripe customers exist (possibly from old tests)
2. Wrong customer is linked in your database
3. Email might have typo (owner@owner@bluesalon.com)

---

## 🚀 Quick Debug (2 minutes)

### Step 1: Run Debug Endpoint
```javascript
// Browser console (F12):
fetch('/api/profile/debug')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
```

### Step 2: Look for These Issues

**Issue 1: Multiple Customers**
```
customers: [
  { id: "cus_123", email: "...", isInDatabase: true },  ← Linked
  { id: "cus_456", email: "...", isInDatabase: false }  ← Not linked
]
```

**Issue 2: Wrong Amounts**
```
invoices: [
  { customer_id: "cus_123", amount: 99 },  ← Showing this ($99)
  { customer_id: "cus_456", amount: 50 }   ← Should show this ($50)
]
```

**Issue 3: Warnings**
```
warnings: [
  "Database customer cus_123 not found by email search"
]
```

---

## ✅ What to Do

### If Email is Wrong (has @@)

1. Go to Profile page
2. Change email from: `owner@owner@bluesalon.com`
3. Change email to: `owner@bluesalon.com`
4. Click "Save Changes"

### If Customer is Wrong

**Option A: Resync**
1. Refresh page
2. Call sync endpoint: `fetch('/api/profile/sync-stripe-customer', {method: 'POST'}).then(r => r.json()).then(console.log)`
3. Should find correct customer

**Option B: Delete & Reset**
```sql
UPDATE salons 
SET stripe_customer_id = NULL 
WHERE id = '550e8400-...';
```
Then refresh page and resync.

### If Multiple Old Customers Exist

This is normal from testing. The sync will find the one with matching email. Just:
1. Verify email is correct in Profile
2. Resync or refresh page
3. Invoice should update to $50

---

## 🔍 Root Cause Analysis

**Most likely:** Your email has the **double @@** typo

When you made:
- **First test:** `owner@owner@bluesalon.com` → Stripe created cus_OLD → Invoice $99
- **Second test:** `owner@owner@bluesalon.com` → Stripe reused cus_OLD → Still $99

But you intended: `owner@bluesalon.com`

**Fix:** Update email to correct version and resync

---

## ✅ After Fix, You Should See

```javascript
// Debug endpoint returns:
{
  "customers": [
    { 
      "id": "cus_correct",
      "email": "owner@bluesalon.com",  ← Fixed
      "isInDatabase": true
    }
  ],
  "invoices": [
    {
      "amount": 50,  ← Now correct!
      "status": "paid"
    }
  ],
  "warnings": []  ← Clean!
}
```

---

**Run the debug endpoint and tell me what you see!** 🔍


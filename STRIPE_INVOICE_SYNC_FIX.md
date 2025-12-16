# Stripe Invoice Sync - Troubleshooting & Fix

## 🔍 Problem Diagnosed

When using **Stripe Buy Button**, payments are processed directly through Stripe without going through your server's checkout endpoint. This means:

1. ✅ Payment succeeds on Stripe
2. ✅ Invoice is created on Stripe  
3. ❌ Your database `stripe_customer_id` is **NOT set**
4. ❌ Your invoice fetcher can't find invoices (no customer ID to query)

---

## ✅ Solution Implemented

I've added automatic **Stripe customer sync** that:

1. Detects payment success on redirect
2. Searches Stripe for customer by email
3. Links customer to your salon in database
4. Fetches and displays invoices automatically

---

## 🔄 New Payment Flow

```
USER MAKES PAYMENT
     ↓
Stripe Buy Button processes ($50)
     ↓
Stripe creates customer & invoice
     ↓
Browser redirects to /profile?payment_success=true
     ↓
Frontend detects success parameter
     ↓
Frontend calls POST /api/profile/sync-stripe-customer
     ↓
Backend searches Stripe for customer by email
     ↓
Backend finds customer and saves ID to database
     ↓
Frontend calls GET /api/profile/invoices
     ↓
Backend queries Stripe with customer ID
     ↓
Invoice appears in Invoice History! ✓
```

---

## 🧪 What to Do Now

### Step 1: Test the Fix

1. **Refresh your Profile page** in browser (Ctrl+R)
2. **Go to Stripe Buy Button** and make another test payment
   - Card: `4242 4242 4242 4242`
   - Any future date and CVC
3. **Wait for redirect** back to profile
4. **Watch the message** - should show "Syncing invoices..."
5. **Check server logs** for detailed sync information

### Step 2: Check Server Logs

Watch the server terminal for these log messages:

```
🔍 Syncing Stripe customer for salon: Blue Salon
📧 Searching Stripe for customer with email: owner@bluesalon.com
✅ Found Stripe customer: cus_OnOFqNlXrJMpUp
💾 Updated salon with Stripe customer ID: cus_OnOFqNlXrJMpUp
📋 Found 1 invoices for this customer
```

### Step 3: Check Invoice History

After successful sync:
- Navigate to "Invoice History" section
- Should see your $50 payment with month name
- All invoices from Stripe now linked

---

## 🔧 How the Sync Works

### New Backend Endpoint

```
POST /api/profile/sync-stripe-customer
```

**What it does:**
1. Gets your salon's email from database
2. Searches Stripe for customer with that email
3. If found:
   - Saves customer ID to your database
   - Fetches all invoices for that customer
   - Returns invoice list with count

**Returns:**
```json
{
  "success": true,
  "message": "Stripe customer linked successfully",
  "stripe_customer_id": "cus_OnOFqNlXrJMpUp",
  "email": "owner@bluesalon.com",
  "invoices_count": 3,
  "invoices": [
    {
      "id": "in_1Ow5VqH...",
      "amount": 5000,
      "date": "2025-12-15T...",
      "status": "paid"
    }
  ]
}
```

### Frontend Integration

```javascript
// After payment redirect detected:
const syncResponse = await api.post('/profile/sync-stripe-customer');
// Then automatically fetch invoices
await fetchInvoices();
```

---

## 📊 Expected Behavior After Fix

### Before Payment
```
Profile Page
├─ Salon Name: "Blue Salon"
├─ Phone: "(555) 100-1234"
├─ Email: "owner@bluesalon.com"
└─ Invoice History
   └─ No invoices yet
```

### After Payment (Old Way - Broken)
```
Profile Page (same)
└─ Invoice History
   └─ Still empty ❌  ← stripe_customer_id was null
```

### After Payment (New Way - Fixed)
```
Profile Page (same)
└─ Invoice History
   ├─ December 2025         ✓ Paid   📥  ← NOW APPEARS!
   ├─ Dec 15, 2025
   └─ $50.00
```

---

## 🔗 Database Changes

### Before Fix
```
salons table
├─ id: 550e8400-...
├─ name: "Blue Salon"
├─ email: "owner@bluesalon.com"
└─ stripe_customer_id: NULL  ← Problem!
```

### After Sync
```
salons table
├─ id: 550e8400-...
├─ name: "Blue Salon"
├─ email: "owner@bluesalon.com"
└─ stripe_customer_id: "cus_OnOFqNlXrJMpUp"  ← Fixed!
```

---

## 🐛 Debugging Steps

If invoices still don't appear:

### Check 1: Verify Sync Happened

**In browser console (F12):**
```javascript
fetch('/api/profile')
  .then(r => r.json())
  .then(d => console.log('stripe_customer_id:', d.stripe_customer_id))

// Should show: stripe_customer_id: "cus_..."
// Not: stripe_customer_id: null
```

### Check 2: Verify Customer Exists in Stripe

**In Stripe Dashboard:**
1. Go to https://dashboard.stripe.com
2. Click "Customers" in left menu
3. Search for your email: `owner@bluesalon.com`
4. Should find the customer created by Buy Button
5. Click on customer to see their invoices

### Check 3: Check Server Logs

**Look for these messages:**
```
✅ Found Stripe customer: cus_...
📋 Found X invoices for this customer
```

**If you see this instead:**
```
❌ No Stripe customer found with email: owner@bluesalon.com
```

Then the email in your salon doesn't match the email used on Stripe Buy Button. Check the email matches!

### Check 4: Check API Response

**In browser DevTools (F12):**
1. Go to Network tab
2. Make a payment
3. Look for request to `sync-stripe-customer`
4. Check response:
   - Should show `success: true`
   - Should show `stripe_customer_id: "cus_..."`
   - Should show `invoices_count: > 0`

---

## 📋 Stripe Buy Button Email Issue

**Critical:** The email used in Stripe Buy Button must match your salon's email.

**If they don't match:**
- Payment still succeeds on Stripe
- Stripe creates customer with Buy Button email
- Sync looks for salon email
- No match found → Sync fails

**Solution:**
1. Update your salon email to match Buy Button account email, OR
2. Use consistent email for both

---

## ✅ Full Test Checklist

- [ ] Backend running with updated code
- [ ] Frontend running with updated code
- [ ] Make test payment ($50) with 4242 4242 4242 4242
- [ ] See redirect back to /profile?payment_success=true
- [ ] See message "Syncing invoices..."
- [ ] Check server logs for sync messages
- [ ] Invoice appears in Invoice History
- [ ] Invoice shows correct amount ($50.00)
- [ ] Invoice shows month name (December 2025)
- [ ] Invoice shows ✓ Paid status
- [ ] Download button works
- [ ] PDF opens from Stripe

---

## 🔐 Security Note

The sync endpoint:
- ✅ Requires JWT authentication
- ✅ Only syncs for authenticated user's salon
- ✅ Searches by email (which is public info in your salon account)
- ✅ Updates user's own database record only
- ✅ Safe to call multiple times

---

## 🚀 What Happens Next

1. **Automatic on each payment:**
   - Buy Button payment → Redirect → Auto-sync → Invoices appear

2. **Manual sync if needed:**
   - User can refresh page anytime
   - Syncs automatically run again if email matches

3. **Multiple payments:**
   - Each payment creates new invoice in Stripe
   - All invoices shown in Invoice History
   - Newest first

---

## 📝 Code Changes Summary

### Backend (server/routes/profile.js)
- ✅ Enhanced `/api/profile/invoices` with detailed logging
- ✅ Added new `POST /api/profile/sync-stripe-customer` endpoint
- ✅ Searches Stripe for customer by email
- ✅ Updates database with customer ID
- ✅ Returns invoice count and details

### Frontend (Profile.js)
- ✅ Detects payment success redirect
- ✅ Calls sync endpoint automatically
- ✅ Fetches invoices after sync
- ✅ Shows appropriate messages

---

## 🎯 Result

**Before:** Payments didn't show in invoice history  
**After:** Payments automatically linked and displayed

The system now:
- ✅ Syncs Stripe customer automatically
- ✅ Fetches real invoices from Stripe
- ✅ Displays with month names
- ✅ Links to official PDFs
- ✅ All automatic on payment redirect

---

## ❓ FAQ

**Q: Why wasn't this automatic before?**
A: The Stripe Buy Button bypasses your server for payment processing. The sync is only needed because the Buy Button doesn't call your checkout endpoint.

**Q: What if sync fails?**
A: Page still works, invoices just won't appear. User can:
- Check email matches in both systems
- Try refreshing page (syncs again)
- Or use the custom checkout instead of Buy Button

**Q: Can I manually trigger sync?**
A: Yes! Call this in browser console:
```javascript
fetch('/api/profile/sync-stripe-customer', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**Q: Does this work with multiple salons?**
A: Yes! Each salon's email is unique, so sync finds the right customer.

**Q: What about existing payments before this fix?**
A: They're still in Stripe. Once you sync, they'll all appear!

---

## 🎉 Summary

Your invoices should now appear automatically after payment! The system:
1. Detects payment redirect
2. Syncs Stripe customer by email
3. Fetches invoices
4. Displays with month names

**Try making a payment now and watch it appear!**

---

**Last Updated:** December 15, 2025  
**Status:** ✅ Fix Implemented & Ready to Test

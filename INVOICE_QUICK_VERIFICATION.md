# Invoice Functionality - Quick Verification Checklist

## ✅ Pre-Flight Checklist (Before Testing)

### Backend Configuration
- [ ] `.env.development` has `STRIPE_SECRET_KEY` set
- [ ] `.env.development` has `STRIPE_PUBLISHABLE_KEY` set  
- [ ] Backend running: `npm run dev` (from server folder)
- [ ] No errors in server terminal
- [ ] Server logs show "✅ Server running on port..."

### Frontend Configuration
- [ ] Frontend running: `npm start` (from client folder)
- [ ] No errors in frontend terminal
- [ ] App loads on `http://localhost:3000`
- [ ] Can navigate to Profile page

### Browser Readiness
- [ ] Logged into salon owner account
- [ ] On Profile page
- [ ] Developer Tools open (F12) for debugging
- [ ] Console tab visible for error checking

---

## 🧪 Step-by-Step Test (5 minutes)

### Step 1: Verify Profile Page Loads ✅
```
Expected: All sections visible
- Profile form (name, phone, email)
- Subscription card
- Invoice history (may be empty)
- Stripe "Subscribe Now" button
```

### Step 2: Check Invoice Endpoint ✅
```javascript
// In browser console (F12):
fetch('/api/profile/invoices')
  .then(r => r.json())
  .then(d => console.log('Invoices:', d))

// Expected output:
// Invoices: []  (empty array if no payments yet)
// OR
// Invoices: [{id: "in_123...", amount: 9900, date: "...", status: "paid"}, ...]
```

### Step 3: Verify Stripe Configuration ✅
```javascript
// In browser console:
fetch('/api/profile/debug')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))

// Expected output should show:
{
  "salon": {
    "id": "...",
    "name": "Your Salon",
    "stripe_customer_id": null or "cus_...",
    "subscription_status": "inactive"
  },
  "stripeInfo": {
    "hasStripeKey": true,
    "stripeCustomerId": null or "cus_..."
  }
}

// Note: stripe_customer_id may be null until first payment
```

### Step 4: Make Test Payment ✅
```
1. Click "Subscribe Now" button
2. Use test card: 4242 4242 4242 4242
3. Any future date (12/25)
4. Any CVC (123)
5. Click "Pay"
```

### Step 5: Verify Redirect ✅
```
Expected:
✓ Redirected back to http://localhost:3000/profile
✓ URL shows: ?payment_success=true
✓ Success message appears: "✓ Payment successful! Invoice is being processed."
```

### Step 6: Wait for Auto-Refresh ✅
```
Expected (2-3 seconds after payment):
✓ Success message disappears
✓ Scroll to "Invoice History" section
✓ Invoice appears with:
  - Today's date
  - Amount: $99.00
  - Status: ✓ Paid (green badge)
  - Download button (📥)
```

### Step 7: Test Manual Refresh ✅
```
1. Click ↻ button in Invoice History header
2. Wait for spinner to finish
3. Success message: "✓ Invoices refreshed!"

Expected: Invoice still visible
```

### Step 8: Download Invoice ✅
```
1. Click 📥 Download button on invoice
2. Check browser downloads folder
3. File named: invoice-in_XXXXX.pdf

Expected: PDF downloads successfully
```

---

## 🔍 Verification Checklist

### After completing all 8 steps above:

#### Frontend ✅
- [ ] Profile page loads without errors
- [ ] Stripe Buy Button visible and clickable
- [ ] Payment redirects to profile
- [ ] Success message appears after payment
- [ ] Invoices display in history section
- [ ] Refresh button works
- [ ] Download button works

#### Backend ✅
- [ ] No 500 errors in server logs
- [ ] Invoice fetch logs show: "📋 Fetching invoices for Stripe customer: cus_..."
- [ ] Database queries successful
- [ ] Stripe API calls successful

#### Stripe Integration ✅
- [ ] Payment processes successfully (no decline)
- [ ] Stripe customer created (visible in Stripe Dashboard)
- [ ] Invoice created (visible in Stripe Dashboard)
- [ ] Invoice returns to frontend

#### User Experience ✅
- [ ] Smooth redirect after payment
- [ ] Clear success messaging
- [ ] Invoices appear within 3 seconds
- [ ] Manual refresh provides feedback
- [ ] No console errors

---

## ❌ Troubleshooting

### Invoices Not Appearing?
```
Try in order:
1. Wait 5 seconds (Stripe may be processing)
2. Click ↻ refresh button
3. Check browser console (F12) for errors
4. Check server logs for error messages
5. Run debug endpoint: fetch('/api/profile/debug').then(r => r.json()).then(console.log)
```

### Payment Not Redirecting?
```
Try:
1. Check browser URL - should have ?payment_success=true
2. Check browser console for errors
3. Restart frontend: Ctrl+C in terminal, then npm start
4. Check Stripe Dashboard for payment confirmation
```

### "No invoices yet" Message?
```
Normal if:
- This is first payment and Stripe is still processing
- More than 5 seconds haven't passed

Try:
1. Click ↻ refresh button
2. Check Stripe Dashboard (https://dashboard.stripe.com) to verify payment succeeded
3. Check server logs for invoice fetch logs
```

### 401 Unauthorized Error?
```
Means: Session expired or not authenticated
Fix:
1. Reload page (Ctrl+R)
2. Log in again if needed
3. Try payment again
```

### 404 Not Found Error?
```
Means: Backend endpoint not responding
Fix:
1. Make sure backend is running: npm run dev
2. Check server terminal for errors
3. Restart backend: Ctrl+C, then npm run dev
```

---

## 📊 Status Dashboard

| Component | Status | Test |
|-----------|--------|------|
| Profile Page | ✅ Ready | Load page |
| Stripe Buy Button | ✅ Ready | Click button |
| Payment Processing | ✅ Ready | Complete payment |
| Redirect Logic | ✅ Ready | Check URL after payment |
| Auto-Refresh | ✅ Ready | Wait 2 seconds |
| Invoice Display | ✅ Ready | View history section |
| Manual Refresh | ✅ Ready | Click ↻ button |
| Invoice Download | ✅ Ready | Click 📥 button |

---

## 🎯 Success Criteria

✅ **All of these should be true after testing:**
- Payment completes without errors
- User redirects to profile with `?payment_success=true`
- Success message displays: "✓ Payment successful! Invoice is being processed."
- Invoice appears in "Invoice History" within 3 seconds
- Invoice shows: date, amount ($99.00), and "✓ Paid" status
- Refresh button works and shows success message
- Download button downloads PDF file
- No errors in browser console
- No errors in server logs

---

## 📞 Still Having Issues?

### Information to Gather for Debugging:

1. **Screenshot of error**
   - Shows exactly what you're seeing

2. **Browser console errors** (F12 → Console tab)
   - Copy-paste any red error messages

3. **Server log output**
   - Copy relevant lines from server terminal

4. **What step failed**
   - Reference the 8 steps above

5. **Test card used**
   - Was it 4242 4242 4242 4242?

6. **Environment**
   - Windows/Mac/Linux
   - Node version: `node --version`
   - npm version: `npm --version`

---

## ✅ Implementation Verification

**All code components are in place:**

```javascript
// Frontend invoice fetching (Profile.js)
const fetchInvoices = async () => { ... }  ✅

// Backend invoice API (server/routes/profile.js)
router.get('/invoices', async (req, res) => { ... })  ✅

// Auto-refresh on payment detection (Profile.js useEffect)
if (urlParams.get('payment_success')) { ... }  ✅

// Stripe Buy Button (client/public/index.html)
<stripe-buy-button ... />  ✅

// Manual refresh button (Profile.js)
<button onClick={handleRefreshInvoices} />  ✅

// Invoice display (Profile.js)
{invoices.map((invoice) => (...))}  ✅
```

---

**Testing Date:** _______________  
**Tester Name:** _______________  
**All Tests Passed:** ☐ YES   ☐ NO  
**Notes:** _______________________________________________

---

**Ready to test! Use this as your reference guide. ✅**

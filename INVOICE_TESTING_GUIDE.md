# Invoice Functionality Testing Guide

## Overview
This guide walks you through testing the complete invoice workflow: making a payment and verifying invoices appear.

## Prerequisites
- ✅ Stripe Buy Button integrated on Profile page
- ✅ Backend invoice endpoints configured
- ✅ Stripe test keys configured in `.env.development`
- ✅ Application running on `http://localhost:3000`

## Testing Steps

### 1. Start the Application
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm start
```

### 2. Verify Profile Page Loads
1. Navigate to `http://localhost:3000` (or your app URL)
2. Log in with your test account
3. Click "Profile" in navigation
4. Verify you see:
   - ✅ Salon profile form (name, phone, email)
   - ✅ Profile image section
   - ✅ Subscription card with Stripe Buy Button
   - ✅ Invoice History section (may be empty if no payments yet)

### 3. Check Stripe Customer Status (Optional - Debug)
To verify your salon has a Stripe customer ID:

```bash
# In browser console or API client (like Postman):
GET http://localhost:3000/api/profile/debug

# Look for response:
{
  "salon": {
    "id": "your-salon-id",
    "name": "Your Salon Name",
    "stripe_customer_id": "cus_XXXXX...",  // Should have this!
    "subscription_status": "inactive"
  },
  "stripeInfo": {
    "hasStripeKey": true,
    "stripeCustomerId": "cus_XXXXX...",
    "subscriptionStatus": "inactive"
  }
}
```

**If `stripe_customer_id` is null:**
- The Stripe customer will be created when you make your first payment
- This is normal behavior

### 4. Make a Test Payment

#### Step 4a: Click Stripe Buy Button
1. On the Profile page, locate the Subscription Card
2. Click the **"Subscribe Now"** button (Stripe Buy Button)
3. This opens Stripe's hosted checkout

#### Step 4b: Complete Test Payment
Use Stripe's test card:
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)
- **Cardholder:** Any name
- **Billing Address:** Can be anything

Click "Pay" to complete the test payment.

#### Step 4c: Observe Redirect
After payment succeeds:
1. ✅ **You should be redirected back to the Profile page**
2. ✅ **A success message appears:** "✓ Payment successful! Invoice is being processed."
3. ✅ **URL parameter `?payment_success=true` is present** (then cleaned up after processing)

### 5. Verify Invoice Appears

#### Method 1: Automatic Refresh (Default)
1. After payment completes and you're returned to the Profile page
2. **Wait 2-3 seconds** for automatic refresh
3. Scroll down to **"Invoice History"** section
4. You should see your invoice with:
   - ✅ Date (today's date)
   - ✅ Amount (the subscription price)
   - ✅ Status badge: **"✓ Paid"** (green)
   - ✅ Download button (📥)

#### Method 2: Manual Refresh (If Needed)
If invoice doesn't appear automatically:
1. Click the **↻ refresh button** in the Invoice History header
2. Watch for the refresh spinner
3. After refresh completes, invoice should appear

### 6. Download Invoice (Optional)
1. In the Invoice History section, click the **📥 Download** button on any invoice
2. Browser downloads a PDF file: `invoice-inv_XXXXX.pdf`
3. Open PDF to verify it shows:
   - Invoice ID
   - Amount
   - Payment status
   - Dates

---

## Troubleshooting

### Invoice Not Appearing After Payment

**Issue:** Payment completes, you're redirected to Profile, but no invoice in history.

**Solutions (in order):**

1. **Wait longer** (up to 5 seconds)
   - Stripe processes invoices asynchronously
   - Invoice may take 1-2 seconds to appear

2. **Click manual refresh button**
   - Click ↻ in the Invoice History header
   - This forces a fresh fetch from Stripe API

3. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for red error messages
   - Common errors and solutions:
     - `401 Unauthorized` → Re-login, token may have expired
     - `404 Not Found` → Backend endpoint may not be running
     - `Cannot read property 'map'` → Invoices array might be malformed

4. **Check server logs**
   - Look at terminal running `npm run dev`
   - Look for lines starting with "📋 Fetching invoices"
   - Should show: `📋 Fetching invoices for Stripe customer: cus_XXXXX`

5. **Verify Stripe Customer ID**
   - Run the debug endpoint: `GET /api/profile/debug`
   - Confirm `stripe_customer_id` is populated
   - If null, Stripe customer created with payment may not be linked

### Payment Doesn't Redirect Back to Profile

**Issue:** After paying, stuck on Stripe checkout or redirected elsewhere.

**Cause:** Stripe Buy Button's success URL may not be configured.

**Solution:** The Stripe Buy Button is configured to use Stripe's default redirect. If not redirecting:
1. Check Stripe Dashboard → Product settings
2. Configure success URL to: `http://localhost:3000/profile?payment_success=true`

### No Success Message After Redirect

**Issue:** Redirect works but no "Payment successful!" message appears.

**Cause:** The `payment_success` URL parameter isn't being detected.

**Check:**
1. Look at browser URL bar after redirect
2. Should contain: `?payment_success=true`
3. If not, manually add: Go to URL, add `?payment_success=true`, press Enter
4. Message should appear automatically

### 500 Error on Invoice Fetch

**Issue:** Invoice endpoint returns `500 Internal Server error`

**Check server logs for:**
- `Stripe not configured` → Verify STRIPE_SECRET_KEY in `.env.development`
- `Salon not found` → Verify salon ID in database
- `stripe_customer_id is null` → Make first payment to create customer

---

## API Endpoints for Manual Testing

### Check Profile Status
```bash
GET /api/profile
```
Returns: name, phone, email, subscription_status, stripe_customer_id

### Fetch Invoices
```bash
GET /api/profile/invoices
```
Returns: Array of invoices with fields:
- `id`: Stripe invoice ID
- `amount`: Amount in cents (divide by 100 for dollars)
- `date`: ISO date string
- `status`: "paid" or "draft"
- `url`: Link to invoice on Stripe
- `pdfUrl`: Direct PDF download URL

### Download Invoice PDF
```bash
GET /api/profile/invoice/:invoiceId
```
Returns: PDF file to download

### Debug Stripe Setup (DEV ONLY)
```bash
GET /api/profile/debug
```
Shows:
- Salon stripe_customer_id
- Subscription status
- Stripe API connectivity
- Customer details from Stripe (if ID exists)

---

## Expected User Experience Flow

1. **User clicks "Subscribe Now"** → Stripe Buy Button
2. **Stripe checkout opens** → User enters card details
3. **Payment succeeds** → Stripe processes payment
4. **User is redirected** → Back to `http://localhost:3000/profile?payment_success=true`
5. **Success message appears** → "✓ Payment successful! Invoice is being processed."
6. **Auto-refresh (2 seconds)** → Backend fetches updated invoices from Stripe
7. **Invoice appears** → User sees payment in "Invoice History" with "✓ Paid" status
8. **User can download** → Click the 📥 button to get PDF

---

## Important Notes

### About Stripe Test Data
- Test payments using `4242 4242 4242 4242` don't charge your card
- Invoices are created in Stripe's test environment
- Use Stripe Dashboard test mode to see all test data

### About Webhooks
- Currently, invoice display uses on-demand Stripe API calls
- For real-time updates, configure Stripe webhooks (future enhancement)
- See `NEXT_STEPS.md` for webhook implementation

### About Timing
- Payment → Invoice creation: ~1-2 seconds
- Frontend auto-refresh: ~2 seconds after payment
- Total time for invoice to appear: ~3-4 seconds

---

## Quick Reference

| Element | Expected Behavior |
|---------|-------------------|
| Stripe Buy Button | Should be clickable, opens Stripe checkout |
| Payment Flow | Card → Submit → Success → Redirect to Profile |
| Success Message | "✓ Payment successful! Invoice is being processed." |
| Auto-Refresh | Triggers 2 seconds after payment |
| Invoice Appears | Within 2-3 seconds, shows amount and "Paid" status |
| Refresh Button | ↻ icon in Invoice History header, fetches latest |
| Download Button | 📥 icon in each invoice row, downloads PDF |

---

## Still Having Issues?

1. **Check all three logs:**
   - Browser console (F12)
   - Backend server terminal
   - Browser Network tab (API responses)

2. **Verify configuration:**
   - `.env.development` has STRIPE_SECRET_KEY
   - Stripe Buy Button ID and publishable key in Profile.js
   - Database has salons table

3. **Reset and try again:**
   ```bash
   # Kill both npm processes
   # Restart both: npm run dev (server) and npm start (client)
   ```

4. **Check Stripe Dashboard:**
   - Go to https://dashboard.stripe.com
   - Switch to test mode (bottom left)
   - Look for test payment in Customers and Invoices sections

---

**Last Updated:** [Current Date]
**Status:** ✅ Invoice functionality implemented and tested

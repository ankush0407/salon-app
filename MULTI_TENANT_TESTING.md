# Multi-Tenant Implementation - Testing Guide

## Pre-Testing Checklist

Before testing the multi-tenant implementation:

1. ✅ Ensure database is running (PostgreSQL/Neon)
2. ✅ Backend server is running on port 5000
3. ✅ Frontend is running on port 3000
4. ✅ All code changes have been applied (see MULTI_TENANT_IMPLEMENTATION.md)
5. ✅ No compilation errors in frontend or backend

## Test Scenarios

### Scenario 1: Create Two Independent Salon Accounts

#### Step 1A: Create Blue Salon Account
1. Navigate to `http://localhost:3000`
2. Click **"Don't have an account? Register"**
3. Fill in the registration form:
   - **Salon Name**: Blue Salon
   - **Phone**: (555) 100-1234
   - **Address**: 123 Main St, Downtown City, ST 12345
   - **Email**: owner@bluesalon.com
   - **Password**: BlueSalon123!
4. Click **"Create Account"**
5. ✅ Expected Result: Login successful, redirected to Owner Portal for Blue Salon

#### Step 1B: Create Red Salon Account
1. Click **"Logout"** button
2. Click **"Don't have an account? Register"**
3. Fill in the registration form:
   - **Salon Name**: Red Salon
   - **Phone**: (555) 200-5678
   - **Address**: 456 Oak Ave, Uptown City, ST 54321
   - **Email**: owner@redsalon.com
   - **Password**: RedSalon456!
4. Click **"Create Account"**
5. ✅ Expected Result: Login successful, redirected to Owner Portal for Red Salon

### Scenario 2: Verify Data Isolation (Customers)

#### Step 2A: Add Customers to Red Salon
1. You should be logged in as Red Salon owner
2. Click **"Add Customer"** button
3. Add first customer:
   - **Full Name**: Alice Johnson
   - **Email**: alice@example.com
   - **Phone**: (555) 201-1111
4. Click **"Add Customer"** and repeat for:
   - **Name**: Bob Smith
   - **Email**: bob@example.com
   - **Phone**: (555) 201-2222
5. ✅ Expected Result: Both customers appear in Red Salon's customer list

#### Step 2B: Verify Blue Salon Has No Customers
1. Click **"Logout"**
2. Click **"Sign In"** (or fill in if form is empty)
3. Enter Blue Salon credentials:
   - **Email**: owner@bluesalon.com
   - **Password**: BlueSalon123!
4. Click **"Sign In"**
5. ✅ Expected Result: Owner Portal shows **NO customers** (list is empty)

#### Step 2C: Add Different Customers to Blue Salon
1. Click **"Add Customer"** button
2. Add first customer:
   - **Full Name**: Charlie Brown
   - **Email**: charlie@example.com
   - **Phone**: (555) 300-3333
3. Click **"Add Customer"** and repeat for:
   - **Name**: Diana Prince
   - **Email**: diana@example.com
   - **Phone**: (555) 300-4444
4. ✅ Expected Result: Both customers appear in Blue Salon's customer list

#### Step 2D: Re-verify Red Salon Data
1. Click **"Logout"**
2. Login as Red Salon owner again
   - **Email**: owner@redsalon.com
   - **Password**: RedSalon456!
3. ✅ Expected Result: Red Salon shows **ONLY** Alice and Bob (NOT Charlie and Diana)

### Scenario 3: Email Uniqueness Per Salon

#### Step 3A: Add Shared Email to Red Salon
1. You should be logged in as Red Salon
2. Click **"Add Customer"** button
3. Add customer:
   - **Full Name**: Eve Wilson
   - **Email**: shared@example.com
   - **Phone**: (555) 201-5555
4. Click submit
5. ✅ Expected Result: Customer added successfully

#### Step 3B: Try Duplicate Email in Red Salon (Should Fail)
1. Click **"Add Customer"** button again
2. Try to add customer with same email:
   - **Full Name**: Frank Miller
   - **Email**: shared@example.com
   - **Phone**: (555) 201-6666
3. Click submit
4. ❌ Expected Result: Error message "A customer with this email already exists"

#### Step 3C: Add Same Email to Blue Salon (Should Succeed)
1. Click **"Logout"**
2. Login as Blue Salon owner
   - **Email**: owner@bluesalon.com
   - **Password**: BlueSalon123!
3. Click **"Add Customer"** button
4. Add customer with same email as Red Salon:
   - **Full Name**: Grace Lee
   - **Email**: shared@example.com
   - **Phone**: (555) 300-5555
5. Click submit
6. ✅ Expected Result: Customer added successfully (different salon, same email is OK)

### Scenario 4: Subscription Types Per Salon

#### Step 4A: Create Subscription Types for Blue Salon
1. You should be logged in as Blue Salon
2. Click **"Manage Packages"** button
3. Create first package:
   - **Name**: Basic Package
   - **Price**: $50
   - **Visits**: 4
4. Click **"Add Package"**
5. Create second package:
   - **Name**: Premium Package
   - **Price**: $100
   - **Visits**: 8
6. Click **"Add Package"**
7. ✅ Expected Result: Both packages appear in existing list

#### Step 4B: Verify Red Salon Has Different Packages
1. Click **"Logout"**
2. Login as Red Salon owner
   - **Email**: owner@redsalon.com
   - **Password**: RedSalon456!
3. Click **"Manage Packages"** button
4. ✅ Expected Result: List is empty (no packages created for Red Salon)

#### Step 4C: Create Different Packages for Red Salon
1. Create first package:
   - **Name**: Starter Package
   - **Price**: $30
   - **Visits**: 2
2. Click **"Add Package"**
3. Create second package:
   - **Name**: Ultimate Package
   - **Price**: $150
   - **Visits**: 12
4. Click **"Add Package"**
5. ✅ Expected Result: Red Salon packages appear (Basic, Premium NOT visible)

#### Step 4D: Re-verify Blue Salon Packages
1. Click **"Logout"**
2. Login as Blue Salon owner
   - **Email**: owner@bluesalon.com
   - **Password**: BlueSalon123!
3. Click **"Manage Packages"** button
4. ✅ Expected Result: Only shows "Basic Package" and "Premium Package" (not Red's packages)

### Scenario 5: Subscriptions Are Salon-Specific

#### Step 5A: Add Subscriptions to Blue Salon Customer
1. You should be logged in as Blue Salon
2. Click on customer **"Charlie Brown"**
3. Click **"Add Subscription"** button
4. Select **"Basic Package"** (4 visits)
5. Click **"Add Subscription"**
6. ✅ Expected Result: Subscription appears for Charlie

#### Step 5B: Verify Subscriptions Don't Cross Salons
1. Click **"Logout"**
2. Login as Red Salon owner
3. Click on customer **"Alice Johnson"**
4. Click **"Add Subscription"** button
5. Try to select package
6. ✅ Expected Result: Only Red Salon's packages available (Starter, Ultimate)
7. Select **"Starter Package"** and add subscription
8. ✅ Expected Result: Subscription added for Alice with Starter Package

### Scenario 6: Visit Redeeming Is Salon-Protected

#### Step 6A: Redeem Visit in Blue Salon
1. You should be logged in as Blue Salon
2. Click on customer **"Charlie Brown"**
3. Find subscription **"Basic Package"** with "0 / 4 visits"
4. Click **"Redeem Visit"** button
5. Add optional note: "Haircut with styling"
6. Click **"Redeem Visit"**
7. ✅ Expected Result: Visit count updates to "1 / 4 visits"

#### Step 6B: Verify Visit Count
1. Verify the subscription now shows **"1 / 4 visits used"**
2. ✅ Expected Result: Progress bar shows 25% completion

#### Step 6C: Cross-Salon Visit Isolation
1. Click **"Logout"**
2. Login as Red Salon owner
3. Click on customer **"Alice Johnson"**
4. Find subscription **"Starter Package"** with "0 / 2 visits"
5. This should NOT be affected by Blue Salon's visit redemptions
6. ✅ Expected Result: Red Salon visit count is independent (still 0/2)

### Scenario 7: Authentication Failure Cases

#### Step 7A: Wrong Password
1. Navigate to login screen
2. Enter:
   - **Email**: owner@bluesalon.com
   - **Password**: WrongPassword
3. Click **"Sign In"**
4. ❌ Expected Result: Error message appears

#### Step 7B: Non-Existent Email
1. Navigate to login screen
2. Enter:
   - **Email**: nonexistent@salon.com
   - **Password**: SomePassword
3. Click **"Sign In"**
4. ❌ Expected Result: Error message appears

#### Step 7C: Register with Existing Email
1. Navigate to registration screen
2. Try to create account with email of existing salon owner:
   - **Salon Name**: Duplicate Test
   - **Phone**: (555) 999-9999
   - **Address**: 999 Fake St
   - **Email**: owner@bluesalon.com (already exists)
   - **Password**: NewPassword
3. Click **"Create Account"**
4. ❌ Expected Result: Error message (email must be unique globally for registration)

## Backend Testing with cURL (Optional)

### Test 1: Register Salon
```bash
curl -X POST http://localhost:5000/api/auth/register-salon \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Salon",
    "email": "test@salon.com",
    "phone": "(555) 111-1111",
    "address": "Test Address",
    "password": "test123"
  }'
```

### Test 2: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@salon.com",
    "password": "test123"
  }'
```
✅ Expected Response: `{ token, user, salon_id, salon_name }`

### Test 3: Get Customers (Salon-Protected)
```bash
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer <token_from_step_2>"
```
✅ Expected Response: Only customers for that salon

## Success Criteria

All tests have passed when:

1. ✅ Two salons can be registered independently
2. ✅ Each salon's customers are isolated (not visible to other salons)
3. ✅ Email addresses can be reused across salons (but not within a salon)
4. ✅ Subscription types are per-salon
5. ✅ Subscriptions are linked to correct salon's customers and types
6. ✅ Visit redemptions are isolated by salon
7. ✅ Authentication rejects invalid credentials
8. ✅ JWT tokens include salon_id
9. ✅ API endpoints return 403 Forbidden when accessing other salon's data
10. ✅ No data leakage between salons

## Troubleshooting

### Issue: "Access denied" error
- **Cause**: Trying to access data from different salon
- **Solution**: This is expected behavior! Verify you're logged in as correct salon

### Issue: Customer appears in both salons
- **Cause**: Data isolation not working
- **Solution**: Check that `WHERE salon_id = $1` is in all queries

### Issue: Registration fails
- **Cause**: Email already exists globally
- **Solution**: Use a unique email for each salon owner

### Issue: Package doesn't appear when adding subscription
- **Cause**: Package belongs to different salon
- **Solution**: Create package in the correct salon first

### Issue: "401 Unauthorized"
- **Cause**: Token expired or invalid
- **Solution**: Log out and log back in to get fresh token

## Database Verification (Optional)

To verify data isolation at database level:

```sql
-- Check salons created
SELECT id, name, email FROM salons;

-- Check customers per salon
SELECT c.id, c.name, c.email, c.salon_id, s.name as salon_name 
FROM customers c
JOIN salons s ON c.salon_id = s.id;

-- Verify email uniqueness per salon
SELECT salon_id, email, COUNT(*) 
FROM customers 
GROUP BY salon_id, email 
HAVING COUNT(*) > 1;

-- Check subscriptions linked correctly
SELECT sub.id, sub.customer_id, c.name as customer, c.salon_id, s.name as salon
FROM subscriptions sub
JOIN customers c ON sub.customer_id = c.id
JOIN salons s ON c.salon_id = s.id;
```

## Next Steps After Testing

After all tests pass:

1. Document any issues found in a bug report
2. Deploy to production if all tests successful
3. Create user documentation for salon owners
4. Set up monitoring for cross-salon access attempts
5. Consider adding audit logging for security


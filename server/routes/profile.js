const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

// Function to get Stripe instance (lazy loading to ensure env vars are loaded)
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware to ensure authentication
router.use(authenticateToken);

/**
 * GET /profile
 * Fetch salon profile details including subscription status
 */
router.get('/', async (req, res) => {
  try {
    const salonId = req.salonId;
    
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rows } = await db.query(
      'SELECT id, name, phone, email, salon_image_url, subscription_status, stripe_customer_id FROM salons WHERE id = $1',
      [salonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /profile
 * Update salon profile details and image
 */
router.put('/', upload.single('salonImage'), async (req, res) => {
  try {
    const salonId = req.salonId;

    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, phone, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Salon name is required' });
    }

    // Get current salon data to preserve image URL if not updated
    const { rows: currentSalon } = await db.query(
      'SELECT salon_image_url FROM salons WHERE id = $1',
      [salonId]
    );

    let salonImageUrl = currentSalon[0]?.salon_image_url;

    // Update image URL if a new file is uploaded
    if (req.file) {
      salonImageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.salon_image_url) {
      salonImageUrl = req.body.salon_image_url;
    }

    const { rows } = await db.query(
      `UPDATE salons 
       SET name = $1, phone = $2, email = $3, salon_image_url = $4 
       WHERE id = $5 
       RETURNING id, name, phone, email, salon_image_url, subscription_status, stripe_customer_id`,
      [name.trim(), phone || null, email || null, salonImageUrl, salonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/profile/create-checkout-session
 * Create a Stripe Checkout session for salon subscription
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    // Get Stripe instance (lazy load)
    const stripe = getStripe();
    if (!stripe) {
      console.error('❌ Stripe not configured - STRIPE_SECRET_KEY missing');
      return res.status(500).json({ 
        error: 'Stripe is not configured. Please contact support.',
        details: 'STRIPE_SECRET_KEY is missing from environment'
      });
    }

    const salonId = req.salonId;

    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch salon data
    const { rows: salons } = await db.query(
      'SELECT id, name, email, stripe_customer_id FROM salons WHERE id = $1',
      [salonId]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salons[0];
    let stripeCustomerId = salon.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: salon.email,
        name: salon.name,
        metadata: {
          salon_id: salon.id.toString(),
        },
      });

      stripeCustomerId = customer.id;

      // Update salon with Stripe customer ID
      await db.query(
        'UPDATE salons SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, salonId]
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Salon Tracker Pro - Monthly Subscription',
              description: 'Access all features for your salon',
            },
            unit_amount: 9900, // $99.00 per month
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
      metadata: {
        salon_id: salon.id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * GET /api/profile/invoices
 * Fetch invoice history for the salon from Stripe
 */
router.get('/invoices', async (req, res) => {
  try {
    // Get Stripe instance (lazy load)
    const stripe = getStripe();
    if (!stripe) {
      // If Stripe not configured, return empty list
      console.warn('⚠️ Stripe not configured - returning empty invoices');
      return res.json([]);
    }

    const salonId = req.salonId;

    if (!salonId) {
      console.error('❌ No salonId in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`🔍 Fetching invoices for salon: ${salonId}`);

    // Get stripe customer ID
    const { rows } = await db.query(
      'SELECT id, name, stripe_customer_id FROM salons WHERE id = $1',
      [salonId]
    );

    if (rows.length === 0) {
      console.error(`❌ Salon not found: ${salonId}`);
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = rows[0];
    const stripeCustomerId = salon.stripe_customer_id;

    console.log(`📊 Salon found: "${salon.name}" (${salon.id})`);
    console.log(`💳 Stripe customer ID: ${stripeCustomerId || 'NOT SET'}`);

    if (!stripeCustomerId) {
      // No Stripe customer yet, return empty list
      console.log(`⚠️ Salon has no Stripe customer ID yet - invoices will appear after first payment`);
      return res.json([]);
    }

    console.log(`📋 Fetching invoices from Stripe for customer: ${stripeCustomerId}`);

    // Fetch invoices from Stripe
    const invoicesResponse = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 50,
    });

    console.log(`✅ Stripe returned ${invoicesResponse.data.length} invoices`);

    if (invoicesResponse.data.length > 0) {
      invoicesResponse.data.forEach((inv) => {
        console.log(`   - Invoice ${inv.id}: $${(inv.amount_paid / 100).toFixed(2)} (${inv.status})`);
      });
    }

    // Format invoices for frontend
    const formattedInvoices = invoicesResponse.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid || invoice.total,
      date: new Date(invoice.created * 1000),
      status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'open' ? 'Open' : 'Pending',
      url: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
    }));

    console.log(`📤 Returning ${formattedInvoices.length} formatted invoices to frontend`);
    res.json(formattedInvoices);
  } catch (error) {
    console.error('❌ Error fetching invoices:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices', details: error.message });
  }
});

/**
 * GET /api/profile/invoice/:invoiceId
 * Download a specific invoice PDF from Stripe
 */
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    // Get Stripe instance (lazy load)
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe is not configured.' 
      });
    }

    const { invoiceId } = req.params;
    const salonId = req.salonId;

    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify invoice belongs to this salon
    const { rows } = await db.query(
      'SELECT stripe_customer_id FROM salons WHERE id = $1',
      [salonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const stripeCustomerId = rows[0].stripe_customer_id;

    // Fetch invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify invoice belongs to this salon's customer
    if (invoice.customer !== stripeCustomerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If PDF URL exists, redirect to it
    if (invoice.invoice_pdf) {
      return res.json({ pdfUrl: invoice.invoice_pdf });
    }

    res.status(404).json({ error: 'Invoice PDF not available' });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * GET /profile/debug
 * Comprehensive debug endpoint to investigate Stripe customer & invoices
 * This endpoint requires authentication
 */
router.get('/debug', async (req, res) => {
  try {
    const salonId = req.salonId;
    
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized - No salon ID found' });
    }

    const { rows } = await db.query(
      'SELECT id, name, email, stripe_customer_id, subscription_status FROM salons WHERE id = $1',
      [salonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = rows[0];
    const stripe = getStripe();

    console.log(`\n🔍 DEBUG REPORT FOR SALON: ${salon.name}`);
    console.log(`📧 Salon Email: ${salon.email}`);
    console.log(`💳 DB Stripe Customer ID: ${salon.stripe_customer_id || 'NULL'}`);

    let debugReport = {
      salon: {
        id: salon.id,
        name: salon.name,
        email: salon.email,
        stripe_customer_id: salon.stripe_customer_id,
        subscription_status: salon.subscription_status,
      },
      stripeApi: {
        configured: !!stripe,
        secretKeySet: !!process.env.STRIPE_SECRET_KEY,
      },
      customers: [],
      invoices: [],
      warnings: [],
    };

    if (!stripe) {
      console.error('❌ Stripe not configured');
      debugReport.warnings.push('Stripe API not configured');
      return res.json(debugReport);
    }

    // 1. Search for customer by email
    console.log(`\n🔍 Searching Stripe for customer with email: ${salon.email}`);
    const customersByEmail = await stripe.customers.list({
      email: salon.email,
      limit: 10,
    });

    console.log(`📋 Found ${customersByEmail.data.length} customer(s) with this email`);

    if (customersByEmail.data.length === 0) {
      debugReport.warnings.push(`No customer found in Stripe with email: ${salon.email}`);
    }

    // 2. List all customers found by email
    for (const customer of customersByEmail.data) {
      console.log(`   - Customer ID: ${customer.id}`);
      console.log(`     Created: ${new Date(customer.created * 1000).toISOString()}`);
      console.log(`     Email: ${customer.email}`);
      
      debugReport.customers.push({
        id: customer.id,
        email: customer.email,
        created: new Date(customer.created * 1000).toISOString(),
        isInDatabase: customer.id === salon.stripe_customer_id,
      });

      // Get invoices for each customer
      console.log(`\n   📋 Fetching invoices for customer ${customer.id}:`);
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 50,
      });

      console.log(`      Found ${invoices.data.length} invoice(s)`);

      if (invoices.data.length === 0) {
        console.log(`      No invoices for this customer`);
      }

      for (const invoice of invoices.data) {
        const amount = (invoice.amount_paid || invoice.total) / 100;
        const invoiceDate = new Date(invoice.created * 1000).toISOString();
        
        console.log(`      - Invoice ${invoice.id}`);
        console.log(`        Amount: $${amount.toFixed(2)}`);
        console.log(`        Date: ${invoiceDate}`);
        console.log(`        Status: ${invoice.status}`);
        console.log(`        Has PDF: ${!!invoice.invoice_pdf}`);

        debugReport.invoices.push({
          customer_id: customer.id,
          invoice_id: invoice.id,
          amount: amount,
          date: invoiceDate,
          status: invoice.status,
          hasPdf: !!invoice.invoice_pdf,
          pdfUrl: invoice.invoice_pdf,
        });
      }
    }

    // 3. If salon has a customer ID in database, also check that specific customer
    if (salon.stripe_customer_id) {
      console.log(`\n🔎 Checking database customer ID: ${salon.stripe_customer_id}`);
      try {
        const dbCustomer = await stripe.customers.retrieve(salon.stripe_customer_id);
        console.log(`✅ Found in Stripe: ${dbCustomer.email}`);
        console.log(`   Created: ${new Date(dbCustomer.created * 1000).toISOString()}`);

        // Check if this customer was already found by email search
        const alreadyFound = customersByEmail.data.some(c => c.id === dbCustomer.id);
        if (!alreadyFound) {
          console.log(`⚠️  This customer NOT found in email search!`);
          debugReport.warnings.push(`Database customer ${dbCustomer.id} not found by email search`);
        }
      } catch (error) {
        console.error(`❌ Error retrieving customer ${salon.stripe_customer_id}: ${error.message}`);
        debugReport.warnings.push(`Failed to retrieve customer ${salon.stripe_customer_id}: ${error.message}`);
      }
    }

    // Summary
    console.log(`\n📊 DEBUG SUMMARY:`);
    console.log(`   Customers found: ${debugReport.customers.length}`);
    console.log(`   Total invoices: ${debugReport.invoices.length}`);
    console.log(`   Warnings: ${debugReport.warnings.length}`);

    res.json(debugReport);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Debug error', details: error.message });
  }
});

/**
 * POST /api/profile/sync-stripe-customer
 * Sync Stripe customer ID by finding customer by email
 * This is needed when using Stripe Buy Button (payment happens outside our server)
 */
router.post('/sync-stripe-customer', async (req, res) => {
  try {
    console.log(`\n📱 SYNC ENDPOINT CALLED`);
    
    const stripe = getStripe();
    if (!stripe) {
      console.error('❌ Stripe not configured');
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const salonId = req.salonId;
    console.log(`🔑 Salon ID from token: ${salonId}`);
    
    if (!salonId) {
      console.error('❌ No salonId in token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get salon info
    const { rows } = await db.query(
      'SELECT id, name, email, stripe_customer_id FROM salons WHERE id = $1',
      [salonId]
    );

    if (rows.length === 0) {
      console.error(`❌ Salon not found with ID: ${salonId}`);
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = rows[0];
    console.log(`📋 Found salon: ${salon.name}`);
    console.log(`📧 Salon email: ${salon.email}`);
    console.log(`💳 Current DB customer ID: ${salon.stripe_customer_id || 'NULL'}`);

    // If already has customer ID, still update subscription status to active
    if (salon.stripe_customer_id) {
      console.log(`✅ Salon already has Stripe customer ID: ${salon.stripe_customer_id}`);
      
      // Ensure subscription status is active
      if (salon.subscription_status !== 'active') {
        console.log(`⚠️ Subscription status was ${salon.subscription_status}, updating to active...`);
        await db.query(
          'UPDATE salons SET subscription_status = $1 WHERE id = $2',
          ['active', salonId]
        );
        console.log(`✅ Subscription status updated to: active`);
      }
      
      return res.json({
        success: true,
        message: 'Salon already linked to Stripe customer',
        stripe_customer_id: salon.stripe_customer_id,
        email: salon.email,
        subscription_status: 'active',
      });
    }

    // Search for customer by email in Stripe
    console.log(`\n🔍 Searching Stripe for customer with email: ${salon.email}`);
    const customers = await stripe.customers.list({
      email: salon.email,
      limit: 10,
    });

    console.log(`📊 Found ${customers.data.length} customer(s) in Stripe with this email`);

    if (customers.data.length > 0) {
      // Show all customers found
      customers.data.forEach((cust, idx) => {
        console.log(`   [${idx + 1}] ${cust.id} - Created: ${new Date(cust.created * 1000).toISOString()}`);
      });

      const stripeCustomer = customers.data[0];
      console.log(`\n✅ Using first customer: ${stripeCustomer.id}`);

      // Update salon with this customer ID AND set subscription status to active
      console.log(`💾 Updating database...`);
      const updateResult = await db.query(
        'UPDATE salons SET stripe_customer_id = $1, subscription_status = $2 WHERE id = $3 RETURNING stripe_customer_id, subscription_status',
        [stripeCustomer.id, 'active', salonId]
      );

      console.log(`✅ Database updated with customer ID: ${stripeCustomer.id}`);
      console.log(`✅ Subscription status set to: active`);

      // Get invoices for this customer
      console.log(`\n📋 Fetching invoices for customer ${stripeCustomer.id}...`);
      const invoices = await stripe.invoices.list({
        customer: stripeCustomer.id,
        limit: 50,
      });

      console.log(`✅ Found ${invoices.data.length} invoice(s):`);
      invoices.data.forEach(inv => {
        const amount = (inv.amount_paid || inv.total) / 100;
        console.log(`   - ${inv.id}: $${amount.toFixed(2)} (${inv.status})`);
      });

      return res.json({
        success: true,
        message: 'Stripe customer linked successfully',
        stripe_customer_id: stripeCustomer.id,
        email: stripeCustomer.email,
        invoices_count: invoices.data.length,
        invoices: invoices.data.map((inv) => ({
          id: inv.id,
          amount: inv.amount_paid || inv.total,
          date: new Date(inv.created * 1000),
          status: inv.status,
        })),
      });
    } else {
      console.log(`\n❌ NO CUSTOMERS FOUND in Stripe with email: ${salon.email}`);
      console.log(`⚠️  This means either:`);
      console.log(`   1. No payment was made yet`);
      console.log(`   2. Payment was made to a DIFFERENT email address`);
      console.log(`   3. Payment was made but not yet synced to Stripe`);
      return res.status(404).json({
        error: 'No Stripe customer found',
        message: `No customer found in Stripe with email: ${salon.email}`,
        suggestion: 'Make sure you have made a payment using the Stripe Buy Button with this exact email',
      });
    }
  } catch (error) {
    console.error('❌ ERROR in sync endpoint:', error.message);
    console.error('   Full error:', error);
    res.status(500).json({ error: 'Failed to sync Stripe customer', details: error.message });
  }
});

/**
 * POST /api/profile/reset-stripe
 * Reset Stripe customer ID - useful for testing/starting fresh
 * WARNING: This clears the stripe_customer_id from the database
 */
router.post('/reset-stripe', async (req, res) => {
  try {
    const salonId = req.salonId;
    
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current salon info
    const { rows: salonRows } = await db.query(
      'SELECT id, name, email, stripe_customer_id FROM salons WHERE id = $1',
      [salonId]
    );

    if (salonRows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salonRows[0];
    const previousCustomerId = salon.stripe_customer_id;

    // Reset the stripe_customer_id to NULL
    await db.query(
      'UPDATE salons SET stripe_customer_id = NULL WHERE id = $1',
      [salonId]
    );

    console.log(`🔄 RESET: Cleared Stripe customer ID for salon ${salon.name}`);
    console.log(`   Previous customer ID: ${previousCustomerId || 'NONE'}`);

    res.json({
      success: true,
      message: 'Stripe customer ID reset successfully',
      salon: {
        name: salon.name,
        email: salon.email,
      },
      previousCustomerId: previousCustomerId,
      newCustomerId: null,
      nextStep: 'Make a subscription payment - system will auto-sync the new customer on redirect',
    });
  } catch (error) {
    console.error('Error resetting Stripe:', error.message);
    res.status(500).json({ error: 'Failed to reset Stripe', details: error.message });
  }
});

/**
 * POST /api/profile/reset-all-stripe
 * ADMIN: Reset ALL salons' Stripe customer IDs - useful for testing
 * WARNING: This clears stripe_customer_id from ALL salons
 */
router.post('/reset-all-stripe', async (req, res) => {
  try {
    // Get all salons first to log them
    const { rows: allSalons } = await db.query(
      'SELECT id, name, email, stripe_customer_id FROM salons WHERE stripe_customer_id IS NOT NULL'
    );

    console.log(`🔄 RESET ALL: Clearing Stripe customer IDs for ${allSalons.length} salon(s)`);
    allSalons.forEach(s => {
      console.log(`   - ${s.name} (${s.email}): ${s.stripe_customer_id}`);
    });

    // Reset ALL stripe_customer_id to NULL
    const result = await db.query(
      'UPDATE salons SET stripe_customer_id = NULL WHERE stripe_customer_id IS NOT NULL RETURNING id, name, email'
    );

    console.log(`✅ Reset complete: ${result.rows.length} salon(s) updated`);

    res.json({
      success: true,
      message: `Reset Stripe customer IDs for ${result.rows.length} salon(s)`,
      salonsReset: result.rows,
      nextStep: 'Each salon can now make a subscription payment - system will auto-sync the new customer on redirect',
    });
  } catch (error) {
    console.error('Error resetting all Stripe:', error.message);
    res.status(500).json({ error: 'Failed to reset Stripe', details: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get profile data
router.get('/', async (req, res) => {
  try {
    const { salonId } = req.auth;
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { rows } = await db.query('SELECT name, phone, email, salon_image_url, subscription_status FROM salons WHERE id = $1', [salonId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile data
router.put('/', upload.single('salonImage'), async (req, res) => {
  try {
    const { salonId } = req.auth;
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, phone, email } = req.body;

    let salonImageUrl = req.body.salon_image_url; // Keep existing image if not updated

    if (req.file) {
      salonImageUrl = `/uploads/${req.file.filename}`;
    }

    const { rows } = await db.query(
      'UPDATE salons SET name = $1, phone = $2, email = $3, salon_image_url = $4 WHERE id = $5 RETURNING *',
      [name, phone, email, salonImageUrl, salonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

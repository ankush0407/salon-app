// Load environment variables from .env file
if (process.env.NODE_ENV) {
  require('dotenv').config({ path: __dirname + `/.env.${process.env.NODE_ENV}` });
  console.log(`✅ Loaded environment from .env.${process.env.NODE_ENV}`);
} else {
  require('dotenv').config({ path: __dirname + '/.env' });
  console.log('✅ Loaded environment from .env');
}

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const subscriptionRoutes = require('./routes/subscriptions');
const subscriptionTypesRoutes = require('./routes/subscriptionTypes');
const dashboardRoutes = require('./routes/dashboard');
const clerkCustomerRoutes = require('./routes/customer');
const profileRoutes = require('./routes/profile');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://salon-subscription-app.vercel.app',
    'https://salon-subscription-app-*.vercel.app',
    'https://salon-app-liard.vercel.app',
    'https://www.markmyvisit.com',
    /\.vercel\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription-types', subscriptionTypesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customer', clerkCustomerRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Salon API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Load environment variables
require('dotenv').config({ path: `${__dirname}/.env.${process.env.NODE_ENV || 'development'}` });

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
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
}));

app.use(express.json());
app.use(express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/subscription-types', require('./routes/subscriptionTypes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/profile', require('./routes/profile'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Salon API running' }));

// Error handler
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
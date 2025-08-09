const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adsRoutes = require('./routes/ads');
const tasksRoutes = require('./routes/tasks');
const referralsRoutes = require('./routes/referrals');
const withdrawalsRoutes = require('./routes/withdrawals');
const adminRoutes = require('./routes/admin');

// Import models for initialization
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for Telegram Web App
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://telegram.org', 'https://t.me'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize database with default tasks
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await Task.initializeDefaultTasks();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`💰 Minimum withdrawal: ${process.env.MINIMUM_WITHDRAWAL} TRX`);
  console.log(`📺 Ad reward: ${process.env.AD_REWARD} TRX`);
  console.log(`👥 Referral reward: ${process.env.REFERRAL_REWARD} TRX`);
  
  // Initialize database
  await initializeDatabase();
});

module.exports = app;
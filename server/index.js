const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const authRoutes = require('./routes/authRoutes');
const settingRoutes = require('./routes/settingRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const reportRoutes = require('./routes/reportRoutes');
const backupRoutes = require('./routes/backupRoutes');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows inline images/SVGs for voucher printing
  crossOriginEmbedderPolicy: false
}));

// Rate limiter for login to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per IP per window
  message: {
    success: false,
    error: 'धेरै पटक गलत लगइन प्रयास भयो। कृपया केही समयपछि पुन: प्रयास गर्नुहोस्। (Too many login attempts. Please try again later.)'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter for DoS protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // 2000 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);

// General Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Positive Saving & Credit Co-operative Ltd. - Digital Voucher & Internal Accounting Control System',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend production build if available
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Express 5 compliant fallback
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` Positive Saving & Credit Co-operative Ltd. - Accounting System `);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Database: SQLite (WAL Enabled, Foreign Keys On)`);
  console.log(`================================================================`);
});

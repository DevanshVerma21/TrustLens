import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve .env from the repo root (one level above /server)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes        from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';

// ── Middleware ────────────────────────────────────────────────────────────────
import { globalRateLimiter } from './middleware/rateLimiter.js';

// ── App setup ─────────────────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ],
    methods: ['GET', 'POST'],
  },
});

// ── Security headers (lightweight, no helmet dependency) ─────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));            // prevent JSON bombs
app.use(express.urlencoded({ extended: true }));
app.use(globalRateLimiter);                          // site-wide 200 req / 15 min

// ── MongoDB ───────────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustlens');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

// ── Socket.io ─────────────────────────────────────────────────────────────────
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`📱 Client connected: ${socket.id}`);

  socket.on('userConnected', (userId) => {
    activeUsers.set(socket.id, userId);
    console.log(`👤 User ${userId} connected (socket ${socket.id})`);
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    console.log(`📱 Client disconnected: ${socket.id}`);
  });

  // Legacy relay — client can still push transactionAlert events
  socket.on('transactionAlert', (data) => {
    console.log('🔔 Transaction Alert relay:', data);
    io.emit('fraudDetected', data);
  });
});

// Attach io to every request so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:     'OK',
    timestamp:  new Date().toISOString(),
    mongodb:    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime:     Math.round(process.uptime()) + 's',
  });
});

// ── Welcome ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message:  'TrustLens — Explainable AI Layer for Digital Banking',
    version:  '2.0.0',
    security: 'JWT + bcrypt + rate-limiting + Joi validation',
    endpoints: {
      register:            'POST /api/auth/register',
      login:               'POST /api/auth/login',
      refresh:             'POST /api/auth/refresh',
      logout:              'POST /api/auth/logout',
      me:                  'GET  /api/auth/me',
      submitTransaction:   'POST /api/transactions',
      getUserTransactions: 'GET  /api/transactions/user/:userId',
      getTrustScore:       'GET  /api/transactions/trust-score/:userId',
      getFraudLog:         'GET  /api/transactions/fraud-log/:transactionId',
      health:              'GET  /api/health',
    },
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err);
  res.status(500).json({ error: 'InternalError', message: err.message || 'Internal Server Error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: `Route ${req.method} ${req.path} not found` });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 TrustLens v2.0 — port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔐 Auth:   POST /api/auth/register | /login | /refresh`);
  console.log(`📡 WS:     ws://localhost:${PORT}`);
});

export { io, app };

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase } from './database/db.js';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize database
const db = initDatabase();

// Ensure default API key exists
import { ensureDefaultAPIKey } from './utils/crypto.js';
ensureDefaultAPIKey();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  const dbHealthy = db.isHealthy();
  const dbStats = db.getStats();
  
  res.json({
    ready: dbHealthy,
    checks: {
      server: true,
      database: dbHealthy,
      whatsapp: false, // TODO: implement WhatsApp check
    },
    database: dbStats,
    timestamp: new Date().toISOString(),
  });
});

// API status endpoint
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'YesApp WhatsApp API v1',
    version: '1.0.0',
    status: 'operational',
  });
});

// API Routes
import sessionsRoutes from './api/sessions.js';
import messagesRoutes from './api/messages.js';
import groupsRoutes from './api/groups.js';

app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/sessions', messagesRoutes);
app.use('/api/v1/sessions', groupsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 YesApp WhatsApp API');
  console.log('━'.repeat(50));
  console.log(`📊 Server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API Status: http://localhost:${PORT}/api/v1/status`);
  console.log('━'.repeat(50));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

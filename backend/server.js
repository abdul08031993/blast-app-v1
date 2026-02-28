const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();
console.log('✅ Express app created');
// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 PORT:', process.env.PORT);
console.log('🔍 MONGO_URL exists:', !!process.env.MONGO_URL);
console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Middleware dengan logging
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(cors());
console.log('✅ CORS middleware');

app.use(express.json());
console.log('✅ JSON middleware');

app.use(express.urlencoded({ extended: true }));
console.log('✅ URL encoded middleware');

// Static files
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin/index.html')));
app.use('/user', express.static(path.join(__dirname, '../frontend/user/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
console.log('✅ Static files middleware');

// Test route untuk cek server
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  res.json({ message: 'Server is working!' });
});

// Routes
console.log('📌 Registering routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');

app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes registered');

app.use('/api/user', userRoutes);
console.log('✅ User routes registered');

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to database
console.log('📌 Connecting to database...');
connectDB();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // atau '::' untuk IPv6

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Admin URL: http://localhost:${PORT}/admin (for local)`);
  console.log(`👤 User URL: http://localhost:${PORT}/user (for local)`);
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  console.log('✅ Server ready to accept requests from Railway proxy');
});

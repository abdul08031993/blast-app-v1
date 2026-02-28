const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 PORT:', process.env.PORT);
console.log('🔍 MONGO_URL exists:', !!process.env.MONGO_URL);
console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();
console.log('✅ Express app created');

// ========== DEBUG PATH ==========
console.log('\n========== DEBUG PATH ==========');
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

const possiblePaths = [
  path.join(__dirname, '../frontend'),
  path.join(__dirname, 'frontend'),
  '/app/frontend',
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), '../frontend')
];

possiblePaths.forEach((p, i) => {
  console.log(`\nPath ${i+1}: ${p}`);
  console.log(`  Exists: ${fs.existsSync(p)}`);
  if (fs.existsSync(p)) {
    console.log(`  Contents:`, fs.readdirSync(p));
    // Cek isi folder admin dan user
    const adminPath = path.join(p, 'admin');
    const userPath = path.join(p, 'user');
    const assetsPath = path.join(p, 'assets');
    
    if (fs.existsSync(adminPath)) {
      console.log(`  Admin folder contents:`, fs.readdirSync(adminPath));
    }
    if (fs.existsSync(userPath)) {
      console.log(`  User folder contents:`, fs.readdirSync(userPath));
    }
    if (fs.existsSync(assetsPath)) {
      console.log(`  Assets folder contents:`, fs.readdirSync(assetsPath));
    }
  }
});
console.log('========== END DEBUG ==========\n');

// ========== TENTUKAN PATH FRONTEND YANG VALID ==========
let frontendPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'admin')) && fs.existsSync(path.join(p, 'user'))) {
    frontendPath = p;
    console.log(`✅ Frontend path ditemukan: ${frontendPath}`);
    break;
  }
}

// Fallback kalau tidak ditemukan
if (!frontendPath) {
  frontendPath = path.join(__dirname, '../frontend');
  console.log(`⚠️ Menggunakan fallback path: ${frontendPath}`);
}

// Middleware dengan logging
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  next();
});

app.use(cors());
console.log('✅ CORS middleware');

app.use(express.json());
console.log('✅ JSON middleware');

app.use(express.urlencoded({ extended: true }));
console.log('✅ URL encoded middleware');

// ========== STATIC FILES ==========
// Serve static files dari folder yang benar
app.use('/assets', express.static(path.join(frontendPath, 'assets')));
console.log('✅ Assets static middleware');

// ========== ROUTES MANUAL UNTUK HTML ==========
// Halaman Admin
app.get('/admin', (req, res) => {
  const filePath = path.join(frontendPath, 'admin', 'index.html');
  console.log(`📄 Serving admin login: ${filePath}`);
  res.sendFile(filePath);
});

app.get('/admin/dashboard', (req, res) => {
  const filePath = path.join(frontendPath, 'admin', 'dashboard.html');
  console.log(`📄 Serving admin dashboard: ${filePath}`);
  res.sendFile(filePath);
});

// Halaman User
app.get('/user', (req, res) => {
  const filePath = path.join(frontendPath, 'user', 'index.html');
  console.log(`📄 Serving user login: ${filePath}`);
  res.sendFile(filePath);
});

app.get('/user/dashboard', (req, res) => {
  const filePath = path.join(frontendPath, 'user', 'dashboard.html');
  console.log(`📄 Serving user dashboard: ${filePath}`);
  res.sendFile(filePath);
});

app.get('/user/register', (req, res) => {
  const filePath = path.join(frontendPath, 'user', 'register.html');
  console.log(`📄 Serving user register: ${filePath}`);
  res.sendFile(filePath);
});

// Test route untuk cek server
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  res.json({ message: 'Server is working!' });
});

// Routes API
console.log('\n📌 Registering API routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');

app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes registered');

app.use('/api/user', userRoutes);
console.log('✅ User routes registered');

// ========== 404 HANDLER ==========
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  
  // Cek apakah request untuk file HTML
  if (req.url.endsWith('.html')) {
    const filePath = path.join(frontendPath, req.url);
    if (fs.existsSync(filePath)) {
      console.log(`📄 File exists tapi route tidak terdaftar: ${filePath}`);
      return res.sendFile(filePath);
    }
  }
  
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to database
console.log('\n📌 Connecting to database...');
connectDB();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Admin login: https://blast-app-v1-production.up.railway.app/admin`);
  console.log(`📊 Admin dashboard: https://blast-app-v1-production.up.railway.app/admin/dashboard`);
  console.log(`👤 User login: https://blast-app-v1-production.up.railway.app/user`);
  console.log(`👤 User dashboard: https://blast-app-v1-production.up.railway.app/user/dashboard`);
  console.log(`👤 User register: https://blast-app-v1-production.up.railway.app/user/register`);
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  console.log('✅ Server ready to accept requests from Railway proxy');
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');

// Import routes
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();
console.log('✅ Express app created');

// ========== PATH UNTUK RAILWAY (Root Directory = backend) ==========
console.log('\n========== PATH DEBUG ==========');
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

// Dengan Root Directory = backend, frontend berada di ../frontend
const frontendPath = path.join(__dirname, '../frontend');
console.log('Frontend path:', frontendPath);

// Cek apakah frontend ada
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend folder ditemukan!');
  console.log('Isi frontend:', fs.readdirSync(frontendPath));
  
  // Cek folder admin
  const adminPath = path.join(frontendPath, 'admin');
  if (fs.existsSync(adminPath)) {
    console.log('✅ Admin folder ditemukan');
    console.log('Isi admin:', fs.readdirSync(adminPath));
  }
  
  // Cek folder user
  const userPath = path.join(frontendPath, 'user');
  if (fs.existsSync(userPath)) {
    console.log('✅ User folder ditemukan');
    console.log('Isi user:', fs.readdirSync(userPath));
  }
} else {
  console.log('❌ Frontend folder TIDAK ditemukan di:', frontendPath);
}
console.log('========== END DEBUG ==========\n');

// Middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// ========== ROUTES UNTUK HTML ==========
// Halaman Admin
app.get('/admin', (req, res) => {
  const filePath = path.join(frontendPath, 'admin', 'index.html');
  console.log(`📄 Serving admin login: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send(`
      <html>
        <body>
          <h1>404 - File Not Found</h1>
          <p>Tried: ${filePath}</p>
          <p>Frontend path: ${frontendPath}</p>
          <p>Current directory: ${process.cwd()}</p>
        </body>
      </html>
    `);
  }
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html'));
});

// Halaman User
app.get('/user', (req, res) => {
  res.sendFile(path.join(frontendPath, 'user', 'index.html'));
});

app.get('/user/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'user', 'dashboard.html'));
});

app.get('/user/register', (req, res) => {
  res.sendFile(path.join(frontendPath, 'user', 'register.html'));
});

// Test route
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    frontendPath: frontendPath,
    frontendExists: fs.existsSync(frontendPath),
    cwd: process.cwd(),
    dirname: __dirname
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Admin login: https://blast-app-v1-production.up.railway.app/admin`);
  console.log(`👤 User login: https://blast-app-v1-production.up.railway.app/user`);
});

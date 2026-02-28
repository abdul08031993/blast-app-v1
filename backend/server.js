const express = require('express');
const path = require('path');
const fs = require('fs'); // Tambah ini
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const app = express();

// Konek ke database
connectDB();

// ========== DEBUG STATIC FILES ==========
console.log('\n========== STATIC FILES DEBUG ==========');
console.log('Current directory:', __dirname);
console.log('Frontend path:', path.join(__dirname, '../frontend'));

// Cek apakah folder frontend ada
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend folder ditemukan!');
  console.log('Isi frontend:', fs.readdirSync(frontendPath));
  
  // Cek folder admin
  const adminPath = path.join(frontendPath, 'admin');
  if (fs.existsSync(adminPath)) {
    console.log('✅ Admin folder ditemukan');
    console.log('Isi admin:', fs.readdirSync(adminPath));
  } else {
    console.log('❌ Admin folder TIDAK ditemukan');
  }
  
  // Cek folder user
  const userPath = path.join(frontendPath, 'user');
  if (fs.existsSync(userPath)) {
    console.log('✅ User folder ditemukan');
    console.log('Isi user:', fs.readdirSync(userPath));
  } else {
    console.log('❌ User folder TIDAK ditemukan');
  }
} else {
  console.log('❌ Frontend folder TIDAK ditemukan!');
}
console.log('========== END DEBUG ==========\n');

// Serve static files dengan logging
app.use('/admin', (req, res, next) => {
  console.log(`📨 Request ke /admin: ${req.url}`);
  next();
}, express.static(path.join(__dirname, '../frontend/admin')));

app.use('/user', (req, res, next) => {
  console.log(`📨 Request ke /user: ${req.url}`);
  next();
}, express.static(path.join(__dirname, '../frontend/user')));

app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Route untuk test database
app.get('/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({
      status: 'success',
      database: {
        state: states[dbState] || 'unknown',
        connected: dbState === 1,
        name: mongoose.connection.name || 'test'
      },
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route untuk test
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server jalan!',
    env: {
      node_env: process.env.NODE_ENV,
      mongodb_uri_set: !!process.env.MONGODB_URI
    }
  });
});

// Route untuk cek environment
app.get('/env', (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    PORT: process.env.PORT
  };
  res.json(safeEnv);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
  console.log(`👤 User: http://localhost:${PORT}/user`);
  console.log(`🔍 Test DB: http://localhost:${PORT}/test-db`);
});

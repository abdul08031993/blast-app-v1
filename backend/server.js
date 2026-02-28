const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const app = express();

// Konek ke database
connectDB();

// ========== DEBUG STATIC FILES ==========
console.log('\n========== STATIC FILES DEBUG ==========');
console.log('Current directory:', __dirname);
console.log('Current working dir:', process.cwd());

// Path yang benar untuk Railway
const frontendPath = path.join('/app', 'frontend');
console.log('Frontend path:', frontendPath);

// Cek apakah frontend ada
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend folder DITEMUKAN!');
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
  console.log('❌ Frontend folder TIDAK ditemukan di:', frontendPath);
  
  // Coba path alternatif
  const altPath = path.join(process.cwd(), 'frontend');
  console.log('Mencoba alternatif:', altPath);
  if (fs.existsSync(altPath)) {
    console.log('✅ Ditemukan di alternatif!');
    console.log('Isi:', fs.readdirSync(altPath));
  }
}
console.log('========== END DEBUG ==========\n');

// Serve static files dari folder public
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/user', express.static(path.join(__dirname, 'public/user')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
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

const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // <-- INI YANG KURANG!
const connectDB = require('./config/database');

const app = express();

// Konek ke database (tapi tidak wajib untuk static files)
connectDB();

// Route untuk test database dengan error handling
app.get('/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    // Coba query sederhana untuk test koneksi
    let dbStatus = states[dbState] || 'unknown';
    let canQuery = false;
    
    if (dbState === 1) { // connected
      try {
        // Coba jalanin query sederhana
        const collections = await mongoose.connection.db.listCollections().toArray();
        canQuery = true;
        console.log('✅ Database query berhasil, collections:', collections.length);
      } catch (queryErr) {
        console.error('❌ Query error:', queryErr.message);
      }
    }
    
    res.json({
      status: 'success',
      database: {
        state: dbStatus,
        connected: dbState === 1,
        canQuery: canQuery,
        name: mongoose.connection.name || 'unknown'
      },
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      mongodb_uri_preview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 30) + '...' : 'not set',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error in /test-db:', err);
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

// Route untuk cek environment variables (aman)
app.get('/env', (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    SESSION_SECRET_EXISTS: !!process.env.SESSION_SECRET,
    PORT: process.env.PORT
  };
  res.json(safeEnv);
});

// Serve file static dari frontend
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/user', express.static(path.join(__dirname, '../frontend/user')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
  console.log(`👤 User: http://localhost:${PORT}/user`);
  console.log(`🔍 Test DB: http://localhost:${PORT}/test-db`);
});

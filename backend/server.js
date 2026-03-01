const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// Middleware untuk parse JSON (PENTING UNTUK LOGIN!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect ke database
connectDB();

// Route test sederhana
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server jalan!',
    timestamp: new Date().toISOString()
  });
});

// Route untuk halaman admin
app.get('/admin', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'admin.html');
    console.log('Mencoba baca:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('File admin.html tidak ditemukan');
    }
});

// Route untuk halaman user
app.get('/user', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'user.html');
    console.log('Mencoba baca:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('File user.html tidak ditemukan');
    }
});

// Route untuk register user
app.get('/user/register', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'register.html');
    console.log('Mencoba baca:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('File register.html tidak ditemukan');
    }
});

// API Routes (PENTING UNTUK LOGIN!)
app.use('/api/auth', authRoutes);

// Route untuk test koneksi database
app.get('/debug-db', async (req, res) => {
  try {
    console.log('🔍 Debug DB - Mencoba konek...');
    
    if (!mongoose) {
      return res.json({ error: 'mongoose is not defined' });
    }
    
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    const info = {
      mongoose_defined: !!mongoose,
      env: {
        MONGO_URL_exists: !!process.env.MONGO_URL,
        MONGODB_URI_exists: !!process.env.MONGODB_URI,
        NODE_ENV: process.env.NODE_ENV
      },
      connection: null,
      error: null
    };
    
    const conn = await mongoose.createConnection(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      authSource: 'admin',
      dbName: 'blast_app'
    });
    
    await conn.asPromise();
    
    info.connection = {
      status: '✅ CONNECTED',
      host: conn.host,
      name: conn.name
    };
    
    await conn.close();
    res.json(info);
    
  } catch (error) {
    console.error('❌ Debug DB Error:', error);
    res.json({
      error: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);
    console.log(`👤 User: http://localhost:${PORT}/user`);
    console.log(`🔍 Test: http://localhost:${PORT}/test`);
});

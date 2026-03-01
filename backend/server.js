const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose')
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Route untuk test koneksi database dari dalam Railway
app.get('/debug-db', async (req, res) => {
  try {
    console.log('🔍 Debug DB - Mencoba konek...');
    
    // Cek mongoose dulu
    if (!mongoose) {
      return res.json({ error: 'mongoose is not defined - missing require' });
    }
    
    // Cek environment variable
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    const info = {
      mongoose_defined: !!mongoose,
      env: {
        MONGO_URL_exists: !!process.env.MONGO_URL,
        MONGODB_URI_exists: !!process.env.MONGODB_URI,
        MONGO_URL_value: process.env.MONGO_URL ? '✅ ada' : '❌ tidak ada',
        NODE_ENV: process.env.NODE_ENV
      },
      connection: null,
      error: null
    };
    
    // Coba konek dengan opsi yang tepat
    const conn = await mongoose.createConnection(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      authSource: 'admin', // Penting untuk Railway
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
      name: error.name,
      stack: error.stack
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);
    console.log(`👤 User: http://localhost:${PORT}/user`);
});

const express = require('express');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// Konek ke database (tapi tidak wajib untuk static files)
connectDB();

// Route untuk test database
app.get('/test-db', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    database: states[dbState] || 'unknown',
    mongodb_uri_exists: !!process.env.MONGODB_URI
  });
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

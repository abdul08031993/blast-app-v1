const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();
console.log('✅ Express app created');

// ========== PATH YANG BENAR UNTUK RAILWAY ==========
console.log('\n========== PATH DEBUG ==========');
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

// Path yang benar: dari /app/backend ke /app/frontend
const frontendPath = path.resolve(__dirname, '../frontend');
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
  
  // Coba cari di lokasi alternatif
  const altPath = path.join('/app', 'frontend');
  console.log('Mencoba alternatif:', altPath);
  if (fs.existsSync(altPath)) {
    console.log('✅ Frontend ditemukan di:', altPath);
  }
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

// ========== SERVE STATIC FILES ==========
// Coba serve dari berbagai lokasi
const possibleFrontendPaths = [
  frontendPath,
  path.join('/app', 'frontend'),
  path.join(process.cwd(), 'frontend'),
  path.join(__dirname, '../frontend')
];

let activeFrontendPath = null;
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(p)) {
    activeFrontendPath = p;
    console.log(`✅ Menggunakan frontend path: ${activeFrontendPath}`);
    break;
  }
}

if (!activeFrontendPath) {
  console.log('❌ TIDAK ADA frontend path yang valid!');
  activeFrontendPath = '/app/frontend'; // Fallback
}

// Serve assets
const assetsPath = path.join(activeFrontendPath, 'assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath));
}

// ========== ROUTES UNTUK HTML ==========
// Helper function
function serveHTML(res, relativePath) {
  const filePath = path.join(activeFrontendPath, relativePath);
  console.log(`📄 Mencoba serve: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Coba path alternatif
    const altPath = path.join('/app', 'frontend', relativePath);
    if (fs.existsSync(altPath)) {
      console.log(`✅ Ditemukan di alternatif: ${altPath}`);
      res.sendFile(altPath);
    } else {
      res.status(404).send(`
        <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>404 - File Not Found</h1>
            <p>Tried: ${filePath}</p>
            <p>Alternative: ${altPath}</p>
            <p>Active frontend path: ${activeFrontendPath}</p>
            <p>__dirname: ${__dirname}</p>
            <p>cwd: ${process.cwd()}</p>
          </body>
        </html>
      `);
    }
  }
}

// Admin routes
app.get('/admin', (req, res) => serveHTML(res, 'admin/index.html'));
app.get('/admin/dashboard', (req, res) => serveHTML(res, 'admin/dashboard.html'));

// User routes
app.get('/user', (req, res) => serveHTML(res, 'user/index.html'));
app.get('/user/dashboard', (req, res) => serveHTML(res, 'user/dashboard.html'));
app.get('/user/register', (req, res) => serveHTML(res, 'user/register.html'));

// Test route
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    frontendPath: activeFrontendPath,
    frontendExists: fs.existsSync(activeFrontendPath),
    cwd: process.cwd(),
    dirname: __dirname,
    possiblePaths: possibleFrontendPaths.map(p => ({
      path: p,
      exists: fs.existsSync(p)
    }))
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
  console.log(`📅 ${new Date().toLocaleString()}\n`);
});
